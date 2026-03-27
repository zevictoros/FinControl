import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, CheckCircle2, AlertCircle } from "lucide-react";

export default function UserManagement() {
  const [form, setForm] = useState({ email: "", role: "user" });
  const [status, setStatus] = useState(null); // { type: "success"|"error", msg }
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Busca de usuários no seu novo Backend
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      // Faz o POST para a sua rota de convite no Express
      await api.post("/users/invite", {
        email: form.email,
        role: form.role,
      });

      setStatus({ type: "success", msg: `Convite enviado para ${form.email}` });
      setForm({ email: "", role: "user" });

      // Atualiza a lista de usuários na tela
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setStatus({
        type: "error",
        msg:
          err.response?.data?.error ||
          "Erro ao convidar usuário. Verifique o e-mail.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-base">Gerenciar Usuários</h3>
      </div>

      <form onSubmit={handleInvite} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>E-mail do novo usuário</Label>
            <Input
              type="email"
              placeholder="usuario@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Perfil</Label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {status && (
          <div
            className={`flex items-center gap-2 text-sm font-medium ${status.type === "success" ? "text-emerald-500" : "text-red-500"}`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {status.msg}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          <UserPlus className="w-4 h-4 mr-2" />
          {loading ? "Convidando..." : "Convidar Usuário"}
        </Button>
      </form>

      {users.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-sm font-medium text-muted-foreground">
            Usuários cadastrados
          </p>
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-foreground">{u.email}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {u.role === "admin" ? "Admin" : "Usuário"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
