import React, { useState, useMemo } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionList from "@/components/transactions/TransactionList";
import MonthSelector from "@/components/dashboard/MonthSelector";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { Skeleton } from "@/components/ui/skeleton";

export default function Transactions() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const queryClient = useQueryClient();

  // 1. Busca de Dados (Neon/Render)
  const {
    data: allTransactions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 2. Mutações (Neon/Render)
  const createMutation = useMutation({
    mutationFn: (records) => api.post("/transactions", records[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setEditing(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/transactions/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  // 3. Filtro Robusto (Evita problemas de Timezone)
  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      if (!t.date) return false;

      // Usa split para pegar a data real sem conversão de fuso horário
      const [y, m] = t.date.split("T")[0].split("-");
      const monthMatch = parseInt(m) - 1 === month && parseInt(y) === year;

      const searchMatch =
        !search || t.description?.toLowerCase().includes(search.toLowerCase());
      const catMatch =
        filterCategory === "all" || t.category === filterCategory;
      const typeMatch = filterType === "all" || t.type === filterType;

      return monthMatch && searchMatch && catMatch && typeMatch;
    });
  }, [allTransactions, month, year, search, filterCategory, filterType]);

  const handleSubmit = (records) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: records[0] });
    } else {
      createMutation.mutate(records);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector
            month={month}
            year={year}
            onChange={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
          />
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova
          </Button>
        </div>
      </div>

      {showForm && (
        <TransactionForm
          transaction={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
              <SelectItem value="investimento">Investimentos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="investimentos">Investimentos</SelectItem>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-slate-50/50">
                Despesas
              </div>
              {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-slate-50/50 border-t mt-1">
                Receitas
              </div>
              {Object.entries(INCOME_CATEGORIES).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <TransactionList
          transactions={filtered}
          onEdit={(t) => {
            setEditing(t);
            setShowForm(true);
          }}
          onDelete={(id) => {
            if (window.confirm("Deseja excluir esta transação?"))
              deleteMutation.mutate(id);
          }}
        />
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            Nenhuma transação encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
