import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: "Usuário",
    email: "admin@fincontrol.com",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Forçamos como true
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({
    name: "FinControl",
  });

  useEffect(() => {
    // Não precisamos mais buscar nada no servidor por enquanto
    checkAppState();
  }, []);

  const checkAppState = async () => {
    // Apenas garante que os estados de carregamento sumam
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Por enquanto, apenas um reset visual
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("fin_access_token");
    window.location.href = "/";
  };

  const navigateToLogin = () => {
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
