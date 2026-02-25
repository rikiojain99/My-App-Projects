import Bill from "@/models/Bill";
import Customer from "@/models/Customer";
import type { ClientSession } from "mongoose";
import {
  ensureItemsExist,
  validateStock,
  deductStock,
} from "./stock";

export async function createBill(
  body: any,
  session?: ClientSession
) {
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

  const customer = await Customer.findOne({ mobile }).session(
    session || null
  );

  if (!customer) {
    throw new Error("Customer not found");
  }

  await ensureItemsExist(items, session);
  await validateStock(items, session);
  await deductStock(items, session);

  const [bill] = await Bill.create(
    [
      {
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
      },
    ],
    { session }
  );

  return bill;
}
