import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Sun,
  Moon,
  BarChart2,
  Bitcoin,
  Settings,
  Calculator,
  Target,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/ThemeContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/transacoes", label: "Transações", icon: Receipt },
  { path: "/relatorios", label: "Relatórios", icon: BarChart2 },
  { path: "/metas-categorias", label: "Metas por Categoria", icon: Target }, // Nova opção
  { path: "/calculadoras", label: "Calculadoras", icon: Calculator }, // Nova opção
  { path: "/cripto", label: "Criptomoedas", icon: Bitcoin },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function AppLayout() {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 shadow-xl lg:shadow-none lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">
              FC
            </span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            FinControl
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Banner de Ajuda/Insights no Rodapé da Sidebar (Opcional) */}
        <div className="px-4 py-4 m-3 rounded-xl bg-secondary/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold">Dica do dia</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Confira suas metas por categoria para manter o orçamento em dia!
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border h-16 flex items-center px-4 gap-3 lg:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground lg:hidden flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile logo center */}
          <div className="flex-1 flex items-center justify-center lg:justify-start">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs text-[10px]">
                  FC
                </span>
              </div>
              <span className="font-bold text-foreground text-sm">
                FinControl
              </span>
            </div>
          </div>

          {/* Theme toggle & Notifications */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
