import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true
    },

    phone: {
      type: String,
      trim: true,
      sparse: true
    },

    googleId: {
      type: String,
      sparse: true
    },

    avatar: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);