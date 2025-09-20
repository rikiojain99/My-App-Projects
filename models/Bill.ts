import mongoose, { Schema, Document } from "mongoose";

export interface IBill extends Document {
  billNo: string; // ✅ added bill number
  customerId: mongoose.Types.ObjectId;
  items: { name: string; qty: number; rate: number; total: number }[];
  grandTotal: number;
  deleted: boolean;
}

const BillSchema: Schema = new Schema(
  {
    billNo: { type: String, required: true, unique: true }, // ✅ hidden bill number
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    items: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        rate: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    grandTotal: { type: Number, required: true },
     deleted: { type: Boolean, default: false }, // 🔹 soft delete flag
  },
  { timestamps: true }
);

export default mongoose.models.Bill ||
  mongoose.model<IBill>("Bill", BillSchema);
