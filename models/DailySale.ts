import mongoose, { Schema, Document } from "mongoose";

/* =====================================================
   TYPES
===================================================== */

export interface IDailySaleTransaction {
  items: {
    name: string;
    qty: number;
    rate: number;
    total: number;
  }[];
  total: number;
  paymentMode: "cash" | "upi" | "split";
  cashAmount: number;
  upiAmount: number;
  createdAt: Date;
}

export interface IDailySale extends Document {
  date: string; // YYYY-MM-DD
  transactions: IDailySaleTransaction[];
  totalRevenue: number;
  totalCash: number;
  totalUpi: number;
  isClosed: boolean;
  convertedBillId?: mongoose.Types.ObjectId | null;
}

/* =====================================================
   SCHEMA
===================================================== */

const DailySaleSchema = new Schema<IDailySale>(
  {
    date: {
      type: String,
      required: true,
      unique: true,
    },

    transactions: [
      {
        items: [
          {
            name: String,
            qty: Number,
            rate: Number,
            total: Number,
          },
        ],
        total: { type: Number, default: 0 },
        paymentMode: String,
        cashAmount: { type: Number, default: 0 },
        upiAmount: { type: Number, default: 0 },
        createdAt: Date,
      },
    ],

    totalRevenue: { type: Number, default: 0 },
    totalCash: { type: Number, default: 0 },
    totalUpi: { type: Number, default: 0 },

    isClosed: { type: Boolean, default: false },

    convertedBillId: {
      type: Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.DailySale ||
  mongoose.model<IDailySale>("DailySale", DailySaleSchema);
