import Bill from "@/models/Bill";
import Customer from "@/models/Customer";
import {
  ensureItemsExist,
  validateStock,
  deductStock,
} from "./stock";

export async function createBill(body: any) {
  const {
    mobile,
    items,
    grandTotal,
    discount,
    finalTotal,
    billNo,
    paymentMode,
    cashAmount,
    upiAmount,
    upiId,
    upiAccount,
  } = body;

  // 1️⃣ Find customer
  const customer = await Customer.findOne({ mobile });
  if (!customer) {
    throw new Error("Customer not found");
  }

  // 2️⃣ Stock logic
  await ensureItemsExist(items);
  await validateStock(items);
  await deductStock(items);

  // 3️⃣ Create bill
  return await Bill.create({
    billNo,
    customerId: customer._id,
    items,
    grandTotal,
    discount: discount ?? 0,
    finalTotal,
    paymentMode,
    cashAmount: cashAmount ?? 0,
    upiAmount: upiAmount ?? 0,
    upiId: upiId ?? null,
    upiAccount: upiAccount ?? null,
  });
}
