import mongoose, { Schema, Document } from "mongoose";

export interface IItemStock extends Document {
  itemName: string;
  availableQty: number;
  lastUpdated: Date;
}

const ItemStockSchema: Schema = new Schema(
  {
    itemName: { type: String, required: true, unique: true },
    availableQty: { type: Number, required: true, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.ItemStock ||
  mongoose.model<IItemStock>("ItemStock", ItemStockSchema);
