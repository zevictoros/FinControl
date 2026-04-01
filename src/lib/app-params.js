const isNode = typeof window === "undefined";
const storage = !isNode ? window.localStorage : null;

// Helper para formatar nomes de chaves no storage
const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
};

/**
 * Obtém um valor:
 * 1º da URL (e opcionalmente remove)
 * 2º do LocalStorage
 * 3º de um valor padrão (Env Variable)
 */
const getAppParamValue = (
  paramName,
  { defaultValue = undefined, removeFromUrl = false } = {},
) => {
  if (isNode) return defaultValue;

  const storageKey = `fin_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl && searchParam) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    storage?.setItem(storageKey, searchParam);
    return searchParam;
  }

  const storedValue = storage?.getItem(storageKey);
  if (storedValue) return storedValue;

  if (defaultValue) {
    storage?.setItem(storageKey, defaultValue);
    return defaultValue;
  }

  return null;
};

const getAppParams = () => {
  // Limpeza de token se solicitado na URL
  if (getAppParamValue("clear_session") === "true") {
    storage?.removeItem("fin_access_token");
    storage?.removeItem("token");
  }

  return {
    apiUrl: getAppParamValue("api_url", {
      defaultValue: import.meta.env.VITE_API_URL,
    }),
    appId: getAppParamValue("app_id", {
      defaultValue: import.meta.env.VITE_APP_ID,
    }),
    token: getAppParamValue("access_token", { removeFromUrl: true }),
    fromUrl: !isNode ? window.location.href : "",
  };
};

export const appParams = getAppParams();
