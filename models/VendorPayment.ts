import mongoose, { Schema, Document } from "mongoose";

export interface IVendorPayment extends Document {
  vendorId: mongoose.Types.ObjectId;
  amount: number;
  note?: string;
  createdAt: Date;
}

const VendorPaymentSchema = new Schema<IVendorPayment>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.VendorPayment ||
  mongoose.model<IVendorPayment>(
    "VendorPayment",
    VendorPaymentSchema
  );
