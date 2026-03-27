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

  // 1. Busca todas as transações (Neon/Render)
  const { data: allTransactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 2. Busca configurações do usuário
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

  // 3. Filtra transações do mês selecionado (Tratamento de String para evitar erro de Fuso Horário)
  const monthTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date) return false;
      const [y, m] = t.date.split("T")[0].split("-");
      return parseInt(m) - 1 === month && parseInt(y) === year;
    });
  }, [allTransactions, month, year]);

  // 4. Lógica de Saldo Anterior (Carry Over)
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

  // 5. Cálculos de Estatísticas para os Cards (Garante que tudo seja número)
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

  // Renderização de Loading
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
      {/* Cabeçalho */}
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

      {/* Cards de Resumo (Receita, Despesa, Saldo, Investimentos) */}
      <StatsCards data={stats} />

      {/* Seção de Gráficos de Pizza - Lado a Lado no Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Despesas (Por Categoria) */}
        <CategoryPieChart transactions={monthTransactions} />

        {/* Gráfico de Receitas (Por Categoria) */}
        <IncomePieChart transactions={monthTransactions} />
      </div>

      {/* Gráfico de Barras Mensal (Histórico do Ano) */}
      <MonthlyBarChart transactions={allTransactions} />

      {/* Tabela de Transações Recentes do Mês Selecionado */}
      <RecentTransactions transactions={monthTransactions} />
    </div>
  );
}
