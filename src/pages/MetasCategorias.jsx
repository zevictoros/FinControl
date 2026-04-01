import React, { useState, useMemo, useEffect } from "react";
import { getExpenseCategories } from "@/lib/categories";
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
  const entries = Object.entries(goals).map(([k, v]) => [k, Number(v) || 0]);
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
    () => Object.values(goals).reduce((s, v) => s + (Number(v) || 0), 0),
    [goals],
  );

  const handleChange = (key, value) => {
    const num = Math.min(100, Math.max(0, Number(value) || 0));
    setGoals((prev) => ({ ...prev, [key]: num }));
  };

  const handleSave = () => {
    if (totalGoalPercent > 100) return;
    const toSave = Object.fromEntries(
      Object.entries(goals).map(([k, v]) => [k, Number(v) || 0]),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isOver = totalGoalPercent > 100;
  const remaining = Math.max(0, 100 - totalGoalPercent);

  const pieData = categoryList
    .map((c) => ({
      name: c.label,
      value: Number(goals[c.key]) || 0,
      color: c.color,
      key: c.key,
    }))
    .filter((d) => d.value > 0);

  const pieDataFull =
    pieData.length > 0
      ? [
          ...pieData,
          ...(remaining > 0
            ? [{ name: "Livre", value: remaining, color: "#e2e8f0" }]
            : []),
        ]
      : [{ name: "Sem metas", value: 100, color: "#e2e8f0" }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Metas por Categoria
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Defina a % da receita para cada categoria
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Salvo!
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={isOver}
            variant={isOver ? "destructive" : "default"}
          >
            <Save className="w-4 h-4 mr-2" /> Salvar metas
          </Button>
        </div>
      </div>

      {isOver && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 text-sm text-destructive font-medium">
          ⚠️ Total de {totalGoalPercent.toFixed(1)}% ultrapassa 100%.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Distribuição</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataFull}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {pieDataFull.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Ajuste por Categoria</h3>
            <span
              className={cn(
                "text-sm font-bold",
                isOver ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {totalGoalPercent.toFixed(1)}% / 100%
            </span>
          </div>

          {categoryList.map((c) => {
            const goal = Number(goals[c.key]) || 0;
            return (
              <div key={c.key} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-sm font-medium flex-1 truncate">
                    {c.label}
                  </span>
                  <div className="flex items-center gap-1 bg-secondary rounded-lg px-2 py-1 border border-border w-20">
                    <input
                      type="number"
                      value={goal === 0 ? "" : Math.round(goal)}
                      onChange={(e) => handleChange(c.key, e.target.value)}
                      className="w-full text-right text-sm font-bold bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goal}
                  onChange={(e) => handleChange(c.key, e.target.value)}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
