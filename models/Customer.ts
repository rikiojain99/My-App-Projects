import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  type: string;
  city: string;
  mobile: string;
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    city: { type: String },
    mobile: { type: String, required: true, unique: true }, // mobile must be unique
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);

  