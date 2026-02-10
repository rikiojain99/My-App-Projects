import mongoose, { Schema, Document } from "mongoose";

export interface IBill extends Document {
  billNo: string;
  customerId: mongoose.Types.ObjectId;
  items: {
    name: string;
    qty: number;
    rate: number;
    total: number;
  }[];
  grandTotal: number;
  discount: number;
  finalTotal: number;
  paymentMode: "cash" | "upi" | "split";
  cashAmount: number;
  upiAmount: number;
  upiId: string | null;
  upiAccount: string | null;
  deleted: boolean;
}

const BillSchema: Schema = new Schema(
  {
    billNo: { type: String, required: true, unique: true },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    items: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        rate: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],

    grandTotal: { type: Number, required: true },

    discount: { type: Number, default: 0 },

    finalTotal: { type: Number, required: true },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "split"],
      default: "cash",
    },

    cashAmount: { type: Number, default: 0 },

    upiAmount: { type: Number, default: 0 },

    upiId: { type: String, default: null },

    upiAccount: { type: String, default: null },

    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Bill ||
  mongoose.model<IBill>("Bill", BillSchema);
