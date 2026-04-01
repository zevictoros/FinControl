import React, { useState } from "react";
import { api } from "@/api/apiClient"; // Conexão com seu backend Neon
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Loader2 } from "lucide-react";
import CategoryManager from "@/components/settings/CategoryManager";
import UserManagement from "@/components/settings/UserManagement";
import { useAuth } from "@/lib/AuthContext";

export default function Settings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  // Busca as configurações unificadas do banco de dados
  const { data: settings, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const response = await api.get("/settings");
      return response.data; // Esperado: { carry_balance: bool, crypto_alert_pct: number }
    },
  });

  // Mutação única para atualizar qualquer campo de configuração
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

  const handleUpdate = (field, value) => {
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

        {/* Indicador de Status */}
        <div className="h-6 flex items-center">
          {saveMutation.isPending && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {saved && !saveMutation.isPending && (
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium animate-in fade-in slide-in-from-right-2 duration-300">
              <CheckCircle2 className="w-4 h-4" />
              Salvo!
            </div>
          )}
        </div>
      </div>

      {/* Seção de Preferências Gerais */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <h3 className="font-semibold text-base">Preferências</h3>

        {/* Toggle: Transportar Saldo */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium text-slate-800">
              Transportar saldo para o próximo mês
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Quando ativado, o saldo líquido do mês anterior será somado
              automaticamente ao dashboard do mês atual.
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-11 rounded-full" />
          ) : (
            <Switch
              checked={settings?.carry_balance || false}
              onCheckedChange={(v) => handleUpdate("carry_balance", v)}
              disabled={saveMutation.isPending}
            />
          )}
        </div>

        <div className="border-t border-border pt-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium text-slate-800">
              Alerta de variação de cripto
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Define o percentual de variação (24h) para disparar insights no
              dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Input
              type="number"
              min="1"
              max="100"
              value={settings?.crypto_alert_pct ?? 5}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) handleUpdate("crypto_alert_pct", val);
              }}
              className="w-20 text-right h-9"
              disabled={isLoading || saveMutation.isPending}
            />
            <span className="text-sm text-muted-foreground font-medium">%</span>
          </div>
        </div>
      </div>

      {/* Gerenciamento de Categorias */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="font-semibold text-base mb-5">
          Categorias Personalizadas
        </h3>
        <CategoryManager />
      </div>

      {/* Gerenciamento de Usuários (Somente Admin) */}
      {isAdmin && (
        <div className="pt-4 border-t border-border">
          <UserManagement />
        </div>
      )}
    </div>
  );
}
