const isNode = typeof window === "undefined";

// Mock de localStorage para evitar erros se rodar em ambiente Node/Server-side
const storage = !isNode
  ? window.localStorage
  : {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
    };

/**
 * getAppParams
 * Retorna as variáveis essenciais para o funcionamento do App no Render.
 */
const getAppParams = () => {
  if (isNode) {
    return {
      apiUrl: "",
      appId: "fincontrol-local",
      isDevelopment: false,
    };
  }

  // Captura a URL da API do arquivo .env (VITE_API_URL)
  // Se não houver no .env, usa o fallback para sua URL do Render
  const apiUrl =
    import.meta.env.VITE_API_URL || "https://sua-api-no-render.onrender.com";

  return {
    // A URL que o seu apiClient (axios) vai usar para falar com o backend no Render
    apiUrl: apiUrl,

    // Mantemos um ID simbólico caso algum componente ainda peça, mas sem vínculo com base44
    appId: "fincontrol-render",

    // Informação de ambiente
    isDevelopment: import.meta.env.DEV,

    // URL de origem para redirects simples se necessário
    fromUrl: window.location.href,

    // Prefixo padrão para o LocalStorage do sistema
    storagePrefix: "fin_",
  };
};

export const appParams = {
  ...getAppParams(),
};
