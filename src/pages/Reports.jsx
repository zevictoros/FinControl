import React, { useState, useMemo } from "react";
// Importação do seu novo cliente de API
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatCurrency,
} from "@/lib/categories";
import { Skeleton } from "@/components/ui/skeleton";
import InvestmentReport from "@/components/reports/InvestmentReport";

const MONTHS_OPTIONS = [
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
  { value: "24", label: "Últimos 24 meses" },
];

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

export default function Reports() {
  const [months, setMonths] = useState("6");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Busca transações do seu banco Neon via Render
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return response.data;
    },
  });

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - parseInt(months));
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [months]);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      const d = new Date(t.date);
      if (d < cutoff) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;
      return true;
    });
  }, [allTransactions, cutoff, filterType, filterCategory]);

  // Processamento para Gráfico de Evolução
  const monthlyData = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) {
        map[key] = {
          label: new Date(
            d.getUTCFullYear(),
            d.getUTCMonth(),
          ).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
          receita: 0,
          despesa: 0,
          investimento: 0,
        };
      }
      if (t.type === "receita") map[key].receita += t.amount;
      else if (t.type === "despesa") map[key].despesa += t.amount;
      else if (t.type === "investimento") map[key].investimento += t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [filtered]);

  // Processamento para Gráfico de Pizza
  const categoryData = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const key = t.category;
      map[key] = (map[key] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([key, value]) => ({
        name: CATEGORIES[key]?.label || key,
        value,
        color: CATEGORIES[key]?.color || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const totals = useMemo(
    () => ({
      receitas: filtered
        .filter((t) => t.type === "receita")
        .reduce((s, t) => s + t.amount, 0),
      despesas: filtered
        .filter((t) => t.type === "despesa")
        .reduce((s, t) => s + t.amount, 0),
      investimentos: filtered
        .filter((t) => t.type === "investimento")
        .reduce((s, t) => s + t.amount, 0),
    }),
    [filtered],
  );

  if (isLoading)
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Analise suas finanças com filtros e gráficos dinâmicos
        </p>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList className="mb-4 bg-muted/50 p-1">
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6 outline-none">
          {/* Filtros */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              Configurar Relatório
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">
                  Período
                </Label>
                <Select value={months} onValueChange={setMonths}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">
                  Tipo
                </Label>
                <Select
                  value={filterType}
                  onValueChange={(v) => {
                    setFilterType(v);
                    setFilterCategory("all");
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="receita">Receitas</SelectItem>
                    <SelectItem value="despesa">Despesas</SelectItem>
                    <SelectItem value="investimento">Investimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">
                  Categoria
                </Label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {(filterType === "all" ||
                      filterType === "investimento") && (
                      <SelectItem value="investimentos">
                        Investimentos
                      </SelectItem>
                    )}
                    {(filterType === "all" || filterType === "despesa") &&
                      Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}
                    {(filterType === "all" || filterType === "receita") &&
                      Object.entries(INCOME_CATEGORIES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cards de Resumo do Filtro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                Receitas no Período
              </p>
              <p className="text-xl font-bold text-emerald-500">
                {formatCurrency(totals.receitas)}
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                Despesas no Período
              </p>
              <p className="text-xl font-bold text-red-500">
                {formatCurrency(totals.despesas)}
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                Investimentos no Período
              </p>
              <p className="text-xl font-bold text-violet-500">
                {formatCurrency(totals.investimentos)}
              </p>
            </div>
          </div>

          {/* Gráfico de Barras: Evolução Mensal */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-semibold mb-6">Evolução de Fluxo de Caixa</h3>
            {monthlyData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
                Nenhum dado encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "20px" }}
                    />
                    {(filterType === "all" || filterType === "receita") && (
                      <Bar
                        dataKey="receita"
                        name="Receitas"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                    )}
                    {(filterType === "all" || filterType === "despesa") && (
                      <Bar
                        dataKey="despesa"
                        name="Despesas"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                    )}
                    {(filterType === "all" ||
                      filterType === "investimento") && (
                      <Bar
                        dataKey="investimento"
                        name="Investimentos"
                        fill="#7c3aed"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Gráfico de Linha: Tendência */}
          {monthlyData.length > 1 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold mb-6">
                Tendência de Gastos e Ganhos
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "20px" }}
                    />
                    {(filterType === "all" || filterType === "receita") && (
                      <Line
                        type="monotone"
                        dataKey="receita"
                        name="Receitas"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    {(filterType === "all" || filterType === "despesa") && (
                      <Line
                        type="monotone"
                        dataKey="despesa"
                        name="Despesas"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    {(filterType === "all" ||
                      filterType === "investimento") && (
                      <Line
                        type="monotone"
                        dataKey="investimento"
                        name="Investimentos"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico de Pizza: Distribuição por Categoria */}
          {categoryData.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold mb-6">Distribuição por Categoria</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {categoryData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-muted-foreground truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="investments" className="outline-none">
          <InvestmentReport transactions={allTransactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
