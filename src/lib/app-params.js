const isNode = typeof window === 'undefined';

// 🔹 Apenas leitura simples de env
const getAppParams = () => {
  if (isNode) {
    return {
      apiUrl: "",
    };
  }

  return {
    apiUrl: import.meta.env.VITE_API_URL,
  };
};

export const appParams = {
  ...getAppParams(),
};