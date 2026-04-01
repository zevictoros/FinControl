import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  getAllCategories,
  getExpenseCategories,
  INCOME_CATEGORIES,
  formatCurrency,
} from "@/lib/categories";
import { Skeleton } from "@/components/ui/skeleton";
import InvestmentReport from "@/components/reports/InvestmentReport";
import { api } from "@/api/apiClient";

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

function getPastMonths(n) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return months;
}

function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function Reports() {
  const now = new Date();
  const [periodMode, setPeriodMode] = useState("preset");
  const [presetMonths, setPresetMonths] = useState("6");
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [customEnd, setCustomEnd] = useState(
    () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // 1. Busca de dados corrigida para o seu novo backend
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      // Garante que o retorno seja sempre um array para o .filter não quebrar
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 2. Lógica de meses válidos (Mantendo as novas funcionalidades de período customizado)
  const validMonths = useMemo(() => {
    const now = new Date();
    const currentKey = (y, m) => y * 12 + m; // Função helper simples para comparar meses
    const currentMonthKey = currentKey(now.getFullYear(), now.getMonth());

    if (periodMode === "preset") {
      // Se for preset (ex: últimos 6 meses), usa a lógica do seu código antigo adaptada
      const monthsArr = [];
      for (let i = 0; i < parseInt(presetMonths); i++) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        monthsArr.push({ year: d.getFullYear(), month: d.getMonth() });
      }
      return monthsArr;
    } else {
      // Lógica para período customizado (Data Início -> Data Fim)
      const [sy, sm] = customStart.split("-").map(Number);
      const [ey, em] = customEnd.split("-").map(Number);

      const startKey = currentKey(sy, sm - 1);
      const endKey = Math.min(currentKey(ey, em - 1), currentMonthKey);

      const monthsArr = [];
      let y = sy,
        m = sm - 1;

      while (currentKey(y, m) <= endKey) {
        monthsArr.push({ year: y, month: m });
        m++;
        if (m > 11) {
          m = 0;
          y++;
        }
        if (monthsArr.length > 120) break; // Trava de segurança
      }
      return monthsArr;
    }
  }, [periodMode, presetMonths, customStart, customEnd]);

  // Cria um Set de chaves (YYYY-MM) para busca rápida no filtro
  const validMonthKeys = useMemo(() => {
    return new Set(validMonths.map((v) => `${v.year}-${v.month}`));
  }, [validMonths]);

  // 3. Filtro Principal CORRIGIDO
  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date) return false;

      // CORREÇÃO CRÍTICA: Pegamos ano e mês via split para ignorar fuso horário do navegador
      // t.date costuma vir "2024-03-15..." -> pegamos ["2024", "03"]
      const dateParts = t.date.split("T")[0].split("-");
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JS usa meses de 0 a 11

      const key = `${year}-${month}`;

      // Verificações
      if (!validMonthKeys.has(key)) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;

      return true;
    });
  }, [allTransactions, validMonthKeys, filterType, filterCategory]);

  const monthlyData = useMemo(() => {
    const map = {};
    validMonths.forEach(({ year, month }) => {
      const key = monthKey(year, month);
      map[key] = {
        label: new Date(year, month).toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        receita: 0,
        despesa: 0,
        investimento: 0,
      };
    });
    filtered.forEach((t) => {
      const d = new Date(t.date + "T12:00:00");
      const key = monthKey(d.getFullYear(), d.getMonth());
      if (!map[key]) return;
      if (t.type === "receita") map[key].receita += t.amount;
      else if (t.type === "despesa") map[key].despesa += t.amount;
      else if (t.type === "investimento") map[key].investimento += t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [filtered, validMonths]);

  const allCategories = useMemo(() => getAllCategories(), []);

  const expenseCategoryData = useMemo(() => {
    const map = {};
    filtered
      .filter((t) => t.type === "despesa")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([key, value]) => ({
        name: allCategories[key]?.label || key,
        value,
        color: allCategories[key]?.color || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, allCategories]);

  const incomeCategoryData = useMemo(() => {
    const map = {};
    filtered
      .filter((t) => t.type === "receita")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([key, value]) => ({
        name: allCategories[key]?.label || key,
        value,
        color: allCategories[key]?.color || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, allCategories]);

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
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
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
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold mb-4">Filtros</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Modo de período</Label>
                <Select value={periodMode} onValueChange={setPeriodMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preset">Pré-definido</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {periodMode === "preset" ? (
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={presetMonths} onValueChange={setPresetMonths}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Últimos 3 meses</SelectItem>
                      <SelectItem value="6">Últimos 6 meses</SelectItem>
                      <SelectItem value="9">Últimos 9 meses</SelectItem>
                      <SelectItem value="12">Últimos 12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Mês inicial</Label>
                    <Input
                      type="month"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mês final</Label>
                    <Input
                      type="month"
                      value={customEnd}
                      max={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={filterType}
                  onValueChange={(v) => {
                    setFilterType(v);
                    setFilterCategory("all");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="receita">Receitas</SelectItem>
                    <SelectItem value="despesa">Despesas</SelectItem>
                    <SelectItem value="investimento">Investimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {(filterType === "all" ||
                      filterType === "investimento") && (
                      <SelectItem value="investimentos">
                        Investimentos
                      </SelectItem>
                    )}
                    {(filterType === "all" || filterType === "despesa") &&
                      Object.entries(getExpenseCategories()).map(([k, v]) => (
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Receitas
              </p>
              <p className="text-xl font-bold text-emerald-500">
                {formatCurrency(totals.receitas)}
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Despesas
              </p>
              <p className="text-xl font-bold text-red-500">
                {formatCurrency(totals.despesas)}
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Investimentos
              </p>
              <p className="text-xl font-bold text-violet-500">
                {formatCurrency(totals.investimentos)}
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Evolução Mensal</h3>
            {monthlyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado neste período
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={2}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {(filterType === "all" || filterType === "receita") && (
                      <Bar
                        dataKey="receita"
                        name="Receitas"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                    {(filterType === "all" || filterType === "despesa") && (
                      <Bar
                        dataKey="despesa"
                        name="Despesas"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                    {(filterType === "all" ||
                      filterType === "investimento") && (
                      <Bar
                        dataKey="investimento"
                        name="Investimentos"
                        fill="#7c3aed"
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {monthlyData.length > 1 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Tendência</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {(filterType === "all" || filterType === "receita") && (
                      <Line
                        type="monotone"
                        dataKey="receita"
                        name="Receitas"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {(filterType === "all" || filterType === "despesa") && (
                      <Line
                        type="monotone"
                        dataKey="despesa"
                        name="Despesas"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {(filterType === "all" ||
                      filterType === "investimento") && (
                      <Line
                        type="monotone"
                        dataKey="investimento"
                        name="Investimentos"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {(filterType === "all" || filterType === "despesa") &&
              expenseCategoryData.length > 0 && (
                <CategoryPieSection
                  title="Despesas por Categoria"
                  data={expenseCategoryData}
                />
              )}
            {(filterType === "all" || filterType === "receita") &&
              incomeCategoryData.length > 0 && (
                <CategoryPieSection
                  title="Receitas por Categoria"
                  data={incomeCategoryData}
                />
              )}
          </div>
        </TabsContent>

        <TabsContent value="investments">
          <InvestmentReport transactions={allTransactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoryPieSection({ title, data }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={85}
                dataKey="value"
                stroke="none"
              >
                {data.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  borderRadius: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground flex-1 truncate">
                {item.name}
              </span>
              <span className="font-medium">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
