import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach the login token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("spendwise_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;