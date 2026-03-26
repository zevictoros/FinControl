import { CATEGORIES, formatCurrency } from "@/lib/categories";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div className="col-span-4">Descrição</div>
        <div className="col-span-2">Categoria</div>
        <div className="col-span-2">Data</div>
        <div className="col-span-2 text-right">Valor</div>
        <div className="col-span-2 text-right">Ações</div>
      </div>
      <AnimatePresence>
        {transactions.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors items-center"
          >
            <div className="col-span-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: (CATEGORIES[t.category]?.color || "#64748b") + "18" }}
              >
                {t.type === "receita" ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.description}</p>
                {t.notes && <p className="text-xs text-muted-foreground truncate">{t.notes}</p>}
              </div>
            </div>
            <div className="col-span-2 hidden sm:block">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: (CATEGORIES[t.category]?.color || "#64748b") + "18",
                  color: CATEGORIES[t.category]?.color || "#64748b",
                }}
              >
                {CATEGORIES[t.category]?.label || t.category}
              </span>
            </div>
            <div className="col-span-2 hidden sm:block text-sm text-muted-foreground">
              {new Date(t.date).toLocaleDateString("pt-BR")}
            </div>
            <div className="col-span-2 text-right">
              <span className={`text-sm font-semibold ${t.type === "receita" ? "text-emerald-500" : "text-red-500"}`}>
                {t.type === "receita" ? "+" : "-"}{formatCurrency(t.amount)}
              </span>
            </div>
            <div className="col-span-2 flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(t)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(t.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}