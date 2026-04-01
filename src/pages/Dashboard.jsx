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

// Função utilitária para buscar preços de Cripto (Coingecko é pública, sem necessidade de backend)
async function fetchCryptoPrices(coinIds) {
  if (!coinIds || coinIds.length === 0) return {};
  const ids = coinIds.join(",");
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`,
    );
    return await res.json();
  } catch (error) {
    console.error("Erro ao buscar preços de cripto:", error);
    return {};
  }
}

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  // 1. Busca Transações do Neon/Render
  const { data: allTransactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 2. Busca Configurações (ex: carry_balance)
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      try {
        const response = await api.get("/settings");
        // Ajuste: se sua API retorna array, pegamos o primeiro, senão o objeto
        return Array.isArray(response.data) ? response.data[0] : response.data;
      } catch {
        return { carry_balance: false };
      }
    },
  });

  // 3. Busca Carteira de Cripto
  const { data: cryptoHoldings = [] } = useQuery({
    queryKey: ["crypto"],
    queryFn: async () => {
      const response = await api.get("/crypto-holdings");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 4. Busca Preços de Cripto atualizados
  const { data: cryptoPrices = {} } = useQuery({
    queryKey: ["cryptoPrices", cryptoHoldings.map((h) => h.coin_id).join(",")],
    queryFn: () =>
      fetchCryptoPrices([...new Set(cryptoHoldings.map((h) => h.coin_id))]),
    enabled: cryptoHoldings.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  const isLoading = loadingTx || loadingSettings;

  // Filtro de Transações do Mês (Seguro contra fuso horário)
  const monthTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date) return false;
      const [y, m] = t.date.split("T")[0].split("-");
      return parseInt(m) - 1 === month && parseInt(y) === year;
    });
  }, [allTransactions, month, year]);

  // Lógica de Saldo Anterior (Carry Over)
  const prevMonthBalance = useMemo(() => {
    if (!settings?.carry_balance) return 0;

    const prevDate = new Date(year, month - 1, 1);
    const pMonth = prevDate.getMonth();
    const pYear = prevDate.getFullYear();

    const prevTx = allTransactions.filter((t) => {
      if (!t.date) return false;
      const [y, m] = t.date.split("T")[0].split("-");
      return parseInt(m) - 1 === pMonth && parseInt(y) === pYear;
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

  // Estatísticas para os Cards
  const stats = useMemo(() => {
    const calculateSum = (type) =>
      monthTransactions
        .filter((t) => t.type === type)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const receitasNoMes = calculateSum("receita");
    const despesas = calculateSum("despesa");
    const investimentos = calculateSum("investimento");

    const totalReceitas = receitasNoMes + prevMonthBalance;

    return {
      receitas: totalReceitas,
      despesas,
      investimentos,
      saldo: totalReceitas - despesas - investimentos,
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
    <div className="space-y-6 pb-10">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Controle financeiro pessoal
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

      {/* Cards de Resumo */}
      <StatsCards data={stats} />

      {/* Insights e Notificações (Sua nova funcionalidade) */}
      <Insights
        transactions={allTransactions}
        cryptoHoldings={cryptoHoldings}
        cryptoPrices={cryptoPrices}
      />

      {/* Gráficos de Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart transactions={monthTransactions} />
        <IncomePieChart transactions={monthTransactions} />
      </div>

      {/* Histórico Mensal */}
      <MonthlyBarChart transactions={allTransactions} />

      {/* Transações Recentes */}
      <RecentTransactions transactions={monthTransactions} />
    </div>
  );
}
