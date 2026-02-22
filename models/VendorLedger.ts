import mongoose, { Schema, Document } from "mongoose";

export interface IVendorLedger extends Document {
  vendorId: mongoose.Types.ObjectId;
  type: "SALE" | "PAYMENT";
  amount: number;
  balanceAfter: number;
  referenceId?: mongoose.Types.ObjectId;
}

const VendorLedgerSchema = new Schema<IVendorLedger>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    type: { type: String, enum: ["SALE", "PAYMENT"], required: true },
    amount: Number,
    balanceAfter: Number,
    referenceId: Schema.Types.ObjectId,
  },
  { timestamps: true }
);

export default mongoose.models.VendorLedger ||
  mongoose.model<IVendorLedger>("VendorLedger", VendorLedgerSchema);
