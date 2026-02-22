import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  name: string;
  mobile: string;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Vendor ||
  mongoose.model<IVendor>("Vendor", VendorSchema);
