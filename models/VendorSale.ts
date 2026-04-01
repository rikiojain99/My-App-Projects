import mongoose, { Schema, Document } from "mongoose";

export interface IVendorSale extends Document {
  vendorId: mongoose.Types.ObjectId;
  items: {
    name: string;
    qty: number;
    rate: number;
    total: number;
  }[];
  deliveryPerson: string;
  deliveredBy?: string;
  grandTotal: number;
  discount: number;
  finalTotal: number;
  paymentType?: "paid" | "credit";
  paymentMethod?: "cash" | "upi" | "split" | null;
  oldBalance?: number;
  newBalance?: number;
  cashAmount?: number;
  upiAmount?: number;
  cashPaid: number;
  creditAmount: number;
  isPaid: boolean;
}

const VendorSaleSchema = new Schema<IVendorSale>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    items: [
      {
        name: { type: String, required: true, trim: true },
        qty: { type: Number, required: true, min: 0 },
        rate: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    deliveryPerson: String,
    deliveredBy: String,
    grandTotal: Number,
    discount: Number,
    finalTotal: Number,
    paymentType: {
      type: String,
      enum: ["paid", "credit"],
      default: "credit",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "split", null],
      default: null,
    },
    oldBalance: { type: Number, default: 0 },
    newBalance: { type: Number, default: 0 },
    cashAmount: { type: Number, default: 0 },
    upiAmount: { type: Number, default: 0 },

    cashPaid: { type: Number, default: 0 },
    creditAmount: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.VendorSale ||
  mongoose.model<IVendorSale>("VendorSale", VendorSaleSchema);
