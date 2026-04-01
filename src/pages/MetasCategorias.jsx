import React, { useState, useMemo, useEffect } from "react";
import { getExpenseCategories, INVESTMENT_CATEGORY } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fincontrol_category_goals";

const INVESTMENT_ITEM = {
  key: "investimentos",
  label: "Investimentos",
  color: "#7c3aed",
  isInvestment: true,
};

function loadGoals() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function clampGoals(goals) {
  const entries = Object.entries(goals).map(([k, v]) => [
    k,
    parseFloat(v) || 0,
  ]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total <= 100) return Object.fromEntries(entries);
  return Object.fromEntries(
    entries.map(([k, v]) => [k, parseFloat(((v / total) * 100).toFixed(1))]),
  );
}

export default function MetasCategorias() {
  const [goals, setGoals] = useState(() => clampGoals(loadGoals()));
  const [saved, setSaved] = useState(false);
  const [catVersion, setCatVersion] = useState(0);

  const expenseCategories = useMemo(() => getExpenseCategories(), [catVersion]);

  // Lista de categorias: despesas + investimento fixo no topo
  const categoryList = useMemo(
    () => [
      INVESTMENT_ITEM,
      ...Object.entries(expenseCategories).map(([key, val]) => ({
        key,
        label: val.label,
        color: val.color,
      })),
    ],
    [expenseCategories],
  );

  useEffect(() => {
    const handler = () => setCatVersion((v) => v + 1);
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const totalGoalPercent = useMemo(
    () => Object.values(goals).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [goals],
  );

  const handleChange = (key, value) => {
    const num = Math.min(100, Math.max(0, parseFloat(value) || 0));
    setGoals((prev) => ({ ...prev, [key]: num }));
  };

  const handleSave = () => {
    if (totalGoalPercent > 100) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isOver = totalGoalPercent > 100;
  const remaining = Math.max(0, 100 - totalGoalPercent);

  const pieData = categoryList
    .map((c) => ({
      name: c.label,
      value: parseFloat(goals[c.key]) || 0,
      color: c.color,
      key: c.key,
    }))
    .filter((d) => d.value > 0);

  const pieDataFull =
    pieData.length > 0
      ? [
          ...pieData,
          ...(remaining > 0
            ? [{ name: "Livre", value: remaining, color: "hsl(var(--border))" }]
            : []),
        ]
      : [{ name: "Sem metas", value: 100, color: "hsl(var(--border))" }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Metas por Categoria
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Defina qual % da receita vai para cada categoria (despesas +
            investimentos)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Salvo!
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={isOver}
            variant={isOver ? "destructive" : "default"}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar metas
          </Button>
        </div>
      </div>

      {isOver && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 text-sm text-destructive font-medium">
          <span className="flex-shrink-0">⚠️</span>
          <span>
            Total de {totalGoalPercent.toFixed(1)}% ultrapassa 100%. Reduza os
            valores antes de salvar.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pizza */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-semibold mb-1">Distribuição</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Alocado:{" "}
            <span
              className={cn(
                "font-bold",
                isOver ? "text-destructive" : "text-foreground",
              )}
            >
              {totalGoalPercent.toFixed(1)}%
            </span>
            {remaining > 0 && <span> · Livre: {remaining.toFixed(1)}%</span>}
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataFull}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                  label={({
                    value,
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                  }) => {
                    if (value < 5) return null;
                    const R = Math.PI / 180;
                    const radius =
                      innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * R);
                    const y = cy + radius * Math.sin(-midAngle * R);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={600}
                      >
                        {value.toFixed(0)}%
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {pieDataFull.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [`${v.toFixed(1)}%`, name]}
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
          <div className="space-y-1.5 mt-1">
            {pieData.map((d) => (
              <div key={d.key} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-muted-foreground flex-1 truncate">
                  {d.name}
                </span>
                <span className="font-semibold">{d.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Ajuste por Categoria</h3>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                isOver ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {totalGoalPercent.toFixed(1)}% / 100%
            </span>
          </div>

          {categoryList.map((c) => {
            const goal = parseFloat(goals[c.key]) || 0;
            return (
              <div key={c.key} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-sm font-medium flex-1 truncate">
                    {c.label}
                  </span>
                  {c.isInvestment && (
                    <span className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded px-1.5 py-0.5 font-medium flex-shrink-0">
                      investimento
                    </span>
                  )}
                  <div className="flex items-center gap-1 bg-secondary rounded-lg px-3 py-1.5 border border-border w-24 flex-shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={goal === 0 ? "" : String(Math.round(goal))}
                      onChange={(e) => handleChange(c.key, e.target.value)}
                      placeholder="0"
                      className="w-full text-right text-sm font-bold bg-transparent focus:outline-none tabular-nums"
                      style={{ color: c.color }}
                    />
                    <span className="text-sm text-muted-foreground font-medium">
                      %
                    </span>
                  </div>
                </div>
                <div className="relative h-5 flex items-center">
                  <div className="w-full h-2 bg-border rounded-full overflow-visible relative">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${goal}%`, backgroundColor: c.color }}
                    />
                    {goal > 0 && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all pointer-events-none"
                        style={{
                          left: `calc(${goal}% - 8px)`,
                          backgroundColor: c.color,
                        }}
                      />
                    )}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={goal}
                    onChange={(e) => handleChange(c.key, e.target.value)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
