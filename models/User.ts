import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    address: { type: String },   // optional
    age: { type: Number },       // optional
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;
