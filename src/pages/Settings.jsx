import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Loader2 } from "lucide-react"; // Adicionado Loader2 conforme seu anterior
import CategoryManager from "@/components/settings/CategoryManager";
import { useAuth } from "@/lib/AuthContext"; // Reintegrado do seu anterior

// Lógica de LocalStorage para o alerta de cripto mantida conforme seu atual
const APP_SETTINGS_KEY = "fincontrol_app_settings";
function loadAppSettings() {
  try {
    return JSON.parse(localStorage.getItem(APP_SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveAppSettings(data) {
  localStorage.setItem(
    APP_SETTINGS_KEY,
    JSON.stringify({ ...loadAppSettings(), ...data }),
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Recuperando usuário para verificar admin
  const [saved, setSaved] = useState(false);
  const [cryptoAlertPct, setCryptoAlertPct] = useState(
    () => loadAppSettings().crypto_alert_pct ?? 5,
  );

  // 1. Busca configurações (Neon/Render)
  const { data: settings, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const response = await api.get("/settings");
      // Note: No seu backend Neon, settings costuma vir como objeto direto, não lista
      return response.data;
    },
  });

  // 2. Mutação unificada conforme seu código anterior (Neon usa POST para salvar/atualizar)
  const saveMutation = useMutation({
    mutationFn: (data) => api.post("/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      flashSaved();
    },
  });

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggle = (field, value) => {
    saveMutation.mutate({ [field]: value });
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personalize o comportamento do seu FinControl
          </p>
        </div>

        <div className="h-6 flex items-center gap-3">
          {saveMutation.isPending && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {saved && !saveMutation.isPending && (
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium animate-in fade-in duration-300">
              <CheckCircle2 className="w-4 h-4" />
              Salvo!
            </div>
          )}
        </div>
      </div>

      {/* Preferências gerais */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <h3 className="font-semibold text-base">Preferências</h3>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">Transportar saldo para o próximo mês</p>
            <p className="text-sm text-muted-foreground mt-1">
              Quando ativado, o saldo líquido do mês anterior será somado às
              receitas do mês seguinte no dashboard.
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-11 rounded-full" />
          ) : (
            <Switch
              checked={settings?.carry_balance || false}
              onCheckedChange={(v) => handleToggle("carry_balance", v)}
              disabled={saveMutation.isPending}
            />
          )}
        </div>

        <div className="border-t border-border pt-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">Alerta de variação de cripto</p>
            <p className="text-sm text-muted-foreground mt-1">
              Gera um insight no dashboard quando uma criptomoeda variar mais
              que esse percentual em 24h.
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Input
              type="number"
              min="1"
              max="100"
              step="1"
              value={cryptoAlertPct}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 5;
                setCryptoAlertPct(v);
                saveAppSettings({ crypto_alert_pct: v });
              }}
              className="w-20 text-right"
            />
            <span className="text-sm text-muted-foreground font-medium">%</span>
          </div>
        </div>
      </div>

      {/* Gerenciamento de categorias (Mantido conforme seu código atual) */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="font-semibold text-base mb-5">Categorias</h3>
        <CategoryManager />
      </div>
    </div>
  );
}
