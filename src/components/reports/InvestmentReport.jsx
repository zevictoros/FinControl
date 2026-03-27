import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/categories";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        }}
        className="rounded-xl px-4 py-3 shadow-lg"
      >
        <p
          className="text-sm font-semibold mb-1"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {label}
        </p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function InvestmentReport({ transactions }) {
  const investments = useMemo(
    () => transactions.filter((t) => t.type === "investimento"),
    [transactions],
  );

  const monthly = useMemo(() => {
    const map = {};
    investments.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key])
        map[key] = {
          label: new Date(d.getFullYear(), d.getMonth()).toLocaleDateString(
            "pt-BR",
            { month: "short", year: "2-digit" },
          ),
          total: 0,
        };
      map[key].total += t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [investments]);

  // Acumulado
  const accumulated = useMemo(() => {
    let acc = 0;
    return monthly.map((m) => {
      acc += m.total;
      return { ...m, acumulado: acc };
    });
  }, [monthly]);

  const totalInvested = investments.reduce((s, t) => s + t.amount, 0);
  const avgMonthly = monthly.length ? totalInvested / monthly.length : 0;

  if (investments.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
        Nenhum investimento registrado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Total Investido
          </p>
          <p className="text-xl font-bold text-violet-500">
            {formatCurrency(totalInvested)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Média Mensal
          </p>
          <p className="text-xl font-bold text-foreground">
            {formatCurrency(avgMonthly)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Meses Investidos
          </p>
          <p className="text-xl font-bold text-foreground">{monthly.length}</p>
        </div>
      </div>

      {/* Barras mensais */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Investimentos por Mês</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                name="Investido"
                fill="#7c3aed"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Linha acumulada */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Total Acumulado</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accumulated}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="acumulado"
                name="Acumulado"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
