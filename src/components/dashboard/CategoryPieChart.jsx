import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORIES, formatCurrency } from "@/lib/categories";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Pegamos o objeto de dados original
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

export default function CategoryPieChart({ transactions = [] }) {
  // 1. Filtragem e Agrupamento com conversão numérica (Essencial para Neon/Postgres)
  const categoryTotals = useMemo(() => {
    const totals = {};

    const despesas = transactions.filter((t) => t.type === "despesa");

    despesas.forEach((t) => {
      // O Number() evita que o gráfico receba strings e fique vazio
      const val = Number(t.amount) || 0;
      totals[t.category] = (totals[t.category] || 0) + val;
    });

    return Object.entries(totals)
      .map(([key, value]) => ({
        name: CATEGORIES[key]?.label || key,
        value,
        color: CATEGORIES[key]?.color || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (categoryTotals.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-4">Despesas por Categoria</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
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
              data={categoryTotals}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              animationDuration={800}
            >
              {categoryTotals.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda Dinâmica */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-6">
        {categoryTotals.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground truncate max-w-[100px]">
              {item.name}
            </span>
            <span className="ml-auto font-medium text-foreground">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Lembre-se de importar o useMemo para otimizar a performance
import { useMemo } from "react";
