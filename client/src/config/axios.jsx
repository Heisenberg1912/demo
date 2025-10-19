import axios from "axios";

const isProd = import.meta.env.PROD;
const fallbackBase = isProd ? "/api" : "http://localhost:4000/api";
const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  fallbackBase;
const BASE_URL = rawBase.replace(/\/+$/, ""); // remove trailing slashes

const instance = axios.create({
  baseURL: BASE_URL || (isProd ? "/api" : undefined),
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

instance.interceptors.request.use(cfg => {
  const token = localStorage.getItem("auth_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default instance;
