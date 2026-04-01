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
  HelpCircle,
  Pencil,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/categories";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

// Lista de referência para IDs da CoinGecko baseada nos símbolos do seu banco
const POPULAR_COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
];

async function fetchPrices(coinIds) {
  if (!coinIds.length) return {};
  try {
    const ids = coinIds.join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`,
    );
    return await res.json();
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    return {};
  }
}

export default function Crypto() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ coin_id: "bitcoin", quantity: "" });
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const queryClient = useQueryClient();

  // 1. BUSCAR (Rota corrigida para /crypto-holdings)
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["crypto"],
    queryFn: async () => {
      const response = await api.get("/crypto-holdings");
      return response.data;
    },
  });

  // 2. CRIAR/UPSERT (Enviando symbol e amount como no seu server.js)
  const createMutation = useMutation({
    mutationFn: (data) => api.post("/crypto-holdings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crypto"] });
      setShowForm(false);
      setForm({ coin_id: "bitcoin", quantity: "" });
    },
  });

  // 3. DELETAR
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/crypto-holdings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crypto"] }),
  });

  // Função para buscar preços baseada nos símbolos que vêm do banco
  const loadPrices = async () => {
    if (!holdings.length) return;
    setLoadingPrices(true);

    // Converte os símbolos do seu banco (BTC) nos IDs da API (bitcoin)
    const ids = holdings
      .map((h) => {
        const found = POPULAR_COINS.find(
          (c) => c.symbol === h.symbol.toUpperCase(),
        );
        return found ? found.id : null;
      })
      .filter((id) => id !== null);

    const data = await fetchPrices(ids);
    setPrices(data);
    setLoadingPrices(false);
  };

  useEffect(() => {
    if (holdings.length) loadPrices();
  }, [holdings]);

  const handleAdd = (e) => {
    e.preventDefault();
    const coin = POPULAR_COINS.find((c) => c.id === form.coin_id);

    // Seu backend espera { symbol, amount }
    createMutation.mutate({
      symbol: coin.symbol,
      amount: parseFloat(form.quantity),
    });
  };

  const handleUpdate = (h) => {
    createMutation.mutate({
      symbol: h.symbol,
      amount: parseFloat(editingValue),
    });
    setEditingId(null);
  };

  const totalPortfolio = holdings.reduce((sum, h) => {
    const coinRef = POPULAR_COINS.find(
      (c) => c.symbol === h.symbol.toUpperCase(),
    );
    const price = prices[coinRef?.id]?.brl || 0;
    return sum + parseFloat(h.amount) * price;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criptomoedas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sincronizado com Neon.tech
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadPrices}
            disabled={loadingPrices}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loadingPrices ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" /> Novo
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border p-6 shadow-sm">
        <p className="text-sm text-muted-foreground font-medium uppercase">
          Total Estimado
        </p>
        <p className="text-3xl font-bold">{formatCurrency(totalPortfolio)}</p>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
          <form
            onSubmit={handleAdd}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1 space-y-2">
              <Label>Moeda</Label>
              <select
                value={form.coin_id}
                onChange={(e) => setForm({ ...form, coin_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              >
                {POPULAR_COINS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
            <Button
              type="submit"
              className="mt-auto"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          holdings.map((h) => {
            const coinRef = POPULAR_COINS.find(
              (c) => c.symbol === h.symbol.toUpperCase(),
            );
            const priceData = prices[coinRef?.id];
            const price = priceData?.brl || 0;
            const change = priceData?.brl_24h_change || 0;
            const isEditing = editingId === h.id;

            return (
              <div
                key={h.id}
                className="bg-card rounded-2xl border p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {h.symbol}
                    </div>
                    <div>
                      <h4 className="font-bold">{coinRef?.name || h.symbol}</h4>
                      {isEditing ? (
                        <div className="flex gap-2 mt-1">
                          <Input
                            className="h-7 w-24"
                            type="number"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                          />
                          <Button
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleUpdate(h)}
                          >
                            OK
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {h.amount} {h.symbol}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="font-bold">
                        {formatCurrency(parseFloat(h.amount) * price)}
                      </p>
                      <p
                        className={`text-xs flex items-center justify-end ${change >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {change >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(change).toFixed(2)}%
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingId(h.id);
                        setEditingValue(h.amount);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(h.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
