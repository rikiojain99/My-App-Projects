import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeKey = (value: string) => value.trim().toLowerCase();

const rankMatch = (value: string, search: string) => {
  const normalizedValue = normalizeKey(value);

  if (!normalizedValue) return 0;
  if (normalizedValue === search) return 400;
  if (normalizedValue.startsWith(search)) return 300;
  if (normalizedValue.split(/\s+/).some((part) => part.startsWith(search))) {
    return 200;
  }
  if (normalizedValue.includes(search)) return 100;

  return 0;
};

const scoreItem = (
  item: { name: string; code?: string },
  normalizedSearch: string
) => {
  const nameScore = rankMatch(item.name, normalizedSearch);
  const codeScore = item.code
    ? rankMatch(item.code, normalizedSearch) + 25
    : 0;

  return Math.max(nameScore, codeScore);
};

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get("search") || "").trim();

    if (!search) {
      return NextResponse.json([]);
    }

    const regex = escapeRegex(search);
    const normalizedSearch = normalizeKey(search);
    const items = await Item.find({
      $or: [
        { name: { $regex: regex, $options: "i" } },
        { code: { $regex: regex, $options: "i" } },
      ],
    })
      .select("name code")
      .limit(60)
      .lean();

    const mergedItems = items.map((item: any) => ({
      _id: String(item._id),
      name: String(item.name || ""),
      code: item.code ? String(item.code) : undefined,
    }));

    const seenNames = new Set(
      mergedItems.map((item) => normalizeKey(item.name))
    );

    const stockItems = await ItemStock.find({
      itemName: { $regex: regex, $options: "i" },
    })
      .select("itemName")
      .limit(60)
      .lean();

    for (const stockItem of stockItems) {
      const itemName = String(stockItem.itemName || "").trim();
      const itemKey = normalizeKey(itemName);

      if (!itemName || seenNames.has(itemKey)) continue;

      mergedItems.push({
        _id: `stock-${stockItem._id}`,
        name: itemName,
        code: undefined,
      });
      seenNames.add(itemKey);

    }

    const rankedItems = mergedItems
      .map((item) => ({
        ...item,
        _score: scoreItem(item, normalizedSearch),
      }))
      .sort((a, b) => {
        if (b._score !== a._score) {
          return b._score - a._score;
        }

        const aHasCode = a.code ? 1 : 0;
        const bHasCode = b.code ? 1 : 0;
        if (bHasCode !== aHasCode) {
          return bHasCode - aHasCode;
        }

        return a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        });
      })
      .slice(0, 25)
      .map(({ _score, ...item }) => item);

    return NextResponse.json(rankedItems);
  } catch (err) {
    console.error("Item search error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
