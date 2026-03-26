import { TrendingDown, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/categories";
import { motion } from "framer-motion";

const cards = [
  {
    key: "receitas",
    label: "Receitas",
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    key: "despesas",
    label: "Despesas",
    icon: TrendingDown,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    key: "investimentos",
    label: "Investimentos",
    icon: PiggyBank,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    key: "saldo",
    label: "Saldo",
    icon: Wallet,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
];

export default function StatsCards({ data }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {card.label}
            </span>
            <div
              className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}
            >
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p
            className={`text-xl sm:text-2xl font-bold ${card.key === "saldo" && data[card.key] < 0 ? "text-red-500" : "text-foreground"}`}
          >
            {formatCurrency(data[card.key] || 0)}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
