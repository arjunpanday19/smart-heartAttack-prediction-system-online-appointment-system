import axios from "axios";

// Create an Axios instance
const api = axios.create({
    baseURL: "http://localhost:8000/api/v1",
    withCredentials: true, // send cookies (accessToken cookie) on every request
});

// ── Request interceptor: inject JWT from localStorage into Authorization header ──
// This is the RELIABLE path. Cookies can fail on localhost due to SameSite/Secure
// policies, but the Authorization header always works.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// ── Response interceptor: handle global 401 ───────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized — token may have expired.");
        }
        return Promise.reject(error);
    }
);

export default api;
