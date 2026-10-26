import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || original._retry) return Promise.reject(error);

    if (error.response?.status === 401 && localStorage.getItem("refreshToken")) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE}/auth/refresh`, {
              refreshToken: localStorage.getItem("refreshToken"),
            })
            .then((res) => {
              localStorage.setItem("token", res.data.accessToken || res.data.token);
              if (res.data.refreshToken) {
                localStorage.setItem("refreshToken", res.data.refreshToken);
              }
              return res.data.accessToken || res.data.token;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  }
);

/** Resolve relative /uploads paths against the API server origin */
export function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("data:")) return pathOrUrl;
  if (pathOrUrl.startsWith("/")) return `${API_ORIGIN}${pathOrUrl}`;
  return `${API_ORIGIN}/${pathOrUrl}`;
}

export default api;
export { API_BASE, API_ORIGIN };
