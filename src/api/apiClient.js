import axios from "axios";
import { appParams } from "@/lib/app-params";

// Criamos a instância do Axios
export const api = axios.create({
  // O serverUrl agora vem das suas configurações limpas
  baseURL: appParams.apiUrl || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
    "X-App-Id": appParams.appId,
  },
});

// Interceptor para injetar o Token automaticamente em cada requisição
api.interceptors.request.use(
  (config) => {
    // Buscamos o token que salvamos no login/appParams
    const token = appParams.token || localStorage.getItem("fin_access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para lidar com erros globais (ex: 401 não autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Sessão expirada. Redirecionando...");
      // Opcional: localStorage.removeItem("fin_access_token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
