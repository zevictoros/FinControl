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
        <p className="text-sm font-semibold mb-1 text-foreground">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
            {p.name}: {formatCurrency(Number(p.value) || 0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MonthlyBarChart({ transactions = [] }) {
  const processData = () => {
    const monthlyData = {};

    transactions.forEach((t) => {
      if (!t.date) return;

      // Tratamento seguro de data para evitar Timezone e datas inválidas
      const datePart = t.date.split("T")[0];
      const [year, month] = datePart.split("-");
      const key = `${year}-${month}`;

      const displayLabel = new Date(
        Number(year),
        Number(month) - 1,
      ).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      if (!monthlyData[key]) {
        monthlyData[key] = {
          name: displayLabel,
          receitas: 0,
          despesas: 0,
          sortKey: key,
        };
      }

      const val = Number(t.amount) || 0;
      if (t.type === "receita") {
        monthlyData[key].receitas += val;
      } else {
        monthlyData[key].despesas += val;
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6);
  };

  const chartData = processData();

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-4">Evolução Mensal</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Aguardando dados para o histórico...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="text-base font-semibold mb-4">Evolução Mensal</h3>
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
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--muted)/0.2)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar
              dataKey="receitas"
              name="Receitas"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="despesas"
              name="Despesas"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
