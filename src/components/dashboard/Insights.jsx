import React, { useMemo } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  PiggyBank,
  Bitcoin,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, getExpenseCategories } from "@/lib/categories";

const GOALS_KEY = "fincontrol_category_goals";
const SETTINGS_KEY = "fincontrol_app_settings";

function loadGoals() {
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY) || "{}");
  } catch {
    return {};
  }
}
function loadAppSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getBrasiliaDate() {
  const now = new Date();
  const brasilia = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return {
    day: brasilia.getUTCDate(),
    totalDays: new Date(
      brasilia.getUTCFullYear(),
      brasilia.getUTCMonth() + 1,
      0,
    ).getDate(),
    month: brasilia.getUTCMonth(),
    year: brasilia.getUTCFullYear(),
  };
}

function pluralize(count, singular, plural) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export default function Insights({
  transactions,
  cryptoHoldings = [],
  cryptoPrices = {},
}) {
  const insights = useMemo(() => {
    const result = [];
    const goals = loadGoals();
    const appSettings = loadAppSettings();
    const cryptoAlertThreshold = parseFloat(appSettings.crypto_alert_pct ?? 5);

    const { day, totalDays, month, year } = getBrasiliaDate();
    const isLastWeek = day >= totalDays - 6;
    const isFirstWeek = day <= 7;
    const isLastDay = day === totalDays;
    const isFirstDay = day === 1;

    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date + "T12:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const receitas = monthTx
      .filter((t) => t.type === "receita")
      .reduce((s, t) => s + t.amount, 0);
    const despesas = monthTx
      .filter((t) => t.type === "despesa")
      .reduce((s, t) => s + t.amount, 0);
    const investimentos = monthTx
      .filter((t) => t.type === "investimento")
      .reduce((s, t) => s + t.amount, 0);
    const saldo = receitas - despesas - investimentos;

    // ── 0. Saldo negativo (prioridade máxima) ────────────────────────────────
    if (saldo < 0) {
      result.push({
        type: "danger",
        icon: AlertCircle,
        title: "Saldo negativo este mês!",
        message: `Seu saldo atual é de ${formatCurrency(saldo)}. Suas despesas (${formatCurrency(despesas)}) ultrapassaram suas receitas (${formatCurrency(receitas)}). Revise seus gastos com urgência.`,
        priority: 0,
      });
    }

    // ── 1. Metas por categoria ultrapassadas ─────────────────────────────────
    const expCats = getExpenseCategories();
    const spendByCategory = {};
    monthTx
      .filter((t) => t.type === "despesa")
      .forEach((t) => {
        spendByCategory[t.category] =
          (spendByCategory[t.category] || 0) + t.amount;
      });

    Object.entries(goals).forEach(([catKey, pct]) => {
      if (!pct || parseFloat(pct) <= 0) return;
      const goalAmt = (parseFloat(pct) / 100) * receitas;
      const actual = spendByCategory[catKey] || 0;
      if (actual > goalAmt && goalAmt > 0) {
        const catLabel = expCats[catKey]?.label || catKey;
        const excess = actual - goalAmt;
        result.push({
          type: "warning",
          icon: AlertTriangle,
          title: `Meta de "${catLabel}" ultrapassada`,
          message: `Você gastou ${formatCurrency(actual)}, mas a meta era ${formatCurrency(goalAmt)} (${pct}% da receita). Excesso de ${formatCurrency(excess)}.`,
          priority: 1,
        });
      }
    });

    // ── 1b. Metas por categoria próximas (≥ 80%) ─────────────────────────────
    Object.entries(goals).forEach(([catKey, pct]) => {
      if (!pct || parseFloat(pct) <= 0) return;
      const goalAmt = (parseFloat(pct) / 100) * receitas;
      const actual = spendByCategory[catKey] || 0;
      const ratio = goalAmt > 0 ? actual / goalAmt : 0;
      if (ratio >= 0.8 && ratio < 1) {
        const catLabel = expCats[catKey]?.label || catKey;
        result.push({
          type: "warning",
          icon: AlertTriangle,
          title: `Meta de "${catLabel}" quase no limite`,
          message: `Você já usou ${(ratio * 100).toFixed(0)}% da meta de ${catLabel} (${formatCurrency(actual)} de ${formatCurrency(goalAmt)}). Cuidado para não ultrapassar.`,
          priority: 1,
        });
      }
    });

    // ── 1c. Metas incompletas (< 100% preenchido) ────────────────────────────
    const totalGoalPct = Object.values(goals).reduce(
      (s, v) => s + (parseFloat(v) || 0),
      0,
    );
    if (totalGoalPct > 0 && totalGoalPct < 100) {
      const faltando = (100 - totalGoalPct).toFixed(1);
      result.push({
        type: "info",
        icon: Lightbulb,
        title: "Metas por categoria incompletas",
        message: `Você ainda possui ${faltando}% das metas por categoria sem preencher. Acesse o painel e organize seu planejamento financeiro.`,
        priority: 2,
      });
    }

    // ── 2. Saldo alto sem investimentos ──────────────────────────────────────
    if (saldo > 0 && investimentos === 0 && receitas > 0) {
      result.push({
        type: "suggestion",
        icon: PiggyBank,
        title: "Saldo disponível sem investimentos",
        message: `Você tem ${formatCurrency(saldo)} de saldo este mês e ainda não realizou investimentos. Que tal diversificar?`,
        priority: 3,
      });
    }

    // ── 3. Insights de investimento ──────────────────────────────────────────
    const investGoalPct = parseFloat(goals["investimentos"]) || 0;
    const investGoalAmt =
      investGoalPct > 0 ? (investGoalPct / 100) * receitas : 0;

    // Sem investimento na metade do mês, mas com meta definida
    if (
      day >= Math.floor(totalDays / 2) &&
      investimentos === 0 &&
      receitas > 0 &&
      investGoalPct > 0
    ) {
      result.push({
        type: "warning",
        icon: AlertTriangle,
        title: "Nenhum investimento ainda este mês",
        message: `Já passamos da metade do mês e você ainda não registrou nenhum investimento. Sua meta é de ${investGoalPct}% (${formatCurrency(investGoalAmt)}). Não esqueça!`,
        priority: 2,
      });
    }

    // Fim de mês: investimento abaixo da meta
    if (
      isLastWeek &&
      investGoalPct > 0 &&
      investimentos > 0 &&
      investimentos < investGoalAmt
    ) {
      result.push({
        type: "warning",
        icon: TrendingDown,
        title: "Investimento abaixo da meta no final do mês",
        message: `Você investiu ${formatCurrency(investimentos)}, mas sua meta era ${formatCurrency(investGoalAmt)} (${investGoalPct}% da receita). Ainda dá tempo de investir mais!`,
        priority: 2,
      });
    }

    // Fim de mês: investimento acima da meta — parabéns!
    if (
      isLastWeek &&
      investGoalPct > 0 &&
      investimentos >= investGoalAmt &&
      investimentos > 0
    ) {
      result.push({
        type: "positive",
        icon: TrendingUp,
        title: "Meta de investimento atingida! 🎉",
        message: `Parabéns! Você investiu ${formatCurrency(investimentos)}, superando sua meta de ${formatCurrency(investGoalAmt)} (${investGoalPct}%). Continue assim!`,
        priority: 2,
      });
    }

    // Investimento baixo sem meta definida
    if (
      receitas > 0 &&
      investimentos > 0 &&
      investGoalPct === 0 &&
      investimentos / receitas < 0.1
    ) {
      result.push({
        type: "suggestion",
        icon: TrendingUp,
        title: "Investimentos abaixo de 10% da receita",
        message: `Você investiu ${formatCurrency(investimentos)} (${((investimentos / receitas) * 100).toFixed(1)}% da receita). Especialistas recomendam ao menos 10%. Defina uma meta em Metas por Categoria!`,
        priority: 3,
      });
    }

    // ── 3b. Gastos elevados (> 80% da receita) ───────────────────────────────
    if (receitas > 0 && despesas / receitas > 0.8) {
      result.push({
        type: "warning",
        icon: AlertTriangle,
        title: "Gastos muito elevados",
        message: `Suas despesas representam ${((despesas / receitas) * 100).toFixed(0)}% da receita (${formatCurrency(despesas)} de ${formatCurrency(receitas)}). Tente manter abaixo de 80%.`,
        priority: 2,
      });
    }

    // ── 4. Cripto com variação significativa ─────────────────────────────────
    cryptoHoldings.forEach((h) => {
      const priceData = cryptoPrices[h.coin_id];
      if (!priceData) return;
      const change = priceData.brl_24h_change || 0;
      const priceBrl = priceData.brl || 0;
      if (Math.abs(change) < cryptoAlertThreshold) return;

      const positionBrl = h.quantity * priceBrl;
      const variationBrl = positionBrl * (Math.abs(change) / 100);
      const direction = change >= 0 ? "um aumento" : "uma queda";

      result.push({
        type: change >= 0 ? "positive" : "warning",
        icon: change >= 0 ? TrendingUp : TrendingDown,
        title: `${h.coin_name} variou ${change >= 0 ? "+" : ""}${change.toFixed(1)}% nas últimas 24h`,
        message: `Sua posição em ${h.coin_symbol} teve uma variação relevante. Isso representa ${direction} de ${formatCurrency(variationBrl)}. Fique atento ao mercado.`,
        priority: 4,
      });
    });

    // ── 5. Insights de período ────────────────────────────────────────────────
    if (isLastDay) {
      result.push({
        type: "info",
        icon: Lightbulb,
        title: "Último dia do mês — hora de revisar!",
        message:
          "Confira seus gastos, receitas e investimentos do mês antes de virar o calendário.",
        priority: 5,
      });
    }

    if (isFirstDay) {
      result.push({
        type: "info",
        icon: Lightbulb,
        title: "Início de novo mês — planeje seus gastos",
        message:
          "É um ótimo momento para definir ou revisar suas metas por categoria e prioridades financeiras.",
        priority: 5,
      });
    }

    if (isLastWeek && !isLastDay && despesas > 0) {
      const diasRestantes = totalDays - day;
      result.push({
        type: "info",
        icon: Lightbulb,
        title: `Últimos ${pluralize(diasRestantes, "dia", "dias")} do mês`,
        message: `Você já gastou ${formatCurrency(despesas)} este mês. Fique atento para não ultrapassar seu orçamento nos dias restantes.`,
        priority: 5,
      });
    }

    if (isFirstWeek && receitas === 0 && day > 3) {
      result.push({
        type: "info",
        icon: Lightbulb,
        title: "Nenhuma receita registrada ainda",
        message:
          "Você ainda não registrou nenhuma receita este mês. Não se esqueça de lançar seus recebimentos!",
        priority: 5,
      });
    }

    return result.sort((a, b) => a.priority - b.priority);
  }, [transactions, cryptoHoldings, cryptoPrices]);

  if (insights.length === 0) return null;

  const typeStyles = {
    danger: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
    warning:
      "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    suggestion: "bg-primary/10 border-primary/20 text-primary",
    positive:
      "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    info: "bg-secondary border-border text-muted-foreground",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">💡 Insights</h3>
      <div className="space-y-2">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <div
              key={i}
              className={`flex gap-3 p-4 rounded-xl border ${typeStyles[ins.type]}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{ins.title}</p>
                <p className="text-xs mt-0.5 opacity-80">{ins.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
