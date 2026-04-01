import React from "react";
import { Users, ShieldCheck, User } from "lucide-react";

export default function UserManagement() {
  const currentUser = {
    name: "Administrador FinControl",
    role: "admin",
    status: "Ativo",
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Gerenciamento de Acesso</h3>
        </div>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold uppercase tracking-wider">
          Modo Local (Sem Login)
        </span>
      </div>

      <div className="p-4 rounded-xl bg-secondary/30 border border-border flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{currentUser.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-muted-foreground">
              Acesso Total Liberado
            </span>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
          <strong>Nota:</strong> O sistema está operando em modo de usuário
          único. As funcionalidades de convite e múltiplos perfis foram
          desativadas para simplificar o controle financeiro direto via
          Neon/Render.
        </p>
      </div>
    </div>
  );
}
