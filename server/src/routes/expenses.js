import express from "express";
import mongoose from "mongoose";
import Expense, { categories } from "../models/Expense.js";

const router = express.Router();


// ==========================================
// GET CATEGORIES
// ==========================================

router.get("/categories", (req, res) => {

  res.json({
    categories
  });

});


// ==========================================
// GET ALL EXPENSES
// ==========================================

router.get("/", async (req, res) => {

  try {

    const {
      month,
      category,
      search
    } = req.query;


    const filter = {
      userId: req.userId
    };


    // Category filter

    if (
      category &&
      category !== "All"
    ) {

      filter.category =
        category;

    }


    // Search filter

    if (search) {

      filter.$or = [

        {
          title: {
            $regex: search,
            $options: "i"
          }
        },

        {
          description: {
            $regex: search,
            $options: "i"
          }
        }

      ];

    }


    // Monthly filter

    if (month) {

      const [
        year,
        selectedMonth
      ] = month
        .split("-")
        .map(Number);


      filter.date = {

        $gte:
          new Date(
            year,
            selectedMonth - 1,
            1
          ),

        $lt:
          new Date(
            year,
            selectedMonth,
            1
          )

      };

    }


    const expenses =
      await Expense
        .find(filter)
        .sort({
          date: -1
        });


    res.json({
      expenses
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message:
        "Unable to fetch expenses."

    });

  }

});


// ==========================================
// ADD EXPENSE
// ==========================================

router.post("/", async (req, res) => {

  try {

    const {
      title,
      amount,
      description,
      category,
      date
    } = req.body;


    if (
      !title ||
      Number(amount) <= 0
    ) {

      return res.status(400).json({

        message:
          "Title and valid amount are required."

      });

    }


    const expense =
      await Expense.create({

        userId:
          req.userId,

        title,

        amount:
          Number(amount),

        description,

        category,

        date:
          date
            ? new Date(date)
            : new Date()

      });


    res.status(201).json({

      expense

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message:
        "Unable to create expense."

    });

  }

});


// ==========================================
// UPDATE EXPENSE
// ==========================================

router.put("/:id", async (req, res) => {

  try {

    const allowedFields = [

      "title",
      "amount",
      "description",
      "category",
      "date"

    ];


    const updates = {};


    allowedFields.forEach(
      field => {

        if (
          req.body[field] !==
          undefined
        ) {

          updates[field] =
            field === "amount"
              ? Number(
                  req.body[field]
                )
              : req.body[field];

        }

      }
    );


    const expense =
      await Expense.findOneAndUpdate(

        {
          _id:
            req.params.id,

          userId:
            req.userId

        },

        updates,

        {
          new: true,

          runValidators: true

        }

      );


    if (!expense) {

      return res.status(404).json({

        message:
          "Expense not found."

      });

    }


    res.json({
      expense
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message:
        "Unable to update expense."

    });

  }

});


// ==========================================
// DELETE EXPENSE
// ==========================================

router.delete("/:id", async (req, res) => {

  try {

    const deleted =
      await Expense.findOneAndDelete({

        _id:
          req.params.id,

        userId:
          req.userId

      });


    if (!deleted) {

      return res.status(404).json({

        message:
          "Expense not found."

      });

    }


    res.json({

      message:
        "Expense deleted successfully."

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message:
        "Unable to delete expense."

    });

  }

});


// ==========================================
// MONTHLY SUMMARY
// ==========================================

router.get(
  "/summary",
  async (req, res) => {

    try {

      const now =
        new Date();


      const start =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );


      const end =
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1
        );


      const rows =
        await Expense.aggregate([

          {
            $match: {

              userId:
                new mongoose.Types.ObjectId(
                  req.userId
                ),

              date: {
                $gte: start,
                $lt: end
              }

            }

          },

          {
            $group: {

              _id:
                "$category",

              total:
                {
                  $sum:
                    "$amount"
                },

              count:
                {
                  $sum:
                    1
                }

            }

          },

          {
            $sort: {
              total: -1
            }
          }

        ]);


      const total =
        rows.reduce(
          (sum, row) =>
            sum + row.total,
          0
        );


      res.json({

        total,

        categories:
          rows

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message:
          "Unable to generate summary."

      });

    }

  }
);


export default router;