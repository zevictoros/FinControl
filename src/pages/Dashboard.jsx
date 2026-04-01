import React, { useState, useMemo } from "react";
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/StatsCards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import IncomePieChart from "@/components/dashboard/IncomePieChart";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import MonthSelector from "@/components/dashboard/MonthSelector";
import Insights from "@/components/dashboard/Insights";
import { Skeleton } from "@/components/ui/skeleton";

// Função para buscar preços de Cripto (Igual ao seu antigo)
async function fetchCryptoPrices(coinIds) {
  if (!coinIds.length) return {};
  const ids = coinIds.join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`,
  );
  return res.json();
}

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

  // 3. Busca Cripto Holdings
  const { data: cryptoHoldings = [] } = useQuery({
    queryKey: ["crypto"],
    queryFn: async () => {
      const response = await api.get("/crypto-holdings");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 4. Busca Preços de Cripto (Igual ao seu antigo, mas usando dados da nova API)
  const { data: cryptoPrices = {} } = useQuery({
    queryKey: [
      "cryptoPrices",
      cryptoHoldings.map((h) => h.coin_id || h.symbol).join(","),
    ],
    queryFn: () => {
      // Mapeia os IDs para a Coingecko (Garante IDs únicos e válidos)
      const ids = [
        ...new Set(
          cryptoHoldings.map((h) => h.coin_id || h.symbol?.toLowerCase()),
        ),
      ];
      return fetchCryptoPrices(ids);
    },
    enabled: cryptoHoldings.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingTx || loadingSettings;

  // 5. Filtra transações do mês selecionado
  const monthTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date) return false;
      const datePart = t.date.split("T")[0];
      const [y, m] = datePart.split("-");
      return parseInt(m) - 1 === month && parseInt(y) === year;
    });
  }, [allTransactions, month, year]);

  // 6. Lógica de Saldo Anterior (Carry Over)
  const prevMonthBalance = useMemo(() => {
    if (!settings?.carry_balance) return 0;

    const prevDate = new Date(year, month - 1, 1);
    const prevM = prevDate.getMonth();
    const prevY = prevDate.getFullYear();

    const prevTx = allTransactions.filter((t) => {
      if (!t.date) return false;
      const datePart = t.date.split("T")[0];
      const [y, m] = datePart.split("-");
      return parseInt(m) - 1 === prevM && parseInt(y) === prevY;
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

  // 7. Cálculos de Estatísticas para os Cards
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visão geral das suas finanças
          </p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <MonthSelector
            month={month}
            year={year}
            onChange={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
          />
        </div>
      </div>

      <StatsCards data={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart transactions={monthTransactions} />
        <IncomePieChart transactions={monthTransactions} />
      </div>

      <MonthlyBarChart transactions={allTransactions} />

      {/* Reintegrado: Insights (Conforme seu antigo) */}
      <Insights
        transactions={allTransactions}
        cryptoHoldings={cryptoHoldings}
        cryptoPrices={cryptoPrices}
      />

      <RecentTransactions transactions={monthTransactions} />
    </div>
  );
}
