import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUILTIN_EXPENSE_CATEGORIES,
  BUILTIN_INCOME_CATEGORIES,
  getCustomCategories,
  getCustomIncomeCategories,
  saveCustomCategory,
  deleteCustomCategory,
  saveOverride,
  getOverrides,
  deleteBuiltinCategory,
  getDeletedBuiltins,
} from "@/lib/categories";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
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

function EditInlineForm({
  label: initLabel,
  color: initColor,
  onSave,
  onCancel,
}) {
  const [label, setLabel] = useState(initLabel);
  const [color, setColor] = useState(initColor);
  return (
    <div className="mt-2 p-3 bg-secondary/40 rounded-lg border border-border space-y-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Nome</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && label.trim() && onSave(label.trim(), color)
            }
            className="h-8 text-sm"
          />
        </div>
        <div
          className="w-8 h-8 rounded-lg border border-border flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      </div>
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave(label.trim(), color)}
          disabled={!label.trim()}
        >
          <Check className="w-3.5 h-3.5 mr-1" /> Salvar
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function CategoryRow({
  catKey,
  label,
  color,
  isBuiltin,
  type,
  editingKey,
  setEditingKey,
  onSaveEdit,
  onDelete,
}) {
  const isEditing = editingKey === catKey;
  return (
    <div className="px-4 py-2.5 bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm flex-1 truncate">{label}</span>
        {isBuiltin && (
          <span className="text-xs text-muted-foreground bg-secondary rounded px-1.5 py-0.5 flex-shrink-0">
            padrão
          </span>
        )}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setEditingKey(isEditing ? null : catKey)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {isEditing ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <Pencil className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => onDelete(catKey)}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {isEditing && (
        <EditInlineForm
          label={label}
          color={color}
          onSave={(l, c) => {
            onSaveEdit(catKey, l, c);
            setEditingKey(null);
          }}
          onCancel={() => setEditingKey(null)}
        />
      )}
    </div>
  );
}

function CategorySection({
  title,
  builtinCats,
  customCats,
  overrides,
  deleted,
  type,
  onRefresh,
}) {
  const [editingKey, setEditingKey] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const key = `custom_${type}_${newName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    saveCustomCategory(key, newName.trim(), newColor, type);
    setNewName("");
    setShowAddForm(false);
    onRefresh();
  };

  const handleSaveEdit = (key, label, color) => {
    const isBuiltin = !!builtinCats[key];
    if (isBuiltin) saveOverride(key, label, color, type);
    else saveCustomCategory(key, label, color, type);
    onRefresh();
  };

  const handleDelete = (key) => {
    const isBuiltin = !!builtinCats[key];
    if (isBuiltin) deleteBuiltinCategory(key, type);
    else deleteCustomCategory(key, type);
    onRefresh();
  };

  const visibleBuiltins = Object.entries(builtinCats).filter(
    ([k]) => !deleted[k],
  );
  const allCount = visibleBuiltins.length + Object.keys(customCats).length;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5 font-medium">
            {allCount}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            setShowAddForm((v) => !v);
          }}
        >
          <Plus className="w-3 h-3 mr-1" /> Nova categoria
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="p-4 border-b border-border bg-secondary/10 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Nova categoria
            </p>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewName("");
              }}
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                placeholder="Ex: Pet, Combustível..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="h-8 text-sm"
              />
            </div>
            <div
              className="w-8 h-8 rounded-lg border border-border flex-shrink-0"
              style={{ backgroundColor: newColor }}
            />
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
            <Plus className="w-3 h-3 mr-1" /> Adicionar
          </Button>
        </div>
      )}

      {/* Category rows */}
      <div className="divide-y divide-border">
        {visibleBuiltins.map(([key, val]) => {
          const eff = overrides[key] ? { ...val, ...overrides[key] } : val;
          return (
            <CategoryRow
              key={key}
              catKey={key}
              label={eff.label}
              color={eff.color}
              isBuiltin
              type={type}
              editingKey={editingKey}
              setEditingKey={setEditingKey}
              onSaveEdit={handleSaveEdit}
              onDelete={handleDelete}
            />
          );
        })}
        {Object.entries(customCats).map(([key, val]) => (
          <CategoryRow
            key={key}
            catKey={key}
            label={val.label}
            color={val.color}
            isBuiltin={false}
            type={type}
            editingKey={editingKey}
            setEditingKey={setEditingKey}
            onSaveEdit={handleSaveEdit}
            onDelete={handleDelete}
          />
        ))}
        {allCount === 0 && (
          <p className="text-xs text-muted-foreground px-5 py-4 italic">
            Nenhuma categoria. Adicione uma acima.
          </p>
        )}
      </div>
    </div>
  );
}

export default function CategoryManager() {
  const [version, setVersion] = useState(0);
  const refresh = () => {
    setVersion((v) => v + 1);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div key={version} className="space-y-5">
      <CategorySection
        title="Categorias de Despesa"
        builtinCats={BUILTIN_EXPENSE_CATEGORIES}
        customCats={getCustomCategories()}
        overrides={getOverrides("despesa")}
        deleted={getDeletedBuiltins("despesa")}
        type="despesa"
        onRefresh={refresh}
      />
      <CategorySection
        title="Categorias de Receita"
        builtinCats={BUILTIN_INCOME_CATEGORIES}
        customCats={getCustomIncomeCategories()}
        overrides={getOverrides("receita")}
        deleted={getDeletedBuiltins("receita")}
        type="receita"
        onRefresh={refresh}
      />
    </div>
  );
}
