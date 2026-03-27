import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";
import UserManagement from "@/components/settings/UserManagement";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function Settings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  // Busca as configurações do usuário no seu banco Neon
  const { data: settings, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const response = await api.get("/settings");
      return response.data; // Esperamos um objeto { carry_balance: boolean, ... }
    },
  });

  // Mutação para salvar/atualizar
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
    // Enviamos o campo alterado para o backend
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

        {/* Indicador de Salvamento */}
        <div className="h-6 flex items-center">
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

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <h3 className="font-semibold text-base">Preferências da Conta</h3>

        <div className="flex items-start justify-between gap-4 py-2">
          <div className="space-y-1">
            <p className="font-medium text-slate-800">
              Transportar saldo para o próximo mês
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Quando ativado, o saldo líquido (Receitas - Gastos) do mês
              anterior será somado automaticamente ao dashboard do mês atual.
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
      </div>

      {/* Gerenciamento de Usuários (Apenas para Admins no Neon) */}
      {isAdmin && (
        <div className="pt-4 border-t border-border">
          <UserManagement />
        </div>
      )}
    </div>
  );
}
