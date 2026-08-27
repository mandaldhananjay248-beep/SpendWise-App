import mongoose from "mongoose";

const categories = [
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
];

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500
    },

    category: {
      type: String,
      enum: categories,
      default: "Others"
    },

    date: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export { categories };

export default mongoose.model(
  "Expense",
  expenseSchema
);