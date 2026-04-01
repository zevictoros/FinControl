import React, { useState, useMemo } from "react";
import { api } from "@/api/apiClient"; // Usando sua API real
import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/StatsCards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import IncomePieChart from "@/components/dashboard/IncomePieChart";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import MonthSelector from "@/components/dashboard/MonthSelector";
import Insights from "@/components/dashboard/Insights";
import { Skeleton } from "@/components/ui/skeleton";

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

  // 1. Busca Transações (Neon/Render)
  const { data: allTransactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 2. Busca Configurações (Neon/Render)
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      try {
        const response = await api.get("/settings");
        // Se retornar array, pega o primeiro, senão o objeto
        return Array.isArray(response.data)
          ? response.data[0]
          : response.data || { carry_balance: false };
      } catch {
        return { carry_balance: false };
      }
    },
  });

  // 3. Busca Cripto (Neon/Render)
  const { data: cryptoHoldings = [] } = useQuery({
    queryKey: ["crypto"],
    queryFn: async () => {
      const response = await api.get("/crypto-holdings");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 4. Preços Cripto (Externo)
  const { data: cryptoPrices = {} } = useQuery({
    queryKey: ["cryptoPrices", cryptoHoldings.map((h) => h.coin_id).join(",")],
    queryFn: () =>
      fetchCryptoPrices([...new Set(cryptoHoldings.map((h) => h.coin_id))]),
    enabled: cryptoHoldings.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingTx || loadingSettings;

  // 5. Filtro de Transações (Lógica do Antigo: split para evitar erro de Timezone)
  const monthTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date) return false;
      const [y, m] = t.date.split("T")[0].split("-");
      return parseInt(m) - 1 === month && parseInt(y) === year;
    });
  }, [allTransactions, month, year]);

  // 6. Lógica de Saldo Anterior (Protegida contra NaN)
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

    return balance; // Retornamos o saldo real (pode ser negativo)
  }, [allTransactions, month, year, settings]);

  // 7. Estatísticas Finais (Garantia total contra NaN)
  const stats = useMemo(() => {
    const calculateSum = (type) =>
      monthTransactions
        .filter((t) => t.type === type)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const receitasBase = calculateSum("receita");
    const despesasBase = calculateSum("despesa");
    const investimentos = calculateSum("investimento");

    // Lógica: Se saldo anterior for positivo, soma na receita. Se negativo, soma na despesa.
    const receitas =
      receitasBase + (prevMonthBalance > 0 ? prevMonthBalance : 0);
    const despesas =
      despesasBase + (prevMonthBalance < 0 ? Math.abs(prevMonthBalance) : 0);

    return {
      receitas,
      despesas,
      investimentos,
      saldo: receitas - despesas - investimentos,
    };
  }, [monthTransactions, prevMonthBalance]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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

      <Insights
        transactions={allTransactions}
        cryptoHoldings={cryptoHoldings}
        cryptoPrices={cryptoPrices}
      />

      <RecentTransactions transactions={monthTransactions} />
    </div>
  );
}
