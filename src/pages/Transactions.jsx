import React, { useState, useMemo } from "react";
import { api } from "../api/apiClient";
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

// Corrigido para 'Dashboard' (Maiúsculo) conforme o erro anterior do Vercel
import MonthSelector from "@/components/Dashboard/MonthSelector";

import {
  CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/categories";
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

  // Busca de transações via API padrão
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get("/transactions", {
        params: { sort: "-date", limit: 500 },
      });
      return response.data;
    },
  });

  // Mutação para criar (Bulk ou individual)
  const createMutation = useMutation({
    mutationFn: (records) => api.post("/transactions/bulk", records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setShowForm(false);
    },
  });

  // Mutação para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setEditing(null);
      setShowForm(false);
    },
  });

  // Mutação para deletar
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/transactions/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      const d = new Date(t.date);
      const monthMatch = d.getMonth() === month && d.getFullYear() === year;
      const searchMatch =
        !search || t.description.toLowerCase().includes(search.toLowerCase());
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="investimentos">Investimentos</SelectItem>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                ↓ {val.label}
              </SelectItem>
            ))}
            {Object.entries(INCOME_CATEGORIES).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                ↑ {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      </div>

      <TransactionList
        transactions={filtered}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
