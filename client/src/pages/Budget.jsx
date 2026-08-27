import { useState } from "react";
import { PiggyBank } from "lucide-react";
import BudgetSettings from "../components/BudgetSettings";

export default function Budget() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <PiggyBank className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Budget Management
          </h1>
        </div>
        <p className="text-slate-400">
          Set monthly spending limits for each category and get
          alerts when you're approaching or exceeding your budget.
        </p>
      </div>

      {/* Budget Settings Component */}
      <BudgetSettings />

      {/* Tips Section */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="font-semibold text-white mb-2">
              Set Realistic Limits
            </h3>
            <p className="text-sm text-slate-400">
              Review your last 3 months of spending to set
              achievable budget limits.
            </p>
          </div>

          <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-white mb-2">
              Adjust Alert Threshold
            </h3>
            <p className="text-sm text-slate-400">
              Get notified at 80% by default. Lower it for early
              warnings.
            </p>
          </div>

          <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-white mb-2">
              Monitor Monthly
            </h3>
            <p className="text-sm text-slate-400">
              Your budgets reset each month. Review and adjust
              as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
