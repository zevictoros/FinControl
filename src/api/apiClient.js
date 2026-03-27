import axios from "axios";
import { appParams } from "@/lib/app-params";

// Criamos a instância do Axios conectada ao SEU servidor no Render
export const api = axios.create({
  // Pega a URL que você configurou na Vercel (ex: https://fincontrol-victor.onrender.com)
  baseURL: appParams.apiUrl || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor simples (caso você adicione senha no futuro)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fin_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      console.error(
        "Rota não encontrada no servidor. Verifique os caminhos da API.",
      );
    }
    return Promise.reject(error);
  },
);
