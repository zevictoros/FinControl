import React, { useState, useMemo } from "react";
// Importamos o cliente de API genérico que você deve ter/criar
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";

// ATENÇÃO: Corrigido para 'Dashboard' com D maiúsculo para bater com a pasta física
import StatsCards from "@/components/Dashboard/StatsCards";
import CategoryPieChart from "@/components/Dashboard/CategoryPieChart";
import MonthlyBarChart from "@/components/Dashboard/MonthlyBarChart";
import RecentTransactions from "@/components/Dashboard/RecentTransactions";
import MonthSelector from "@/components/Dashboard/MonthSelector";

import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions", {
        params: {
          sort: "-date",
          limit: 500,
        },
      });
      return response.data;
    },
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
      .filter((t) => t.type === "investimento")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      receitas,
      despesas,
      saldo: receitas - despesas - investimentos,
      investimentos,
    };
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
          <p className="text-muted-foreground text-sm mt-1">
            Visão geral das suas finanças
          </p>
        </div>
        <MonthSelector
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
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
