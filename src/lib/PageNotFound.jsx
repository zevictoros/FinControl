import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Home, AlertTriangle } from "lucide-react";

export default function PageNotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageName = location.pathname.substring(1);

  // Usando o seu AuthContext simplificado que criamos anteriormente
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          {/* 404 Error Code */}
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-slate-300">404</h1>
            <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
          </div>

          {/* Main Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-slate-800">
              Página não encontrada
            </h2>
            <p className="text-slate-600 leading-relaxed">
              A página{" "}
              <span className="font-medium text-slate-700">"{pageName}"</span>{" "}
              não foi encontrada nesta aplicação.
            </p>
          </div>

          {/* Admin Note - Como o AuthContext agora é estático, isso sempre aparecerá se o role for admin */}
          {isAuthenticated && user?.role === "admin" && (
            <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-100 text-left">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-800">
                    Nota do Administrador
                  </p>
                  <p className="text-sm text-orange-700 leading-relaxed">
                    Esta rota pode não ter sido implementada ainda no seu
                    roteador principal ou o componente foi movido. Verifique o
                    arquivo de rotas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-6">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 shadow-sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar para o Início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
