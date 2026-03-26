export const CATEGORIES = {
  gastos_fixos: { label: "Gastos Fixos", color: "#3b82f6", icon: "Home" },
  gastos_variaveis: { label: "Gastos Variáveis", color: "#8b5cf6", icon: "ShoppingBag" },
  investimentos: { label: "Investimentos", color: "#10b981", icon: "TrendingUp" },
  lazer: { label: "Lazer", color: "#f59e0b", icon: "Gamepad2" },
  alimentacao: { label: "Alimentação", color: "#ef4444", icon: "UtensilsCrossed" },
  transporte: { label: "Transporte", color: "#06b6d4", icon: "Car" },
  saude: { label: "Saúde", color: "#ec4899", icon: "Heart" },
  educacao: { label: "Educação", color: "#6366f1", icon: "GraduationCap" },
  outros: { label: "Outros", color: "#64748b", icon: "MoreHorizontal" },
};

export const CATEGORY_COLORS = Object.fromEntries(
  Object.entries(CATEGORIES).map(([key, val]) => [key, val.color])
);

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getMonthLabel(date) {
  return new Date(date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}