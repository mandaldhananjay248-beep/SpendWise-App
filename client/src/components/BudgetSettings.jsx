import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function readLocalBudgets(month, year) {
  try {
    const stored = JSON.parse(localStorage.getItem("spendwise_budgets") || "{}");
    const key = `${year}-${month}`;
    return stored[key] || [];
  } catch {
    return [];
  }
}

function writeLocalBudgets(month, year, budgets) {
  try {
    const stored = JSON.parse(localStorage.getItem("spendwise_budgets") || "{}");
    const key = `${year}-${month}`;
    stored[key] = budgets;
    localStorage.setItem("spendwise_budgets", JSON.stringify(stored));
  } catch {
    console.error("Failed to save budgets locally");
  }
}

export default function BudgetSettings() {
  const { user } = useAuth();
  const offlineDemo = Boolean(user?.offlineDemo);

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "Food",
    limit: "",
    alertThreshold: "80"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Fetch budgets
  const fetchBudgets = async () => {
    setLoading(true);
    try {
      if (offlineDemo) {
        const localBudgets = readLocalBudgets(
          currentMonth,
          currentYear
        );
        setBudgets(localBudgets);
        setError("");
      } else {
        const response = await api.get("/budgets", {
          params: {
            month: currentMonth,
            year: currentYear
          }
        });
        setBudgets(response.data);
        setError("");
      }
    } catch (err) {
      setError("Failed to fetch budgets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit new budget
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.limit || parseFloat(formData.limit) <= 0) {
      setError("Please enter a valid budget amount");
      return;
    }

    try {
      if (offlineDemo) {
        const localBudgets = readLocalBudgets(
          currentMonth,
          currentYear
        );

        // Check if budget exists
        const exists = localBudgets.some(
          (b) => b.category === formData.category
        );
        if (exists) {
          setError(
            "Budget already exists for this category and month"
          );
          return;
        }

        const newBudget = {
          _id: `local-${Date.now()}`,
          category: formData.category,
          limit: parseFloat(formData.limit),
          month: currentMonth,
          year: currentYear,
          alertThreshold: parseInt(
            formData.alertThreshold
          ),
          spent: 0,
          percentage: 0,
          status: "ok",
          remaining: parseFloat(formData.limit)
        };

        const updated = [
          ...localBudgets,
          newBudget
        ];
        writeLocalBudgets(
          currentMonth,
          currentYear,
          updated
        );
        setBudgets(updated);
        setSuccess("Budget added successfully!");
      } else {
        await api.post("/budgets", {
          category: formData.category,
          limit: parseFloat(formData.limit),
          month: currentMonth,
          year: currentYear,
          alertThreshold: parseInt(
            formData.alertThreshold
          )
        });

        setSuccess("Budget added successfully!");
        await fetchBudgets();
      }

      setFormData({
        category: "Food",
        limit: "",
        alertThreshold: "80"
      });
      setShowForm(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to create budget"
      );
    }
  };

  // Delete budget
  const handleDelete = async (budgetId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this budget?"
      )
    ) {
      return;
    }

    try {
      if (offlineDemo) {
        const localBudgets = readLocalBudgets(
          currentMonth,
          currentYear
        );
        const updated = localBudgets.filter(
          (b) => b._id !== budgetId
        );
        writeLocalBudgets(
          currentMonth,
          currentYear,
          updated
        );
        setBudgets(updated);
        setSuccess("Budget deleted successfully!");
      } else {
        await api.delete(`/budgets/${budgetId}`);
        setSuccess("Budget deleted successfully!");
        await fetchBudgets();
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete budget");
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "exceeded":
        return "budget-status-danger";
      case "warning":
        return "budget-status-warning";
      default:
        return "budget-status-good";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "exceeded":
        return "budget-status-danger";
      case "warning":
        return "budget-status-warning";
      default:
        return "budget-status-good";
    }
  };

  return (
    <section className="budget-shell">
      <div className="budget-orb budget-orb-one" />
      <div className="budget-orb budget-orb-two" />
      <div className="budget-heading">
        <div>
          <p className="budget-kicker">MONTHLY CONTROL CENTER</p>
          <h2>
            Budget Settings
          </h2>
          <p className="budget-subtitle">
            {currentMonth}/{currentYear} - Manage your spending limits
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="budget-add-button"
        >
          <Plus size={20} />
          {showForm ? "Cancel" : "Add Budget"}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="budget-message budget-message-error">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="budget-message budget-message-success">
          <span>{success}</span>
          <button
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="budget-form-card">
          <h3>
            Create New Budget
          </h3>
          <form onSubmit={handleSubmit} className="budget-form">
            <div className="budget-form-grid">
              {/* Category */}
              <label>
                <span>
                  Category
                </span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              {/* Limit */}
              <label>
                <span>
                  Monthly Limit (₹)
                </span>
                <input
                  type="number"
                  name="limit"
                  value={formData.limit}
                  onChange={handleChange}
                  placeholder="5000"
                  min="1"
                  step="1"
                />
              </label>

              {/* Alert Threshold */}
              <label>
                <span>
                  Alert at (%)
                </span>
                <input
                  type="number"
                  name="alertThreshold"
                  value={formData.alertThreshold}
                  onChange={handleChange}
                  placeholder="80"
                  min="1"
                  max="100"
                />
              </label>
            </div>

            <button
              type="submit"
              className="budget-submit-button"
            >
              Create Budget
            </button>
          </form>
        </div>
      )}

      {/* Budgets List */}
      {loading ? (
        <div className="budget-empty-state">
          Loading budgets...
        </div>
      ) : budgets.length === 0 ? (
        <div className="budget-empty-state">
          <div className="budget-empty-icon"><Plus size={22} /></div>
          <p>
            No budgets set yet
          </p>
          <span>
            Create your first budget to start tracking
          </span>
        </div>
      ) : (
        <div className="budget-list">
          {budgets.map((budget) => (
            <div
              key={budget._id}
              className="budget-card"
            >
              <div className="budget-card-header">
                <div>
                  <h3>
                    {budget.category}
                  </h3>
                  <p>
                    Budget: ₹{budget.limit.toLocaleString(
                      "en-IN"
                    )} | Spent: ₹{budget.spent.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(budget._id)}
                  className="budget-delete-button"
                  aria-label={`Delete ${budget.category} budget`}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="budget-progress-track">
                  <div
                    className={`budget-progress-fill budget-progress-${budget.status}`}
                    style={{
                      width: `${Math.min(
                        budget.percentage,
                        100
                      )}%`
                    }}
                  />
              </div>

              {/* Status */}
              <div className="budget-card-footer">
                <div>
                  <span
                    className={`budget-status ${getStatusBgColor(
                      budget.status
                    )}`}
                  >
                    {budget.status === "exceeded"
                      ? "⚠️ Over Budget"
                      : budget.status === "warning"
                        ? "⚡ Warning"
                        : "✓ On Track"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="budget-percent">
                    {budget.percentage.toFixed(
                      1
                    )}%
                  </p>
                  <p className="budget-remaining">
                    {budget.remaining > 0
                      ? `₹${budget.remaining.toLocaleString(
                          "en-IN"
                        )} remaining`
                      : `₹${Math.abs(
                          budget.remaining
                        ).toLocaleString(
                          "en-IN"
                        )} over`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
