import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient"; // Migrado para seu novo cliente
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

function EditHoldingForm({ holding, onSave, onCancel, isPending }) {
  const [coinId, setCoinId] = useState(holding.coin_id);
  const [quantity, setQuantity] = useState(String(holding.quantity));

  const handleSubmit = (e) => {
    e.preventDefault();
    const coin = POPULAR_COINS.find((c) => c.id === coinId) || {
      id: holding.coin_id,
      name: holding.coin_name,
      symbol: holding.coin_symbol,
    };
    onSave({
      coin_id: coin.id,
      coin_name: coin.name,
      coin_symbol: coin.symbol,
      quantity: parseFloat(quantity),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 pt-3 border-t border-border space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Moeda</Label>
          <select
            value={coinId}
            onChange={(e) => setCoinId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {POPULAR_COINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Quantidade</Label>
          <Input
            type="number"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="h-9"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          <Check className="w-3.5 h-3.5 mr-1" />
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export default function Crypto() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ coin_id: "bitcoin", quantity: "" });
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  // Busca holdings do seu backend Neon
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["crypto"],
    queryFn: async () => {
      const response = await api.get("/crypto");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/crypto", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crypto"] });
      setShowForm(false);
      setForm({ coin_id: "bitcoin", quantity: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/crypto/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crypto"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/crypto/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crypto"] }),
  });

  const loadPrices = async () => {
    if (!holdings.length) return;
    setLoadingPrices(true);
    const ids = [...new Set(holdings.map((h) => h.coin_id))];
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
    const existing = holdings.find((h) => h.coin_id === coin.id);

    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        data: { quantity: existing.quantity + parseFloat(form.quantity) },
      });
    } else {
      createMutation.mutate({
        coin_id: coin.id,
        coin_name: coin.name,
        coin_symbol: coin.symbol,
        quantity: parseFloat(form.quantity),
      });
    }
  };

  const totalPortfolio = holdings.reduce((sum, h) => {
    const price = prices[h.coin_id]?.brl || 0;
    return sum + h.quantity * price;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criptomoedas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe sua carteira em tempo real
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
            Atualizar Preços
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Total da Carteira
        </p>
        <p className="text-3xl font-bold text-foreground">
          {formatCurrency(totalPortfolio)}
        </p>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4 animate-in fade-in zoom-in duration-200">
          <h3 className="font-semibold">Nova Criptomoeda</h3>
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
              <div className="flex items-center gap-1.5">
                <Label>Quantidade</Label>
                <Link
                  to="/calculadoras"
                  className="text-muted-foreground hover:text-primary"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </Link>
              </div>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Salvar
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

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {holdings.map((h) => {
            const priceData = prices[h.coin_id];
            const price = priceData?.brl || 0;
            const change = priceData?.brl_24h_change || 0;
            const total = h.quantity * price;
            const isEditing = editingId === h.id;

            return (
              <div
                key={h.id}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                      {h.coin_symbol}
                    </div>
                    <div>
                      <h4 className="font-bold">{h.coin_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {h.quantity} {h.coin_symbol}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingId(isEditing ? null : h.id)}
                    >
                      {isEditing ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Pencil className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        confirm("Excluir holding?") &&
                        deleteMutation.mutate(h.id)
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <EditHoldingForm
                    holding={h}
                    isPending={updateMutation.isPending}
                    onSave={(data) => updateMutation.mutate({ id: h.id, data })}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">
                        Preço Atual
                      </p>
                      <p className="font-semibold text-sm">
                        {price ? formatCurrency(price) : "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">
                        Valor Total
                      </p>
                      <p className="font-bold text-sm text-primary">
                        {price ? formatCurrency(total) : "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">
                        24h Change
                      </p>
                      <div
                        className={`flex items-center text-sm font-bold ${change >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {change >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(change).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
