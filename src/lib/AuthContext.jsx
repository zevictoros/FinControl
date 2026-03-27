import React, { createContext, useState, useContext, useEffect } from "react";
import { api } from "@/api/apiClient"; // Importa o axios que configuramos

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Verificamos se existe um token salvo localmente
      const token = localStorage.getItem("fin_access_token");

      if (!token) {
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      // Chamada para o SEU servidor (Render) para validar o token/pegar usuário
      // Se você ainda não criou a rota /me, ele cairá no catch, o que é seguro.
      const response = await api.get("/auth/me");

      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Falha na autenticação:", error);

      // Se der erro 401 ou 403, o token é inválido
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout(false); // Limpa os dados sem redirecionar em loop
      }

      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    // 1. Limpa o estado
    setUser(null);
    setIsAuthenticated(false);

    // 2. Remove o token do navegador
    localStorage.removeItem("fin_access_token");

    // 3. Redireciona para o login se necessário
    if (shouldRedirect) {
      window.location.href = "/login";
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
        authError,
        logout,
        navigateToLogin,
        checkUserAuth,
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
