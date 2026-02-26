import mongoose, { Schema, Document } from "mongoose";

export interface IManufacturing extends Document {
  productName: string;
  producedQty: number;
  inputs: {
    itemName: string;
    qtyUsed: number;
    rate: number;
    cost: number;
    fromStock?: boolean;
  }[];
  totalCost: number;
  costPerUnit: number;
  createdAt: Date;
}

const ManufacturingSchema = new Schema(
  {
    productName: { type: String, required: true },
    producedQty: { type: Number, required: true },
    inputs: [
      {
        itemName: { type: String, required: true },
        qtyUsed: { type: Number, required: true },
        rate: { type: Number, required: true },
        cost: { type: Number, required: true },
        fromStock: { type: Boolean, default: true },
      },
    ],
    totalCost: { type: Number, required: true },
    costPerUnit: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Manufacturing ||
  mongoose.model<IManufacturing>("Manufacturing", ManufacturingSchema);
