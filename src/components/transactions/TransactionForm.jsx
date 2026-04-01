import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getCategoriesForType, formatCurrency } from "@/lib/categories";
import { X } from "lucide-react";
import { motion } from "framer-motion";

export default function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const isEditing = !!transaction;
  const defaultCategory = transaction?.category || "aluguel";
  const [form, setForm] = useState(
    transaction || {
      description: "",
      amount: "",
      category: defaultCategory,
      type: "despesa",
      date: (() => {
        const now = new Date();
        const bsb = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        return bsb.toISOString().split("T")[0];
      })(),
      notes: "",
    },
  );
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalAmount = parseFloat(form.amount);

    const category =
      form.type === "investimento" ? "investimentos" : form.category;
    const base = { ...form, amount: totalAmount, category };

    if (!isEditing && isInstallment && installments > 1) {
      const installmentAmount = parseFloat(
        (totalAmount / installments).toFixed(2),
      );
      const groupId = `inst_${Date.now()}`;
      const records = [];
      const [sy, sm, sd] = form.date.split("-").map(Number);

      for (let i = 0; i < installments; i++) {
        const d = new Date(sy, sm - 1 + i, sd);
        records.push({
          ...base,
          amount: installmentAmount,
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          description: `${form.description} (${i + 1}/${installments})`,
          installments_total: installments,
          installment_number: i + 1,
          installment_group_id: groupId,
        });
      }
      onSubmit(records);
    } else {
      onSubmit([base]);
    }
  };

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleTypeChange = (v) => {
    update("type", v);
    if (v === "investimento") update("category", "investimentos");
    else if (v === "receita") update("category", "salario");
    else update("category", "aluguel");
  };

  const totalAmount = parseFloat(form.amount);
  const installmentAmount =
    isInstallment && installments > 1 && !isNaN(totalAmount)
      ? totalAmount / installments
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold">
          {isEditing ? "Editar Transação" : "Nova Transação"}
        </h3>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Ex: Notebook, Aluguel..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Valor total (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              placeholder="0,00"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            {form.type === "investimento" ? (
              <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted/50 text-sm text-muted-foreground">
                Investimentos
              </div>
            ) : (
              <Select
                value={form.category}
                onValueChange={(v) => update("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(getCategoriesForType(form.type)).map(
                    ([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data{isInstallment ? " da 1ª parcela" : ""}</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              required
            />
          </div>
        </div>

        {/* Parcelamento — só para despesas novas */}
        {!isEditing && form.type === "despesa" && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Parcelado</p>
                <p className="text-xs text-muted-foreground">
                  O valor será dividido pelo número de parcelas
                </p>
              </div>
              <Switch
                checked={isInstallment}
                onCheckedChange={setIsInstallment}
              />
            </div>
            {isInstallment && (
              <div className="flex items-center gap-3 flex-wrap">
                <Label className="text-sm whitespace-nowrap">
                  Nº de parcelas
                </Label>
                <Input
                  type="number"
                  min="2"
                  max="60"
                  value={installments}
                  onChange={(e) =>
                    setInstallments(parseInt(e.target.value) || 2)
                  }
                  className="w-24"
                />
                {installmentAmount && (
                  <span className="text-sm text-muted-foreground">
                    = {formatCurrency(installmentAmount)}/mês
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Detalhes opcionais..."
            className="h-20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Salvando..."
              : isEditing
                ? "Salvar"
                : isInstallment
                  ? `Lançar ${installments}x`
                  : "Adicionar"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
