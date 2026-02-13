import mongoose, { Schema, Document } from "mongoose";

export interface IExpense extends Document {
  title: string;
  category: string;
  amount: number;
  date: Date;
  note?: string;
}

const ExpenseSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);
