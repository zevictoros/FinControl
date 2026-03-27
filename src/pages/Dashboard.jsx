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

  // Busca todas as transações do banco Neon
  const { data: allTransactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // Busca configurações do usuário
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      try {
        const response = await api.get("/settings");
        return response.data || { carry_balance: false };
      } catch {
        return { carry_balance: false };
      }
    },
  });

  const isLoading = loadingTx || loadingSettings;

  // Filtra transações do mês selecionado (Correção de Fuso Horário)
  const monthTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date) return false;
      // Extrai YYYY-MM-DD com segurança sem converter fuso
      const [y, m] = t.date.split("T")[0].split("-");
      return parseInt(m) - 1 === month && parseInt(y) === year;
    });
  }, [allTransactions, month, year]);

  // Lógica de Saldo Anterior (Carry Over)
  const prevMonthBalance = useMemo(() => {
    if (!settings?.carry_balance) return 0;

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;

    const prevTx = allTransactions.filter((t) => {
      if (!t.date) return false;
      const [y, m] = t.date.split("T")[0].split("-");
      return parseInt(m) - 1 === prevMonth && parseInt(y) === prevYear;
    });

    const calculateSum = (type) =>
      prevTx
        .filter((t) => t.type === type)
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const balance =
      calculateSum("receita") -
      calculateSum("despesa") -
      calculateSum("investimento");
    return balance > 0 ? balance : 0;
  }, [allTransactions, month, year, settings]);

  // Cálculos de Estatísticas (Correção de NaN)
  const stats = useMemo(() => {
    const calculateSum = (type) =>
      monthTransactions
        .filter((t) => t.type === type)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const receitasNoMes = calculateSum("receita");
    const despesas = calculateSum("despesa");
    const investimentos = calculateSum("investimento");

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

      {/* Cards de resumo corrigidos */}
      <StatsCards data={stats} />

      {/* Gráficos de Pizza (passando transactions para processamento interno) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart transactions={monthTransactions} />
        <IncomePieChart transactions={monthTransactions} />
      </div>

      {/* Gráfico de Barras Mensal */}
      <MonthlyBarChart transactions={allTransactions} />

      {/* Tabela de Transações Recentes */}
      <RecentTransactions transactions={monthTransactions} />
    </div>
  );
}
