import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || "";
      const role = localStorage.getItem("role") || "user";

      // Never auto-redirect on login/auth endpoints — let the component handle the error
      const isAuthEndpoint =
        url.includes("/api/auth/") ||
        url.includes("/api/admin/login") ||
        url.includes("/api/therapist/login");

      // Only auto-logout & redirect for expired user-role sessions on protected routes
      if (!isAuthEndpoint && role === "user") {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (url) => {
  if (!url) return "/default-avatar.png";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  return `${apiBase}${url}`;
};

export default api;
