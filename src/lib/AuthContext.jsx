import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Definimos um usuário padrão para que o sistema nunca quebre
  const [user, setUser] = useState({
    id: "admin-01",
    full_name: "Administrador FinControl",
    email: "admin@fincontrol.com",
    role: "admin",
  });

  // Como o login foi removido, o estado é sempre autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Mock de configurações públicas (caso algum componente ainda peça)
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: "fincontrol",
    name: "FinControl",
    public_settings: {},
  });

  const checkAppState = async () => {
    // Apenas silenciamos a função, pois não há mais o que validar no servidor
    setIsLoadingAuth(false);
  };

  const checkUserAuth = async () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    // No modo "sem login", o logout apenas recarrega a página ou limpa caches locais
    console.log("Logout chamado no modo local.");
    window.location.href = "/";
  };

  const navigateToLogin = () => {
    // Redireciona para o início, já que não há tela de login
    window.location.href = "/";
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
