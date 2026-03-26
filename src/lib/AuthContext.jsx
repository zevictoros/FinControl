import React, { createContext, useState, useContext, useEffect } from "react";
import { api } from "@/api/apiClient";
import { appParams } from "@/lib/app-params";
import axios from "axios"; // Usamos axios puro ou seu helper para evitar o SDK antigo

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // Criamos um cliente axios padrão para chamadas públicas
      const response = await axios.get(
        `${appParams.apiUrl}/public-settings/by-id/${appParams.appId}`,
        {
          headers: {
            "X-App-Id": appParams.appId,
            Authorization: appParams.token
              ? `Bearer ${appParams.token}`
              : undefined,
          },
        },
      );

      setAppPublicSettings(response.data);

      if (appParams.token) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
      }
      setIsLoadingPublicSettings(false);
    } catch (appError) {
      console.error("Erro ao verificar estado do app:", appError);

      const status = appError.response?.status;
      const reason = appError.response?.data?.extra_data?.reason;

      if (status === 403 && reason) {
        setAuthError({
          type: reason,
          message:
            reason === "auth_required"
              ? "Autenticação necessária"
              : "Usuário não registrado",
        });
      } else {
        setAuthError({
          type: "unknown",
          message: appError.message || "Falha ao carregar configurações",
        });
      }
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      // Chamada genérica para pegar os dados do usuário logado
      const response = await api.get("/auth/me");
      setUser(response.data);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error("Falha na autenticação:", error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError({
          type: "auth_required",
          message: "Sessão expirada ou necessária",
        });
      }
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    // Limpeza de tokens localmente (supondo que seu apiClient trate isso ou use localStorage)
    localStorage.removeItem("fin_access_token");

    if (shouldRedirect) {
      window.location.href = "/login"; // Ou sua rota de login
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
