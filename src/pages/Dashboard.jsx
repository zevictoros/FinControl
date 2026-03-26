import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/StatsCards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import MonthSelector from "@/components/dashboard/MonthSelector";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const fetchTransactions = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/transactions`);
  
  if (!res.ok) {
    throw new Error("Erro ao buscar transações");
  }

  return res.json();
};

const { data: allTransactions = [], isLoading } = useQuery({
  queryKey: ["transactions"],
  queryFn: fetchTransactions,
});

  const monthTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [allTransactions, month, year]);

  const stats = useMemo(() => {
    const receitas = monthTransactions
      .filter((t) => t.type === "receita")
      .reduce((sum, t) => sum + t.amount, 0);
    const despesas = monthTransactions
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum + t.amount, 0);
    const investimentos = monthTransactions
      .filter((t) => t.category === "investimentos")
      .reduce((sum, t) => sum + t.amount, 0);
    return { receitas, despesas, saldo: receitas - despesas, investimentos };
  }, [monthTransactions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral das suas finanças</p>
        </div>
        <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      <StatsCards data={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart transactions={monthTransactions} />
        <MonthlyBarChart transactions={allTransactions} />
      </div>

      <RecentTransactions transactions={monthTransactions} />
    </div>
  );
}