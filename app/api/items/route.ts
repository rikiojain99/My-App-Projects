import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";
import VendorSale from "@/models/VendorSale";

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
    const recent = searchParams.get("recent") === "1";
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 8), 1),
      25
    );

    if (recent) {
      const recentItems = await VendorSale.aggregate([
        { $unwind: "$items" },
        {
          $match: {
            "items.name": {
              $type: "string",
              $ne: "",
            },
          },
        },
        {
          $group: {
            _id: "$items.name",
            name: { $first: "$items.name" },
            count: { $sum: 1 },
            lastUsedAt: { $max: "$createdAt" },
          },
        },
        {
          $sort: {
            lastUsedAt: -1,
            count: -1,
          },
        },
        { $limit: limit },
      ]);

      if (recentItems.length > 0) {
        return NextResponse.json(
          recentItems.map((item, index) => ({
            _id: `recent-${index}-${String(item.name).trim()}`,
            name: String(item.name).trim(),
          }))
        );
      }

      const stockItems = await ItemStock.find()
        .select("itemName")
        .sort({ lastUpdated: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      return NextResponse.json(
        stockItems
          .map((item: any, index: number) => ({
            _id: `stock-recent-${index}-${String(
              item.itemName || ""
            ).trim()}`,
            name: String(item.itemName || "").trim(),
          }))
          .filter((item) => item.name.length > 0)
      );
    }

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
