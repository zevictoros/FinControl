import React, { useState, useMemo, useEffect } from "react";
import { api } from "@/api/apiClient"; // Trocado para sua nova API
import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/StatsCards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import IncomePieChart from "@/components/dashboard/IncomePieChart";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import MonthSelector from "@/components/dashboard/MonthSelector";
import Insights from "@/components/dashboard/Insights";
import { Skeleton } from "@/components/ui/skeleton";

// Função auxiliar para garantir que o valor seja um número válido
const parseNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

async function fetchCryptoPrices(coinIds) {
  if (!coinIds.length) return {};
  try {
    const ids = coinIds.join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`,
    );
    return await res.json();
  } catch (err) {
    console.error("Erro Crypto API:", err);
    return {};
  }
}

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  // 1. BUSCAR TRANSAÇÕES (Rota do seu server.js)
  const { data: allTransactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return response.data || [];
    },
  });

  // 2. BUSCAR CONFIGURAÇÕES
  const { data: settings = null, isLoading: loadingSettings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const response = await api.get("/settings");
      return response.data || { carry_balance: false };
    },
  });

  // 3. BUSCAR CRIPTO (Rota corrigida para bater com o server.js)
  const { data: cryptoHoldings = [] } = useQuery({
    queryKey: ["crypto"],
    queryFn: async () => {
      const response = await api.get("/crypto-holdings");
      return response.data || [];
    },
  });

  // Mapeamento de IDs para a API de preços (ajustado para os campos do seu novo banco)
  const coinIdsForPrices = useMemo(() => {
    // Se o seu banco salvar como 'BTC', precisamos converter para 'bitcoin' para a API funcionar
    // Aqui assumimos que você está usando os IDs compatíveis ou uma lista de referência
    return [
      ...new Set(
        cryptoHoldings.map((h) => h.coin_id || h.symbol?.toLowerCase()),
      ),
    ].filter(Boolean);
  }, [cryptoHoldings]);

  const { data: cryptoPrices = {} } = useQuery({
    queryKey: ["cryptoPrices", coinIdsForPrices.join(",")],
    queryFn: () => fetchCryptoPrices(coinIdsForPrices),
    enabled: coinIdsForPrices.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingTx || loadingSettings;

  // Filtragem de transações do mês selecionado
  const monthTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date + "T12:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [allTransactions, month, year]);

  // Saldo do mês anterior (Carry Balance)
  const prevMonthBalance = useMemo(() => {
    if (!settings?.carry_balance) return 0;

    const prevDate = new Date(year, month - 1, 1);
    const prevM = prevDate.getMonth();
    const prevY = prevDate.getFullYear();

    const prevTx = allTransactions.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date + "T12:00:00");
      return d.getMonth() === prevM && d.getFullYear() === prevY;
    });

    const r = prevTx
      .filter((t) => t.type === "receita")
      .reduce((s, t) => s + parseNumber(t.amount), 0);
    const d = prevTx
      .filter((t) => t.type === "despesa")
      .reduce((s, t) => s + parseNumber(t.amount), 0);
    const inv = prevTx
      .filter((t) => t.type === "investimento")
      .reduce((s, t) => s + parseNumber(t.amount), 0);

    const balance = r - d - inv;
    return balance > 0 ? balance : 0;
  }, [allTransactions, month, year, settings]);

  // Estatísticas principais (Protegidas contra NaN)
  const stats = useMemo(() => {
    const receitas =
      monthTransactions
        .filter((t) => t.type === "receita")
        .reduce((sum, t) => sum + parseNumber(t.amount), 0) + prevMonthBalance;

    const despesas = monthTransactions
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum + parseNumber(t.amount), 0);

    const investimentos = monthTransactions
      .filter((t) => t.type === "investimento")
      .reduce((sum, t) => sum + parseNumber(t.amount), 0);

    return {
      receitas,
      despesas,
      investimentos,
      saldo: receitas - despesas - investimentos,
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
            Conectado ao FinControl API
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

      {/* Cards de Resumo */}
      <StatsCards data={stats} />

      {/* Gráficos de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart transactions={monthTransactions} />
        <IncomePieChart transactions={monthTransactions} />
      </div>

      {/* Gráfico de Barras Anual */}
      <MonthlyBarChart transactions={allTransactions} />

      {/* Insights (IA e Cripto) */}
      <Insights
        transactions={allTransactions}
        cryptoHoldings={cryptoHoldings}
        cryptoPrices={cryptoPrices}
      />

      {/* Tabela de Transações Recentes */}
      <RecentTransactions transactions={monthTransactions} />
    </div>
  );
}
