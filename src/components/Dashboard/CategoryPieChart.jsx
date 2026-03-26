import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORIES, formatCurrency } from "@/lib/categories";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function CategoryPieChart({ transactions }) {
  const despesas = transactions.filter((t) => t.type === "despesa");

  const categoryTotals = {};
  despesas.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const chartData = Object.entries(categoryTotals)
    .map(([key, value]) => ({
      name: CATEGORIES[key]?.label || key,
      value,
      color: CATEGORIES[key]?.color || "#64748b",
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-4">Despesas por Categoria</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Nenhuma despesa neste período
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="text-base font-semibold mb-4">Despesas por Categoria</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground truncate">{item.name}</span>
            <span className="ml-auto font-medium text-foreground">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
