import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getAllCategories, formatCurrency } from "@/lib/categories";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(Number(data.value) || 0)}
        </p>
      </div>
    );
  }
  return null;
};

export default function IncomePieChart({ transactions = [] }) {
  const CATEGORIES = getAllCategories();

  // Agrupa receitas garantindo conversão numérica
  const chartData = Object.entries(
    transactions
      .filter((t) => t.type === "receita")
      .reduce((acc, t) => {
        const cat = t.category || "outros";
        const val = Number(t.amount) || 0; // Conversão para número
        acc[cat] = (acc[cat] || 0) + val;
        return acc;
      }, {}),
  )
    .map(([key, value]) => ({
      name: CATEGORIES[key]?.label || key,
      value,
      color: CATEGORIES[key]?.color || "#10b981",
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-4">Receitas por Categoria</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Nenhuma receita neste período
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="text-base font-semibold mb-4">Receitas por Categoria</h3>
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
                <Cell key={`income-cell-${idx}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 max-h-32 overflow-y-auto pr-1">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
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
