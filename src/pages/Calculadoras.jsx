import React, { useState } from "react";
import {
  Calculator,
  TrendingUp,
  Target,
  Clock,
  Bitcoin,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/categories";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CALCS = [
  {
    id: "juros",
    label: "Juros Compostos",
    icon: TrendingUp,
    description: "Simule o crescimento do seu investimento",
  },
  {
    id: "meta",
    label: "Tempo para Meta",
    icon: Clock,
    description: "Quanto tempo para atingir seu objetivo?",
  },
  {
    id: "aporte",
    label: "Aporte Necessário",
    icon: Target,
    description: "Quanto preciso aportar por mês?",
  },
  {
    id: "custo_medio",
    label: "Custo Médio Cripto",
    icon: Bitcoin,
    description: "Calcule o preço médio das suas compras",
  },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        }}
        className="rounded-xl px-3 py-2 shadow-lg text-xs"
      >
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function JurosCompostos() {
  const [f, setF] = useState({ inicial: "", aporte: "", taxa: "", meses: "" });
  const [result, setResult] = useState(null);

  const calcular = (e) => {
    e.preventDefault();
    const PV = parseFloat(f.inicial) || 0;
    const PMT = parseFloat(f.aporte) || 0;
    const i = parseFloat(f.taxa) / 100;
    const n = parseInt(f.meses);
    if (!n || i <= 0) return;

    const montante =
      PV * Math.pow(1 + i, n) + PMT * ((Math.pow(1 + i, n) - 1) / i);
    const totalInvestido = PV + PMT * n;
    const rendimento = montante - totalInvestido;

    const step = Math.max(1, Math.ceil(n / 24));
    const chartData = [];
    let acc = PV;
    for (let m = 1; m <= n; m++) {
      acc = acc * (1 + i) + PMT;
      if (m % step === 0 || m === n) {
        chartData.push({
          mes: `M${m}`,
          montante: Math.round(acc),
          investido: Math.round(PV + PMT * m),
          juros: Math.round(acc - (PV + PMT * m)),
        });
      }
    }
    setResult({ montante, totalInvestido, rendimento, chartData });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={calcular}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div className="space-y-2">
          <Label>Valor inicial (R$)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex: 1000"
            value={f.inicial}
            onChange={(e) => setF({ ...f, inicial: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Aporte mensal (R$)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex: 500"
            value={f.aporte}
            onChange={(e) => setF({ ...f, aporte: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Taxa de juros mensal (%)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Ex: 1"
            value={f.taxa}
            onChange={(e) => setF({ ...f, taxa: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Período (meses)</Label>
          <Input
            type="number"
            min="1"
            placeholder="Ex: 24"
            value={f.meses}
            onChange={(e) => setF({ ...f, meses: e.target.value })}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full sm:w-auto">
            Calcular
          </Button>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Montante Final
              </p>
              <p className="text-lg font-bold text-emerald-500">
                {formatCurrency(result.montante)}
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Total Investido
              </p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(result.totalInvestido)}
              </p>
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Rendimento</p>
              <p className="text-lg font-bold text-violet-500">
                {formatCurrency(result.rendimento)}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold mb-4">Evolução do Patrimônio</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="montante"
                    name="Montante"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="investido"
                    name="Investido"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                  <Line
                    type="monotone"
                    dataKey="juros"
                    name="Juros"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TempoParaMeta() {
  const [f, setF] = useState({ meta: "", aporte: "", taxa: "" });
  const [result, setResult] = useState(null);

  const calcular = (e) => {
    e.preventDefault();
    const FV = parseFloat(f.meta);
    const PMT = parseFloat(f.aporte);
    const i = parseFloat(f.taxa) / 100;
    if (!FV || !PMT || i <= 0) return;

    const n = Math.ceil(Math.log(1 + (FV * i) / PMT) / Math.log(1 + i));
    const meses = Math.max(1, n);
    const anos = Math.floor(meses / 12);
    const mesesRest = meses % 12;

    const step = Math.max(1, Math.ceil(meses / 24));
    const chartData = [];
    let acc = 0;
    for (let m = 1; m <= meses; m++) {
      acc = acc * (1 + i) + PMT;
      if (m % step === 0 || m === meses) {
        chartData.push({
          mes: `M${m}`,
          patrimonio: Math.round(acc),
          aportado: Math.round(PMT * m),
          juros: Math.round(acc - PMT * m),
        });
      }
    }

    const totalAportado = PMT * meses;
    const totalJuros = acc - totalAportado;
    setResult({
      meses,
      anos,
      mesesRest,
      chartData,
      totalAportado,
      totalJuros,
      montanteFinal: acc,
    });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={calcular}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="space-y-2">
          <Label>Meta desejada (R$)</Label>
          <Input
            type="number"
            min="1"
            step="0.01"
            placeholder="Ex: 100000"
            value={f.meta}
            onChange={(e) => setF({ ...f, meta: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Aporte mensal (R$)</Label>
          <Input
            type="number"
            min="1"
            step="0.01"
            placeholder="Ex: 500"
            value={f.aporte}
            onChange={(e) => setF({ ...f, aporte: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Taxa de juros mensal (%)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Ex: 1"
            value={f.taxa}
            onChange={(e) => setF({ ...f, taxa: e.target.value })}
            required
          />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" className="w-full sm:w-auto">
            Calcular
          </Button>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Tempo total</p>
              <p className="text-2xl font-bold text-emerald-500">
                {result.meses}
              </p>
              <p className="text-xs text-muted-foreground">
                meses ({result.anos}a {result.mesesRest}m)
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Montante Final
              </p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(result.montanteFinal)}
              </p>
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Total Aportado
              </p>
              <p className="text-lg font-bold text-violet-500">
                {formatCurrency(result.totalAportado)}
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Rendimento Juros
              </p>
              <p className="text-lg font-bold text-amber-500">
                {formatCurrency(result.totalJuros)}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold mb-4">Evolução até a Meta</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="patrimonio"
                    name="Patrimônio"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="aportado"
                    name="Aportado"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                  <Line
                    type="monotone"
                    dataKey="juros"
                    name="Juros Acum."
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AporteMensal() {
  const [f, setF] = useState({ meta: "", taxa: "", meses: "" });
  const [result, setResult] = useState(null);

  const calcular = (e) => {
    e.preventDefault();
    const FV = parseFloat(f.meta);
    const i = parseFloat(f.taxa) / 100;
    const n = parseInt(f.meses);
    if (!FV || i <= 0 || !n) return;

    const PMT = (FV * i) / (Math.pow(1 + i, n) - 1);
    const totalInvestido = PMT * n;
    const rendimento = FV - totalInvestido;
    setResult({ aporte: PMT, totalInvestido, rendimento });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={calcular}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="space-y-2">
          <Label>Meta desejada (R$)</Label>
          <Input
            type="number"
            min="1"
            step="0.01"
            placeholder="Ex: 50000"
            value={f.meta}
            onChange={(e) => setF({ ...f, meta: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Taxa de juros mensal (%)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Ex: 1"
            value={f.taxa}
            onChange={(e) => setF({ ...f, taxa: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Período (meses)</Label>
          <Input
            type="number"
            min="1"
            placeholder="Ex: 24"
            value={f.meses}
            onChange={(e) => setF({ ...f, meses: e.target.value })}
            required
          />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" className="w-full sm:w-auto">
            Calcular
          </Button>
        </div>
      </form>

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Aporte mensal necessário
            </p>
            <p className="text-2xl font-bold text-emerald-500">
              {formatCurrency(result.aporte)}
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Total que vai investir
            </p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(result.totalInvestido)}
            </p>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Rendimento dos juros
            </p>
            <p className="text-xl font-bold text-violet-500">
              {formatCurrency(result.rendimento)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CustoMedioCripto() {
  const [compras, setCompras] = useState([
    { valorInvestido: "", precoMoeda: "" },
  ]);

  const updateCompra = (i, field, value) => {
    const novo = [...compras];
    novo[i][field] = value;
    setCompras(novo);
  };

  const addCompra = () =>
    setCompras([...compras, { valorInvestido: "", precoMoeda: "" }]);
  const removeCompra = (i) => setCompras(compras.filter((_, idx) => idx !== i));

  const result = (() => {
    const validas = compras.filter(
      (c) => c.valorInvestido && c.precoMoeda && parseFloat(c.precoMoeda) > 0,
    );
    if (validas.length === 0) return null;
    const rows = validas.map((c) => ({
      valorInvestido: parseFloat(c.valorInvestido),
      precoMoeda: parseFloat(c.precoMoeda),
      qtd: parseFloat(c.valorInvestido) / parseFloat(c.precoMoeda),
    }));
    const totalGasto = rows.reduce((s, r) => s + r.valorInvestido, 0);
    const totalMoedas = rows.reduce((s, r) => s + r.qtd, 0);
    const custoMedio = totalGasto / totalMoedas;
    return { custoMedio, totalGasto, totalMoedas, rows };
  })();

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {compras.map((c, i) => {
          const qtd =
            c.valorInvestido && c.precoMoeda && parseFloat(c.precoMoeda) > 0
              ? parseFloat(c.valorInvestido) / parseFloat(c.precoMoeda)
              : null;
          return (
            <div
              key={i}
              className="p-3 rounded-xl border border-border bg-muted/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Compra #{i + 1}
                </span>
                {compras.length > 1 && (
                  <button
                    onClick={() => removeCompra(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Valor investido (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Ex: 4500"
                    value={c.valorInvestido}
                    onChange={(e) =>
                      updateCompra(i, "valorInvestido", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Preço da moeda na época (R$)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Ex: 150000"
                    value={c.precoMoeda}
                    onChange={(e) =>
                      updateCompra(i, "precoMoeda", e.target.value)
                    }
                  />
                </div>
              </div>
              {qtd !== null && (
                <div className="text-xs text-muted-foreground">
                  Quantidade recebida:{" "}
                  <span className="font-semibold text-emerald-500">
                    {qtd.toFixed(8).replace(/\.?0+$/, "")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addCompra}
        className="w-full"
      >
        + Adicionar outra compra
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Custo Médio por Unidade
              </p>
              <p className="text-xl font-bold text-emerald-500">
                {formatCurrency(result.custoMedio)}
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Total Investido
              </p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(result.totalGasto)}
              </p>
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Total de Moedas
              </p>
              <p className="text-xl font-bold text-violet-500">
                {result.totalMoedas.toFixed(8).replace(/\.?0+$/, "")}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[320px]">
              <thead>
                <tr className="bg-muted/50 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2">Compra</th>
                  <th className="text-right px-4 py-2">Investido</th>
                  <th className="text-right px-4 py-2">Preço</th>
                  <th className="text-right px-4 py-2">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2 text-muted-foreground">
                      #{i + 1}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(r.valorInvestido)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(r.precoMoeda)}
                    </td>
                    <td className="px-4 py-2 text-right text-emerald-500 font-semibold">
                      {r.qtd.toFixed(8).replace(/\.?0+$/, "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const CALC_COMPONENTS = {
  juros: JurosCompostos,
  meta: TempoParaMeta,
  aporte: AporteMensal,
  custo_medio: CustoMedioCripto,
};

export default function Calculadoras() {
  const [active, setActive] = useState(null);

  if (active) {
    const ActiveCalc = CALC_COMPONENTS[active];
    const calcInfo = CALCS.find((c) => c.id === active);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActive(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Calculadoras
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{calcInfo.label}</span>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <calcInfo.icon className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">{calcInfo.label}</h2>
          </div>
          <ActiveCalc />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Calculadoras Financeiras
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Escolha uma calculadora para começar
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CALCS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className="p-6 rounded-2xl border border-border bg-card hover:bg-secondary hover:border-primary/30 text-left transition-all duration-200 group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <c.icon className="w-6 h-6 text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground">{c.label}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {c.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
