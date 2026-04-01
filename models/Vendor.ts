import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  name: string;
  mobile: string;
  city?: string;
  balance: number;
  totalCredit: number;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
      index: true,
    },
    totalCredit: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Vendor ||
  mongoose.model<IVendor>("Vendor", VendorSchema);
