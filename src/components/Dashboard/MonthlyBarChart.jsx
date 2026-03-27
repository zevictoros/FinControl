import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/categories";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p) => (
          <p
            key={p.dataKey}
            className="text-sm font-medium"
            style={{ color: p.color }}
          >
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MonthlyBarChart({ transactions = [] }) {
  const chartData = useMemo(() => {
    const monthlyData = {};

    transactions.forEach((t) => {
      if (!t.date) return;

      // 1. Evita erro de fuso horário pegando os dados brutos da string "YYYY-MM-DD"
      const dateParts = t.date.split("T")[0].split("-");
      const year = dateParts[0];
      const month = dateParts[1];
      const key = `${year}-${month}`;

      if (!monthlyData[key]) {
        // Cria um label amigável (ex: abr/26)
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        const label = d.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });

        monthlyData[key] = {
          name: label,
          receitas: 0,
          despesas: 0,
          sortKey: key,
        };
      }

      // 2. CONVERSÃO CRÍTICA: Garante que amount seja um número antes de somar
      const amount = Number(t.amount) || 0;

      if (t.type === "receita") {
        monthlyData[key].receitas += amount;
      } else {
        // Soma tanto 'despesa' quanto 'investimento' como saídas no gráfico mensal
        monthlyData[key].despesas += amount;
      }
    });

    // Converte o objeto em array, ordena por data e pega os últimos 6 meses
    return Object.values(monthlyData)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6);
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-4">Evolução Mensal</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
          Nenhum dado para exibir no histórico
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="text-base font-semibold mb-4 text-foreground/80">
        Evolução Mensal
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--muted)/0.1)" }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingTop: "10px" }}
            />
            <Bar
              dataKey="receitas"
              name="Receitas"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="despesas"
              name="Despesas"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
