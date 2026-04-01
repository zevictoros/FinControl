// Categorias padrão de DESPESA
export const BUILTIN_EXPENSE_CATEGORIES = {
  aluguel: { label: "Aluguel", color: "#0ea5e9" },
  alimentacao: { label: "Alimentação", color: "#ef4444" },
  mercado: { label: "Mercado", color: "#22c55e" },
  lazer: { label: "Lazer", color: "#f59e0b" },
  energia: { label: "Energia", color: "#eab308" },
  streaming: { label: "Streaming", color: "#a855f7" },
  transporte: { label: "Transporte", color: "#06b6d4" },
  saude: { label: "Saúde", color: "#e11d48" },
  educacao: { label: "Educação", color: "#8b5cf6" },
  outros: { label: "Outros", color: "#64748b" },
};

// Categorias padrão de RECEITA — apenas Salário e Outros
export const BUILTIN_INCOME_CATEGORIES = {
  salario: { label: "Salário", color: "#10b981" },
  outros_receita: { label: "Outros", color: "#64748b" },
};

// Retrocompat aliases
export const DEFAULT_EXPENSE_CATEGORIES = BUILTIN_EXPENSE_CATEGORIES;
export const DEFAULT_INCOME_CATEGORIES = BUILTIN_INCOME_CATEGORIES;
export const INCOME_CATEGORIES = BUILTIN_INCOME_CATEGORIES;
export const EXPENSE_CATEGORIES = BUILTIN_EXPENSE_CATEGORIES;

const OVERRIDES_EXPENSE_KEY = "fincontrol_overrides_expense_cats";
const OVERRIDES_INCOME_KEY = "fincontrol_overrides_income_cats";
const CUSTOM_EXPENSE_KEY = "fincontrol_custom_expense_cats";
const CUSTOM_INCOME_KEY = "fincontrol_custom_income_cats";
// Keys to track which builtins have been deleted
const DELETED_EXPENSE_KEY = "fincontrol_deleted_expense_cats";
const DELETED_INCOME_KEY = "fincontrol_deleted_income_cats";

function loadFromKey(key) {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : {};
  } catch {
    return {};
  }
}

// ── overrides (edição de categorias existentes) ──────────────────────────────
export function getOverrides(type = "despesa") {
  return loadFromKey(
    type === "receita" ? OVERRIDES_INCOME_KEY : OVERRIDES_EXPENSE_KEY,
  );
}

export function saveOverride(key, label, color, type = "despesa") {
  const storageKey =
    type === "receita" ? OVERRIDES_INCOME_KEY : OVERRIDES_EXPENSE_KEY;
  const current = loadFromKey(storageKey);
  current[key] = { label, color };
  localStorage.setItem(storageKey, JSON.stringify(current));
}

// ── deleted builtins ──────────────────────────────────────────────────────────
export function getDeletedBuiltins(type = "despesa") {
  return loadFromKey(
    type === "receita" ? DELETED_INCOME_KEY : DELETED_EXPENSE_KEY,
  );
}

export function deleteBuiltinCategory(key, type = "despesa") {
  const storageKey =
    type === "receita" ? DELETED_INCOME_KEY : DELETED_EXPENSE_KEY;
  const current = loadFromKey(storageKey);
  current[key] = true;
  localStorage.setItem(storageKey, JSON.stringify(current));
}

// ── custom (novas categorias) ─────────────────────────────────────────────────
export function getCustomCategories() {
  return loadFromKey(CUSTOM_EXPENSE_KEY);
}
export function getCustomIncomeCategories() {
  return loadFromKey(CUSTOM_INCOME_KEY);
}

export function saveCustomCategory(key, label, color, type = "despesa") {
  const storageKey =
    type === "receita" ? CUSTOM_INCOME_KEY : CUSTOM_EXPENSE_KEY;
  const current = loadFromKey(storageKey);
  current[key] = { label, color };
  localStorage.setItem(storageKey, JSON.stringify(current));
}

export function deleteCustomCategory(key, type = "despesa") {
  const storageKey =
    type === "receita" ? CUSTOM_INCOME_KEY : CUSTOM_EXPENSE_KEY;
  const current = loadFromKey(storageKey);
  delete current[key];
  localStorage.setItem(storageKey, JSON.stringify(current));
}

// ── merged getters ────────────────────────────────────────────────────────────
export function getExpenseCategories() {
  const overrides = getOverrides("despesa");
  const deleted = getDeletedBuiltins("despesa");
  const base = Object.fromEntries(
    Object.entries(BUILTIN_EXPENSE_CATEGORIES)
      .filter(([k]) => !deleted[k])
      .map(([k, v]) => [k, overrides[k] ? { ...v, ...overrides[k] } : v]),
  );
  return { ...base, ...loadFromKey(CUSTOM_EXPENSE_KEY) };
}

export function getIncomeCategories() {
  const overrides = getOverrides("receita");
  const deleted = getDeletedBuiltins("receita");
  const base = Object.fromEntries(
    Object.entries(BUILTIN_INCOME_CATEGORIES)
      .filter(([k]) => !deleted[k])
      .map(([k, v]) => [k, overrides[k] ? { ...v, ...overrides[k] } : v]),
  );
  return { ...base, ...loadFromKey(CUSTOM_INCOME_KEY) };
}

export function getAllCategories() {
  return {
    ...getExpenseCategories(),
    ...getIncomeCategories(),
    ...INVESTMENT_CATEGORY,
  };
}

// Categoria de INVESTIMENTO
export const INVESTMENT_CATEGORY = {
  investimentos: { label: "Investimentos", color: "#7c3aed" },
};

// Retrocompat estático
export const CATEGORIES = {
  ...BUILTIN_EXPENSE_CATEGORIES,
  ...BUILTIN_INCOME_CATEGORIES,
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

export function getCategoriesForType(type) {
  if (type === "receita") return getIncomeCategories();
  if (type === "investimento") return INVESTMENT_CATEGORY;
  return getExpenseCategories();
}
