import axios from "axios";
import { useEffect, useState } from "react";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api" });

// attach the JWT to every request
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

// expired / invalid token -> back to login
api.interceptors.response.use(
  (r) => r,
  (e) => {
    const onAuthPage = ["/login", "/signup"].includes(window.location.pathname);
    if (e.response?.status === 401 && !e.config.url.includes("/auth/") && !onAuthPage) {
      localStorage.clear();
      window.location = "/login";
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e) => e.response?.data?.error || e.message;

let metaCache = null;
/** cities, roles and skills for dropdowns (loaded once) */
export function useMeta() {
  const [meta, setMeta] = useState(metaCache || { cities: [], roles: [], skills: [] });
  useEffect(() => {
    if (!metaCache) api.get("/meta").then((r) => { metaCache = r.data; setMeta(r.data); }).catch(() => {});
  }, []);
  return meta;
}

export default api;
