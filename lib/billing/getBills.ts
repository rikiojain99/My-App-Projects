import Bill from "@/models/Bill";
import Customer from "@/models/Customer";

export async function getBillsByMobile(mobile: string) {
  const customer = await Customer.findOne({ mobile });

  if (!customer) {
    return [];
  }

  return await Bill.find({
    customerId: customer._id,
    deleted: false,
  })
    .populate("customerId")
    .sort({ createdAt: -1 })
    .limit(10);
}

export async function getPaginatedBills(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const bills = await Bill.find({ deleted: false })
    .populate("customerId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalBills = await Bill.countDocuments({
    deleted: false,
  });

  return {
    bills,
    totalBills,
    totalPages: Math.ceil(totalBills / limit),
    currentPage: page,
  };
}
