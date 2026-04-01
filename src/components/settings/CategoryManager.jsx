import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUILTIN_EXPENSE_CATEGORIES,
  BUILTIN_INCOME_CATEGORIES,
} from "@/lib/categories";
import { Plus, Trash2, Pencil, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COLOR_PALETTE = [
  "#0ea5e9",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#e11d48",
  "#8b5cf6",
  "#0d9488",
  "#0284c7",
  "#d97706",
  "#10b981",
  "#64748b",
];

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {COLOR_PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "w-6 h-6 rounded-full border-2 transition-all flex-shrink-0",
            value === c ? "border-foreground scale-110" : "border-transparent",
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

function CategorySection({ title, type, builtinCats, serverCategories }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);

  // Mutações para o Banco de Dados
  const saveMutation = useMutation({
    mutationFn: (data) => api.post("/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewName("");
      setShowAddForm(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  // Filtra categorias do banco pelo tipo (receita/despesa)
  const customs = serverCategories.filter((c) => c.type === type);

  // Identifica quais categorias padrão foram "deletadas" (is_deleted no banco)
  const deletedBuiltinKeys = serverCategories
    .filter((c) => c.is_deleted)
    .map((c) => c.name);

  const visibleBuiltins = Object.entries(builtinCats).filter(
    ([key]) => !deletedBuiltinKeys.includes(key),
  );

  const handleAdd = () => {
    if (!newName.trim()) return;
    saveMutation.mutate({
      name: `custom_${Date.now()}`,
      label: newName.trim(),
      color: newColor,
      type: type,
    });
  };

  const handleToggleBuiltin = (key) => {
    if (confirm("Deseja remover esta categoria padrão?")) {
      saveMutation.mutate({ name: key, type: type, is_deleted: true });
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
            {visibleBuiltins.length + customs.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-3 h-3 mr-1" /> Nova
        </Button>
      </div>

      {showAddForm && (
        <div className="p-4 border-b border-border bg-secondary/10 space-y-3">
          <Input
            placeholder="Nome da categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            )}
            Adicionar
          </Button>
        </div>
      )}

      <div className="divide-y divide-border">
        {/* Renderiza Padrões */}
        {visibleBuiltins.map(([key, val]) => (
          <div
            key={key}
            className="px-4 py-3 flex items-center gap-3 opacity-80"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: val.color }}
            />
            <span className="text-sm flex-1">{val.label}</span>
            <span className="text-[10px] text-muted-foreground uppercase">
              padrão
            </span>
            <button
              onClick={() => handleToggleBuiltin(key)}
              className="p-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Renderiza Customizadas do Banco */}
        {customs
          .filter((c) => !c.is_deleted)
          .map((cat) => (
            <div key={cat.id} className="px-4 py-3 flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm flex-1">{cat.label}</span>
              <button
                onClick={() => {
                  if (confirm("Excluir?")) deleteMutation.mutate(cat.id);
                }}
                className="p-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function CategoryManager() {
  const { data: serverCategories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  if (isLoading)
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    );

  return (
    <div className="space-y-6">
      <CategorySection
        title="Categorias de Despesa"
        type="despesa"
        builtinCats={BUILTIN_EXPENSE_CATEGORIES}
        serverCategories={serverCategories}
      />
      <CategorySection
        title="Categorias de Receita"
        type="receita"
        builtinCats={BUILTIN_INCOME_CATEGORIES}
        serverCategories={serverCategories}
      />
    </div>
  );
}
