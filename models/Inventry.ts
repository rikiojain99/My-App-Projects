import mongoose, { Schema, Document } from "mongoose";

export interface IInventry extends Document {
  shop: number;
  name: string;
  type: string;
  cty: string;
  qty: number;
  rate: number;
}

const InventrySchema: Schema = new Schema(
  {
    shop: { type: Number, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    cty: { type: String, required: true },
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Inventry || mongoose.model<IInventry>("Inventry", InventrySchema);
