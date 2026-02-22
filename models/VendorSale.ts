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
  grandTotal: number;
  discount: number;
  finalTotal: number;

  cashPaid: number;
  creditAmount: number;
  isPaid: boolean;
}

const VendorSaleSchema = new Schema<IVendorSale>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    items: [],
    deliveryPerson: String,
    grandTotal: Number,
    discount: Number,
    finalTotal: Number,

    cashPaid: { type: Number, default: 0 },
    creditAmount: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.VendorSale ||
  mongoose.model<IVendorSale>("VendorSale", VendorSaleSchema);
