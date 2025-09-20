import { Schema, model, models } from "mongoose";

const PurchaseSchema = new Schema({
  itemName: { type: String, required: true },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  total: { type: Number, required: true },
});

const BillSchema = new Schema(
  {
    customerName: { type: String, required: true },
    customerType: { type: String, required: true },
    city: { type: String, required: true },
    mobile: { type: String, required: true },
    purchases: [PurchaseSchema],
    grandTotal: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Bill = models.Bill || model("Bill", BillSchema);
export default Bill;
