let apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  apiBaseUrl = (typeof window !== "undefined" && window.location.hostname === "localhost")
    ? "http://localhost:8000/api/v1"
    : "/api/v1";
} else {
  // If the user passed the base domain, e.g. "https://campuswash.onrender.com"
  // make sure it ends with /api/v1.
  if (apiBaseUrl.startsWith("http") && !apiBaseUrl.includes("/api/v1")) {
    apiBaseUrl = apiBaseUrl.replace(/\/$/, "") + "/api/v1";
  }
}

export const BASE_URL = apiBaseUrl;
