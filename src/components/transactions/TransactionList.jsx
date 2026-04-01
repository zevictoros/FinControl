import { getAllCategories, formatCurrency } from "@/lib/categories";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function TransactionList({
  transactions = [],
  onEdit,
  onDelete,
}) {
  const CATEGORIES = getAllCategories();

  // Função interna para formatar a data sem erros de "Invalid Date" ou fuso horário
  const formatDateSafe = (dateString) => {
    if (!dateString) return "Data pendente";

    try {
      // Pega apenas a parte YYYY-MM-DD (ignora horários se houver)
      const pureDate = dateString.split("T")[0];
      const [year, month, day] = pureDate.split("-");

      // Se não tiver os 3 componentes, tenta o formato brasileiro (caso venha trocado)
      if (!year || !month || !day) return dateString;

      return `${day}/${month}/${year}`;
    } catch (err) {
      return "Data inválida";
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {transactions.map((t) => {
          const catColor = CATEGORIES[t.category]?.color || "#64748b";
          const catLabel = CATEGORIES[t.category]?.label || t.category;
          const isReceita = t.type === "receita";
          const isInvestimento = t.type === "investimento";

          const Icon = isReceita
            ? ArrowUpRight
            : isInvestimento
              ? TrendingUp
              : ArrowDownLeft;
          const amountColor = isReceita
            ? "text-emerald-500"
            : isInvestimento
              ? "text-violet-500"
              : "text-red-500";
          const amountPrefix = isReceita ? "+" : isInvestimento ? "↗" : "-";

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-card rounded-xl border border-border shadow-sm px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: catColor + "20" }}
              >
                <Icon className={`w-4 h-4 ${amountColor}`} />
              </div>

              {/* Description + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">
                    {t.description}
                  </p>
                  {t.installments_total > 1 && (
                    <span className="flex items-center gap-0.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                      <CreditCard className="w-3 h-3" />
                      {t.installment_number}/{t.installments_total}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: catColor + "18",
                      color: catColor,
                    }}
                  >
                    {catLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateSafe(t.date)}
                  </span>
                  {t.notes && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline max-w-[150px]">
                      • {t.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount + Actions */}
              <div className="flex-shrink-0 flex items-center gap-1">
                <span
                  className={`text-sm font-bold ${amountColor} whitespace-nowrap mr-1`}
                >
                  {amountPrefix}
                  {formatCurrency(Number(t.amount) || 0)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(t)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(t.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
