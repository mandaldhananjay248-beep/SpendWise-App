import express from "express";
import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";

const router = express.Router();

// ==========================================
// GET ALL BUDGETS FOR CURRENT MONTH
// ==========================================
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month || now.getMonth() + 1;
    const year = req.query.year || now.getFullYear();

    const budgets = await Budget.find({
      userId: req.userId,
      month: parseInt(month),
      year: parseInt(year)
    });

    // Get spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spending = await Expense.aggregate([
          {
            $match: {
              userId: budget.userId,
              category: budget.category,
              date: {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" }
            }
          }
        ]);

        const spent = spending.length > 0 ? spending[0].total : 0;
        const percentage = (spent / budget.limit) * 100;
        const status =
          percentage >= 100
            ? "exceeded"
            : percentage >= budget.alertThreshold
              ? "warning"
              : "ok";

        return {
          ...budget.toObject(),
          spent: Math.round(spent * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
          status,
          remaining: Math.max(0, Math.round((budget.limit - spent) * 100) / 100)
        };
      })
    );

    res.json(budgetsWithSpending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET BUDGET BY ID
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// CREATE NEW BUDGET
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { category, limit, month, year, alertThreshold } = req.body;

    if (!category || !limit || !month || !year) {
      return res.status(400).json({
        error: "Category, limit, month, and year are required"
      });
    }

    // Check if budget already exists
    const existing = await Budget.findOne({
      userId: req.userId,
      category,
      month: parseInt(month),
      year: parseInt(year)
    });

    if (existing) {
      return res.status(400).json({
        error: "Budget already exists for this category and month"
      });
    }

    const budget = new Budget({
      userId: req.userId,
      category,
      limit: parseFloat(limit),
      month: parseInt(month),
      year: parseInt(year),
      alertThreshold: alertThreshold || 80
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// UPDATE BUDGET
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { limit, alertThreshold } = req.body;

    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    if (limit) budget.limit = parseFloat(limit);
    if (alertThreshold) budget.alertThreshold = parseInt(alertThreshold);

    await budget.save();
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DELETE BUDGET
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET BUDGET SUMMARY FOR DASHBOARD
// ==========================================
router.get("/summary/current", async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgets = await Budget.find({
      userId: req.userId,
      month,
      year
    });

    const summary = await Promise.all(
      budgets.map(async (budget) => {
        const spending = await Expense.aggregate([
          {
            $match: {
              userId: budget.userId,
              category: budget.category,
              date: {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" }
            }
          }
        ]);

        const spent = spending.length > 0 ? spending[0].total : 0;
        const percentage = (spent / budget.limit) * 100;
        const status =
          percentage >= 100
            ? "exceeded"
            : percentage >= budget.alertThreshold
              ? "warning"
              : "ok";

        return {
          category: budget.category,
          limit: budget.limit,
          spent: Math.round(spent * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
          status,
          alertThreshold: budget.alertThreshold
        };
      })
    );

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
