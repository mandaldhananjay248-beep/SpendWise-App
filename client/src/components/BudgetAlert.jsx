import { AlertCircle, TrendingUp, CheckCircle } from "lucide-react";

export default function BudgetAlert({
  budgets,
  loading
}) {
  if (loading) {
    return (
      <div className="budget-alert budget-alert-loading">
        <div className="budget-alert-loader" />
        <p>Loading budget alerts...</p>
      </div>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <div className="budget-alert budget-alert-empty">
        <div className="budget-alert-icon">
          <CheckCircle size={22} />
        </div>
        <div>
          <h3>No Budgets Set</h3>
          <p>
            Create budgets to track your spending
          </p>
        </div>
      </div>
    );
  }

  const exceededBudgets = budgets.filter(
    (b) => b.status === "exceeded"
  );
  const warningBudgets = budgets.filter(
    (b) => b.status === "warning"
  );
  const okBudgets = budgets.filter(
    (b) => b.status === "ok"
  );

  const hasAlerts =
    exceededBudgets.length > 0 ||
    warningBudgets.length > 0;

  return (
    <section className={`budget-alert ${hasAlerts ? "budget-alert-active" : "budget-alert-clear"}`}>
      {/* Summary Card */}
      <div className="budget-alert-summary">
        <div className="budget-alert-title">
          <div className="budget-alert-icon"><AlertCircle size={21} /></div>
          <div>
            <p className="budget-alert-kicker">MONTHLY CHECK-IN</p>
            <h3>{hasAlerts ? "Budget needs attention" : "Budget is on track"}</h3>
            <p className="budget-alert-description">
              {exceededBudgets.length > 0
                ? `${exceededBudgets.length} ${exceededBudgets.length === 1 ? "category has" : "categories have"} exceeded the limit`
                : warningBudgets.length > 0
                  ? `${warningBudgets.length} ${warningBudgets.length === 1 ? "category is" : "categories are"} approaching the limit`
                  : `All ${budgets.length} ${budgets.length === 1 ? "budget is" : "budgets are"} on track`}
            </p>
          </div>
        </div>
        <div className="budget-alert-score">
            <strong>
              {okBudgets.length}/{budgets.length}
            </strong>
            <span>ON TRACK</span>
        </div>
      </div>

      {/* Exceeded Budgets */}
      {exceededBudgets.length > 0 && (
        <div className="budget-alert-group">
          <h4 className="budget-alert-group-title budget-alert-group-danger">
            <AlertCircle size={16} /> Over budget
          </h4>
          {exceededBudgets.map((budget) => (
            <div
              key={budget._id}
              className="budget-alert-row budget-alert-row-danger"
            >
              <div className="budget-alert-row-header">
                <div>
                  <strong>{budget.category}</strong>
                  <span>{budget.percentage.toFixed(1)}% of limit used</span>
                </div>
                <strong className="budget-alert-amount">
                  ₹{Math.abs(budget.spent - budget.limit).toLocaleString("en-IN")} <small>over</small>
                </strong>
              </div>
              <div className="budget-alert-progress-track">
                <div
                  className="budget-alert-progress budget-alert-progress-danger"
                  style={{
                    width: `${Math.min(
                      budget.percentage,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Budgets */}
      {warningBudgets.length > 0 && (
        <div className="budget-alert-group">
          <h4 className="budget-alert-group-title budget-alert-group-warning">
            <TrendingUp size={16} /> Approaching Limit
          </h4>
          {warningBudgets.map((budget) => (
            <div
              key={budget._id}
              className="budget-alert-row budget-alert-row-warning"
            >
              <div className="budget-alert-row-header">
                <div>
                  <strong>{budget.category}</strong>
                  <span>{budget.spent.toLocaleString("en-IN", { maximumFractionDigits: 0 })} spent of ₹{budget.limit.toLocaleString("en-IN")}</span>
                </div>
                <strong className="budget-alert-amount">
                  {budget.percentage.toFixed(1)}% <small>used</small>
                </strong>
              </div>
              <div className="budget-alert-progress-track">
                <div
                  className="budget-alert-progress budget-alert-progress-warning"
                  style={{
                    width: `${Math.min(
                      budget.percentage,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {budgets.length > 0 && (
        <div className="budget-alert-stats">
          <div className="budget-alert-stat budget-alert-stat-good">
            <strong>
              {okBudgets.length}
            </strong>
            <span>
              On Track
            </span>
          </div>
          <div className="budget-alert-stat budget-alert-stat-warning">
            <strong>
              {warningBudgets.length}
            </strong>
            <span>
              Warning
            </span>
          </div>
          <div className="budget-alert-stat budget-alert-stat-danger">
            <strong>
              {exceededBudgets.length}
            </strong>
            <span>
              Exceeded
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
