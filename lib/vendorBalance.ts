import { Types } from "mongoose";
import VendorPayment from "@/models/VendorPayment";
import VendorSale from "@/models/VendorSale";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toObjectId = (value: string | Types.ObjectId) =>
  typeof value === "string" ? new Types.ObjectId(value) : value;

export async function getVendorOutstandingMap(
  vendorIds: Array<string | Types.ObjectId>
) {
  const normalizedIds = Array.from(
    new Set(
      vendorIds
        .filter(Boolean)
        .map((vendorId) => String(vendorId).trim())
        .filter(Boolean)
    )
  );

  if (normalizedIds.length === 0) {
    return new Map<string, number>();
  }

  const objectIds = normalizedIds.map((vendorId) =>
    toObjectId(vendorId)
  );

  const [salesAgg, paymentsAgg] = await Promise.all([
    VendorSale.aggregate([
      {
        $match: {
          vendorId: { $in: objectIds },
        },
      },
      {
        $group: {
          _id: "$vendorId",
          totalCredit: {
            $sum: { $ifNull: ["$creditAmount", 0] },
          },
        },
      },
    ]),
    VendorPayment.aggregate([
      {
        $match: {
          vendorId: { $in: objectIds },
        },
      },
      {
        $group: {
          _id: "$vendorId",
          totalPayment: {
            $sum: { $ifNull: ["$amount", 0] },
          },
        },
      },
    ]),
  ]);

  const salesMap = new Map<string, number>();
  const paymentsMap = new Map<string, number>();

  for (const row of salesAgg) {
    salesMap.set(
      String(row._id),
      roundMoney(Number(row.totalCredit || 0))
    );
  }

  for (const row of paymentsAgg) {
    paymentsMap.set(
      String(row._id),
      roundMoney(Number(row.totalPayment || 0))
    );
  }

  return new Map(
    normalizedIds.map((vendorId) => [
      vendorId,
      roundMoney(
        (salesMap.get(vendorId) || 0) -
          (paymentsMap.get(vendorId) || 0)
      ),
    ])
  );
}

export async function getVendorOutstanding(
  vendorId: string | Types.ObjectId
) {
  const outstandingMap = await getVendorOutstandingMap([vendorId]);
  return outstandingMap.get(String(vendorId)) || 0;
}
