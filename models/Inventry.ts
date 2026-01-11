import mongoose, { Schema, Document } from "mongoose";

export interface IInventry extends Document {
  shop: string;
  name: string;
  type: string;
  category: string;
  qty: number;
  rate: number;
}

const InventrySchema: Schema = new Schema(
  {
    shop: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    category: { type: String, required: true },
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Inventry || mongoose.model<IInventry>("Inventry", InventrySchema);
