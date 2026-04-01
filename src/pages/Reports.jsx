import React, { useState, useMemo } from "react";
import { api } from "@/api/apiClient"; // Migrado para o seu apiClient (Neon)
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
        <p className="text-sm font-semibold mb-1 text-foreground">{label}</p>
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

// Funções auxiliares para manipulação de datas
function getPastMonths(n) {
  const now = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
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

  // Query atualizada para o seu Backend Neon
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const validMonths = useMemo(() => {
    const currentKey = monthKey(now.getFullYear(), now.getMonth());
    if (periodMode === "preset") {
      return getPastMonths(parseInt(presetMonths));
    } else {
      const [sy, sm] = customStart.split("-").map(Number);
      const [ey, em] = customEnd.split("-").map(Number);
      const endKey = monthKey(ey, em - 1);

      const months = [];
      let y = sy,
        m = sm - 1;
      while (monthKey(y, m) <= endKey && monthKey(y, m) <= currentKey) {
        months.push({ year: y, month: m });
        m++;
        if (m > 11) {
          m = 0;
          y++;
        }
        if (months.length > 60) break; // Trava de segurança
      }
      return months;
    }
  }, [periodMode, presetMonths, customStart, customEnd]);

  const validMonthKeys = useMemo(
    () => new Set(validMonths.map((v) => monthKey(v.year, v.month))),
    [validMonths],
  );

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      // Forçamos o fuso horário local ao processar a string da data
      const d = new Date(t.date + "T12:00:00");
      const key = monthKey(d.getFullYear(), d.getMonth());
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
      const amount = Number(t.amount) || 0; // Garantia de valor numérico
      if (map[key]) {
        if (t.type === "receita") map[key].receita += amount;
        else if (t.type === "despesa") map[key].despesa += amount;
        else if (t.type === "investimento") map[key].investimento += amount;
      }
    });

    return Object.values(map);
  }, [filtered, validMonths]);

  const allCategories = useMemo(() => getAllCategories(), []);

  // Processamento de dados para Pizza de Despesas
  const expenseCategoryData = useMemo(() => {
    const map = {};
    filtered
      .filter((t) => t.type === "despesa")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + (Number(t.amount) || 0);
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
        .reduce((s, t) => s + (Number(t.amount) || 0), 0),
      despesas: filtered
        .filter((t) => t.type === "despesa")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0),
      investimentos: filtered
        .filter((t) => t.type === "investimento")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0),
    }),
    [filtered],
  );

  if (isLoading)
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground text-sm">
          Visão detalhada do seu fluxo financeiro
        </p>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {/* Painel de Filtros */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Modo</Label>
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
                    <SelectItem value="3">3 Meses</SelectItem>
                    <SelectItem value="6">6 Meses</SelectItem>
                    <SelectItem value="12">12 Meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="month"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="month"
                    value={customEnd}
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
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              title="Receitas"
              value={totals.receitas}
              color="text-emerald-500"
            />
            <SummaryCard
              title="Despesas"
              value={totals.despesas}
              color="text-red-500"
            />
            <SummaryCard
              title="Investimentos"
              value={totals.investimentos}
              color="text-violet-500"
            />
          </div>

          {/* Gráfico de Barras */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-semibold mb-6">Evolução Mensal</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `R$${v / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
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
                  {(filterType === "all" || filterType === "investimento") && (
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
          </div>

          {/* Seção de Pizza */}
          {expenseCategoryData.length > 0 && (
            <CategoryPieSection
              title="Distribuição de Despesas"
              data={expenseCategoryData}
            />
          )}
        </TabsContent>

        <TabsContent value="investments">
          <InvestmentReport transactions={allTransactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
        {title}
      </p>
      <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
    </div>
  );
}

function CategoryPieSection({ title, data }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="font-semibold mb-6">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.slice(0, 6).map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-semibold">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
