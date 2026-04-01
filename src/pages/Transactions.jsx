import React, { useState, useMemo } from "react";
import { api } from "@/api/apiClient"; // Conexão com seu backend Neon
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
import { Plus, Search, Loader2 } from "lucide-react";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionList from "@/components/transactions/TransactionList";
import MonthSelector from "@/components/dashboard/MonthSelector";
import { getExpenseCategories, INCOME_CATEGORIES } from "@/lib/categories";
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

  // Busca transações do Backend Neon
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // Mutação para Criar (ajustado para o padrão do formulário que envia array)
  const createMutation = useMutation({
    mutationFn: (records) => api.post("/transactions", records[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setShowForm(false);
    },
  });

  // Mutação para Atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setEditing(null);
      setShowForm(false);
    },
  });

  // Mutação para Deletar
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/transactions/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  // Filtros aplicados no Front-end (baseado no mês selecionado no seletor)
  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      // Normalização de data para evitar problemas de fuso horário (UTC vs Local)
      const d = new Date(t.date + "T12:00:00");

      const monthMatch = d.getMonth() === month && d.getFullYear() === year;
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

  const handleEdit = (t) => {
    setEditing(t);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("Deseja realmente excluir esta transação?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl w-full" />
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
            Controle suas entradas e saídas
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
            className="shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="animate-in fade-in zoom-in duration-200">
          <TransactionForm
            transaction={editing}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="investimentos">Investimentos</SelectItem>
            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Despesas
            </div>
            {Object.entries(getExpenseCategories()).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                ↓ {val.label}
              </SelectItem>
            ))}
            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t mt-1">
              Receitas
            </div>
            {Object.entries(INCOME_CATEGORIES).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                ↑ {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="receita">Receitas</SelectItem>
            <SelectItem value="despesa">Despesas</SelectItem>
            <SelectItem value="investimento">Investimentos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Transações */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[300px]">
        {deleteMutation.isPending && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        <TransactionList
          transactions={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">
              Nenhuma transação encontrada para este período.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
