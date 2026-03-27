import React, { useState, useMemo } from "react";
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/StatsCards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import IncomePieChart from "@/components/dashboard/IncomePieChart";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import MonthSelector from "@/components/dashboard/MonthSelector";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  // Busca todas as transações do SEU banco Neon via Render
  const { data: allTransactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return response.data;
    },
  });

  // Busca configurações do usuário (ex: carry_balance)
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      try {
        const response = await api.get("/settings");
        return response.data;
      } catch {
        return { carry_balance: false }; // Fallback caso não exista a rota ainda
      }
    },
  });

  const isLoading = loadingTx || loadingSettings;

  // Filtra transações do mês selecionado
  const monthTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const d = new Date(t.date);
      // Ajuste para evitar problemas de fuso horário na comparação
      return d.getUTCMonth() === month && d.getUTCFullYear() === year;
    });
  }, [allTransactions, month, year]);

  // Lógica de Saldo Anterior (Carry Over)
  const prevMonthBalance = useMemo(() => {
    if (!settings?.carry_balance) return 0;

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;

    const prevTx = allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getUTCMonth() === prevMonth && d.getUTCFullYear() === prevYear;
    });

    const r = prevTx
      .filter((t) => t.type === "receita")
      .reduce((s, t) => s + t.amount, 0);
    const d = prevTx
      .filter((t) => t.type === "despesa")
      .reduce((s, t) => s + t.amount, 0);
    const i = prevTx
      .filter((t) => t.type === "investimento")
      .reduce((s, t) => s + t.amount, 0);

    const balance = r - d - i;
    return balance > 0 ? balance : 0;
  }, [allTransactions, month, year, settings]);

  // Cálculos de Estatísticas (Receitas, Despesas, Investimentos)
  const stats = useMemo(() => {
    const receitasNoMes = monthTransactions
      .filter((t) => t.type === "receita")
      .reduce((sum, t) => sum + t.amount, 0);

    const despesas = monthTransactions
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum + t.amount, 0);

    const investimentos = monthTransactions
      .filter((t) => t.type === "investimento")
      .reduce((sum, t) => sum + t.amount, 0);

    const receitasTotais = receitasNoMes + prevMonthBalance;

    return {
      receitas: receitasTotais,
      despesas,
      investimentos,
      saldo: receitasTotais - despesas - investimentos,
    };
  }, [monthTransactions, prevMonthBalance]);

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

      {/* Cards de resumo (Receita, Despesa, Saldo, Investimentos) */}
      <StatsCards data={stats} />

      {/* Gráficos de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart transactions={monthTransactions} />
        <IncomePieChart transactions={monthTransactions} />
      </div>

      {/* Gráfico de Barras Mensal */}
      <MonthlyBarChart transactions={allTransactions} />

      {/* Tabela de Transações Recentes do Mês */}
      <RecentTransactions transactions={monthTransactions} />
    </div>
  );
}
