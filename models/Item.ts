import mongoose, { Schema, Document } from "mongoose";

export interface IItem extends Document {
  name: string;
}

const ItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);
