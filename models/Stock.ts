import mongoose, { Schema, Document } from "mongoose";

export interface IStock extends Document {
  vendorName: string;
  purchaseDate: Date;
  items: {
    name: string;
    qty: number;
    rate: number;
    total: number;
  }[];
  grandTotal: number;
  extraExpense: { type: Number, default: 0 }, // ✅ NEW

}

const StockSchema: Schema = new Schema(
  {
    vendorName: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    items: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        rate: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    grandTotal: { type: Number, required: true },
  extraExpense: { type: Number, default: 0 }, // ✅ NEW

  },
  { timestamps: true }
);

export default mongoose.models.Stock ||
  mongoose.model<IStock>("Stock", StockSchema);
    