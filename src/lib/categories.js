// Categorias de DESPESA
export const EXPENSE_CATEGORIES = {
  gastos_fixos: { label: "Gastos Fixos", color: "#3b82f6" },
  gastos_variaveis: { label: "Gastos Variáveis", color: "#8b5cf6" },
  aluguel: { label: "Aluguel", color: "#0ea5e9" },
  alimentacao: { label: "Alimentação", color: "#ef4444" },
  mercado: { label: "Mercado", color: "#22c55e" },
  transporte: { label: "Transporte", color: "#06b6d4" },
  saude: { label: "Saúde", color: "#ec4899" },
  educacao: { label: "Educação", color: "#6366f1" },
  energia: { label: "Energia", color: "#eab308" },
  streaming: { label: "Streaming", color: "#a855f7" },
  lazer: { label: "Lazer", color: "#f59e0b" },
  outros_despesa: { label: "Outros", color: "#64748b" },
};

// Categorias de RECEITA
export const INCOME_CATEGORIES = {
  salario: { label: "Salário", color: "#10b981" },
  auxilio: { label: "Auxílio", color: "#34d399" },
  receitas_fixas: { label: "Receitas Fixas", color: "#059669" },
  receitas_variaveis: { label: "Receitas Variáveis", color: "#6ee7b7" },
  freelance: { label: "Freelance", color: "#14b8a6" },
  dividendos: { label: "Dividendos", color: "#0d9488" },
  aluguel_recebido: { label: "Aluguel Recebido", color: "#0891b2" },
  outros_receita: { label: "Outros", color: "#64748b" },
};

// Categoria de INVESTIMENTO (tipo próprio)
export const INVESTMENT_CATEGORY = {
  investimentos: { label: "Investimentos", color: "#7c3aed" },
};

// Mapa unificado para lookup por chave (usado em exibição)
export const CATEGORIES = {
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
  ...INVESTMENT_CATEGORY,
};

export const CATEGORY_COLORS = Object.fromEntries(
  Object.entries(CATEGORIES).map(([key, val]) => [key, val.color]),
);

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getMonthLabel(date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

// Retorna as categorias certas conforme o tipo
export function getCategoriesForType(type) {
  if (type === "receita") return INCOME_CATEGORIES;
  if (type === "investimento") return INVESTMENT_CATEGORY;
  return EXPENSE_CATEGORIES;
}
