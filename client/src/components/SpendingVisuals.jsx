import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#e36b42", "#29453a", "#f0b45f", "#6b8f7d", "#c9d7c5", "#b55443"];

function SpendingVisuals({ expenses }) {
  const totals = expenses.reduce((result, expense) => {
    result[expense.category] = (result[expense.category] || 0) + Number(expense.amount || 0);
    return result;
  }, {});
  const data = Object.entries(totals)
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
  const now = new Date();
  const monthlyData = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      month: date.toLocaleDateString("en-IN", { month: "short" }),
      amount: Math.round(expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}` === key;
      }).reduce((sum, expense) => sum + Number(expense.amount || 0), 0))
    };
  });

  if (!data.length) return null;

  return (
    <section className="visuals-grid" aria-label="Spending visualizations">
      <div className="visual-panel chart-panel">
        <div className="visual-heading">
          <div>
            <p className="eyebrow">SPENDING SHAPE</p>
            <h2>Where it goes</h2>
          </div>
          <span className="visual-caption">Top categories</span>
        </div>
        <div className="bar-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "#839087", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a0aaa3", fontSize: 10 }} tickFormatter={(value) => `₹${value}`} />
              <Tooltip cursor={{ fill: "#fff3ed" }} formatter={(value) => [`₹${value}`, "Spent"]} />
              <Bar dataKey="amount" fill="#e36b42" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="visual-panel ring-panel">
        <div className="visual-heading">
          <div>
            <p className="eyebrow">YOUR MIX</p>
            <h2>Spending mix</h2>
          </div>
        </div>
        <div className="ring-content">
          <div className="ring-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="category" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="none">
                  {data.map((item, index) => <Cell key={item.category} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value}`, "Spent"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="visual-legend">
            {data.slice(0, 4).map((item, index) => <div className="legend-item" key={item.category}><i style={{ background: colors[index % colors.length] }} /><span>{item.category}</span><strong>{Math.round((item.amount / data.reduce((sum, entry) => sum + entry.amount, 0)) * 100)}%</strong></div>)}
          </div>
        </div>
      </div>
      <div className="visual-panel monthly-panel">
        <div className="visual-heading">
          <div>
            <p className="eyebrow">LAST 12 MONTHS</p>
            <h2>Monthly spending pulse</h2>
          </div>
          <span className="visual-caption">Month by month</span>
        </div>
        <div className="monthly-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#839087", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a0aaa3", fontSize: 10 }} tickFormatter={(value) => `₹${value}`} />
              <Tooltip cursor={{ fill: "#fff3ed" }} formatter={(value) => [`₹${value}`, "Spent"]} />
              <Bar dataKey="amount" fill="#29453a" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export default SpendingVisuals;
