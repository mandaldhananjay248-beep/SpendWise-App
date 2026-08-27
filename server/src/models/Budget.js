import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Food",
        "Movies",
        "Gadgets",
        "Clothes",
        "Travel",
        "Shopping",
        "Bills",
        "Education",
        "Health",
        "Entertainment",
        "Others"
      ]
    },

    limit: {
      type: Number,
      required: true,
      min: 1
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    year: {
      type: Number,
      required: true
    },

    alertThreshold: {
      type: Number,
      default: 80,
      min: 1,
      max: 100
    },

    alertsSent: {
      type: Map,
      of: Boolean,
      default: new Map()
    }
  },
  {
    timestamps: true
  }
);

budgetSchema.index(
  {
    userId: 1,
    category: 1,
    month: 1,
    year: 1
  },
  {
    unique: true
  }
);

export default mongoose.model("Budget", budgetSchema);
