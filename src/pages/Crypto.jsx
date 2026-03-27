import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/categories";
import { Skeleton } from "@/components/ui/skeleton";

const POPULAR_COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "solana", name: "Solana", symbol: "SOL" },
];

async function fetchPrices(coinIds) {
  if (!coinIds || coinIds.length === 0) return {};
  const ids = coinIds.join(",");
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`,
    );
    return await res.json();
  } catch (error) {
    console.error("Erro ao buscar preços na CoinGecko:", error);
    return {};
  }
}

export default function Crypto() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ coin_id: "bitcoin", quantity: "" });
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const queryClient = useQueryClient();

  // Busca de holdings no Backend Neon
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["crypto"],
    queryFn: async () => {
      const response = await api.get("/crypto-holdings");
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/crypto-holdings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crypto"] });
      setShowForm(false);
      setForm({ coin_id: "bitcoin", quantity: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/crypto-holdings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crypto"] }),
  });

  const loadPrices = async () => {
    if (!holdings || holdings.length === 0) return;
    setLoadingPrices(true);
    // Busca os IDs únicos salvos (os coins_id da CoinGecko)
    const ids = [
      ...new Set(
        holdings.map((h) =>
          h.symbol.toLowerCase() === "btc"
            ? "bitcoin"
            : h.symbol.toLowerCase() === "eth"
              ? "ethereum"
              : h.symbol.toLowerCase() === "sol"
                ? "solana"
                : h.symbol.toLowerCase() === "bnb"
                  ? "binancecoin"
                  : h.symbol.toLowerCase(),
        ),
      ),
    ];

    const data = await fetchPrices(ids);
    setPrices(data);
    setLoadingPrices(false);
  };

  useEffect(() => {
    if (holdings.length > 0) {
      loadPrices();
    }
  }, [holdings]);

  const handleAdd = (e) => {
    e.preventDefault();
    const coin = POPULAR_COINS.find((c) => c.id === form.coin_id);

    // Envia os dados no formato que o seu server.js (Neon) espera
    createMutation.mutate({
      symbol: coin.symbol,
      amount: parseFloat(form.quantity) || 0,
    });
  };

  const totalPortfolio = holdings.reduce((sum, h) => {
    // Mapeia o símbolo para o ID da CoinGecko para pegar o preço
    const coinIdMap = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      BNB: "binancecoin",
    };
    const id = coinIdMap[h.symbol.toUpperCase()] || h.symbol.toLowerCase();
    const price = prices[id]?.brl || 0;
    const qty = parseFloat(h.amount) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criptomoedas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe sua carteira cripto em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadPrices}
            disabled={loadingPrices || holdings.length === 0}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loadingPrices ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Total Card */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Total da Carteira
        </p>
        <div className="text-3xl font-bold text-foreground">
          {isLoading ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            formatCurrency(totalPortfolio || 0)
          )}
        </div>
      </div>

      {/* Formulário de Adição */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-base">Nova Criptomoeda</h3>
          <form
            onSubmit={handleAdd}
            className="flex flex-col sm:flex-row gap-4 items-end"
          >
            <div className="flex-1 w-full space-y-2">
              <Label>Moeda</Label>
              <select
                value={form.coin_id}
                onChange={(e) => setForm({ ...form, coin_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {POPULAR_COINS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder="Ex: 0.5"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                className="flex-1 sm:flex-none"
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Ativos */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : holdings.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground border-dashed">
          Nenhuma criptomoeda cadastrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {holdings.map((h) => {
            const coinIdMap = {
              BTC: "bitcoin",
              ETH: "ethereum",
              SOL: "solana",
              BNB: "binancecoin",
            };
            const id =
              coinIdMap[h.symbol.toUpperCase()] || h.symbol.toLowerCase();
            const priceData = prices[id];
            const price = priceData?.brl || 0;
            const change = priceData?.brl_24h_change || 0;
            const qty = parseFloat(h.amount) || 0;
            const total = qty * price;

            return (
              <div
                key={h.id}
                className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {h.symbol}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        {h.symbol.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {qty} {h.symbol}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Deseja remover este ativo?"))
                        deleteMutation.mutate(h.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Preço Atual
                    </p>
                    <p className="font-medium text-sm">
                      {loadingPrices
                        ? "..."
                        : price > 0
                          ? formatCurrency(price)
                          : "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Valor Total
                    </p>
                    <p className="font-bold text-sm text-foreground">
                      {loadingPrices
                        ? "..."
                        : total > 0
                          ? formatCurrency(total)
                          : "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Variação 24h
                    </p>
                    {price > 0 ? (
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {change >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {Math.abs(change).toFixed(2)}%
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">---</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
