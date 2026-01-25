import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  withCredentials: false,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data?.companyId) {
      delete config.data.companyId;
    }

    if (config.params?.companyId) {
      delete config.params.companyId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      console.warn("Sesión expirada o inválida. Cerrando sesión.");

      sessionStorage.clear();

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (status === 403) {
      console.warn("Acceso denegado (403)");

      if (!window.location.pathname.includes("/403")) {
        window.location.href = "/403";
      }
    }

    if (status >= 500) {
      console.error("Error del servidor:", error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default apiClient;