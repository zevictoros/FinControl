import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CATEGORIES, formatCurrency } from "@/lib/categories";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
        <p className="text-sm font-semibold mb-1 text-foreground">
          {payload[0].name}
        </p>
        <p
          className="text-sm font-medium"
          style={{ color: payload[0].payload.color }}
        >
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function IncomePieChart({ transactions = [] }) {
  const chartData = useMemo(() => {
    const totals = {};

    // Filtra apenas o que é receita
    const incomeTransactions = transactions.filter((t) => t.type === "receita");

    incomeTransactions.forEach((t) => {
      const category = t.category || "Outros";
      const amount = Number(t.amount) || 0; // Conversão crucial para número
      totals[category] = (totals[category] || 0) + amount;
    });

    return Object.entries(totals)
      .map(([key, value]) => ({
        name: CATEGORIES[key]?.label || key,
        value,
        color: CATEGORIES[key]?.color || "#10b981", // Usa cor da categoria ou verde padrão
      }))
      .sort((a, b) => b.value - a.value); // Ordena do maior para o menor
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-4">Receitas por Categoria</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
          Nenhuma receita neste período
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="text-base font-semibold mb-4 text-foreground/80">
        Receitas por Categoria
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
