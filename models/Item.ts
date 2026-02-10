import mongoose, { Schema, model, models } from "mongoose";

const ItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

// ✅ Define indexes ONLY here (not inside fields)
ItemSchema.index({ name: 1 });
ItemSchema.index({ code: 1 });

export default models.Item || model("Item", ItemSchema);
