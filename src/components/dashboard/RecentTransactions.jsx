import { CATEGORIES, formatCurrency } from "@/lib/categories";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function RecentTransactions({ transactions }) {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Últimas Transações</h3>
        <Link to="/transacoes" className="text-sm text-primary hover:underline font-medium">
          Ver todas
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação ainda</p>
      ) : (
        <div className="space-y-3">
          {recent.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: (CATEGORIES[t.category]?.color || "#64748b") + "18" }}
              >
                {t.type === "receita" ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.description}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORIES[t.category]?.label} · {new Date(t.date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className={`text-sm font-semibold ${t.type === "receita" ? "text-emerald-500" : "text-red-500"}`}>
                {t.type === "receita" ? "+" : "-"}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}