/**
 * CampusWash API Configuration & High-Availability Failover Engine
 *
 * Implements seamless multi-backend failover for Render web services:
 * If the primary Render instance is suspended (HTTP 502/503/504), sleeping,
 * or down due to network errors, requests automatically retry against the
 * fallback/secondary Render backend without interrupting user activity.
 */

/**
 * Normalizes a base URL to ensure proper format ending in /api/v1
 * @param {string} url
 * @returns {string}
 */
export function normalizeBaseUrl(url) {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim().replace(/\/+$/, "");
  if (trimmed.startsWith("http") && !trimmed.endsWith("/api/v1")) {
    if (trimmed.endsWith("/api")) {
      trimmed += "/v1";
    } else {
      trimmed += "/api/v1";
    }
  }
  return trimmed;
}

/**
 * Extracts all configured backend URLs from environment variables
 * Supports:
 * - VITE_API_BASE_URL (primary, or comma-separated list of URLs)
 * - VITE_FALLBACK_API_BASE_URL / VITE_BACKUP_API_BASE_URL (secondary Render service)
 * @returns {string[]}
 */
export function getConfiguredBackendUrls() {
  const urls = [];

  const rawPrimary = import.meta.env.VITE_API_BASE_URL;
  const rawFallback =
    import.meta.env.VITE_FALLBACK_API_BASE_URL ||
    import.meta.env.VITE_BACKUP_API_BASE_URL;

  // Add primary URLs (handles comma-separated format if provided)
  if (rawPrimary) {
    const primaryList = rawPrimary.split(",").map((s) => s.trim()).filter(Boolean);
    for (const u of primaryList) {
      const norm = normalizeBaseUrl(u);
      if (norm && !urls.includes(norm)) urls.push(norm);
    }
  }

  // Add fallback URLs
  if (rawFallback) {
    const fallbackList = rawFallback.split(",").map((s) => s.trim()).filter(Boolean);
    for (const u of fallbackList) {
      const norm = normalizeBaseUrl(u);
      if (norm && !urls.includes(norm)) urls.push(norm);
    }
  }

  // Fallback defaults for local or unconfigured environments
  if (urls.length === 0) {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      urls.push("http://localhost:8000/api/v1");
    } else {
      urls.push("/api/v1");
    }
  }

  return urls;
}

const BACKEND_URLS = getConfiguredBackendUrls();
const ACTIVE_STORAGE_KEY = "campuswash_active_backend_url";

function getInitialActiveUrl() {
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem(ACTIVE_STORAGE_KEY);
      if (saved && BACKEND_URLS.includes(saved)) {
        return saved;
      }
    } catch {
      // sessionStorage restricted / unavailable
    }
  }
  return BACKEND_URLS[0];
}

let activeBaseUrl = getInitialActiveUrl();

/**
 * Returns the currently active healthy backend URL
 * @returns {string}
 */
export function getBaseUrl() {
  return activeBaseUrl;
}

/**
 * Updates the active backend URL and stores it in session cache
 * @param {string} newUrl
 */
export function setActiveBaseUrl(newUrl) {
  if (newUrl && BACKEND_URLS.includes(newUrl)) {
    activeBaseUrl = newUrl;
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(ACTIVE_STORAGE_KEY, newUrl);
      }
    } catch {
      // ignore storage errors
    }
  }
}

/**
 * Resets active backend back to the primary URL
 */
export function resetActiveBackend() {
  setActiveBaseUrl(BACKEND_URLS[0]);
}

/**
 * Returns the status list of all configured backend endpoints
 */
export function getBackendEndpoints() {
  return BACKEND_URLS.map((url, index) => ({
    url,
    isActive: url === activeBaseUrl,
    isPrimary: index === 0,
    isFallback: index > 0,
  }));
}

/**
 * Resolves static or uploaded image URLs against the currently active backend
 * @param {string} path
 * @returns {string|null}
 */
export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const clean = path.replace(/^\/+/, "");
  return `${getBaseUrl()}/static/${clean}`;
}

// Check if an HTTP status or response indicates Render service failure/suspension
function isRenderServiceFailure(status, responseText = "") {
  // 502 Bad Gateway: Render container down or unresponsive
  // 503 Service Unavailable: Render service suspended or spun down
  // 504 Gateway Timeout: Render proxy timed out
  // 520-526: Cloudflare / Edge proxy errors
  if (status === 502 || status === 503 || status === 504 || (status >= 520 && status <= 526)) {
    return true;
  }
  // Detect Render HTML suspension message if returned with 500 error
  if (
    status >= 500 &&
    typeof responseText === "string" &&
    (responseText.includes("Web Service Suspended") ||
      responseText.includes("Render | Web Service Suspended") ||
      responseText.includes("Service Suspended"))
  ) {
    return true;
  }
  return false;
}

/**
 * Normalizes an endpoint path to prevent duplicate /api/v1 prefixes
 * @param {string} endpoint
 * @returns {string}
 */
function normalizeEndpoint(endpoint) {
  if (!endpoint) return "";
  let clean = endpoint.trim();

  // If a full URL was passed containing any of our known base URLs, extract relative path
  for (const base of BACKEND_URLS) {
    if (clean.startsWith(base)) {
      clean = clean.slice(base.length);
      break;
    }
  }

  // Also strip any leading /api/v1 if present in relative path
  if (clean.startsWith("/api/v1")) {
    clean = clean.slice(7);
  }

  if (!clean.startsWith("/")) {
    clean = "/" + clean;
  }
  return clean;
}

/**
 * Smart fetch wrapper with automatic failover between primary and secondary Render backends.
 *
 * @param {string} endpoint - API path (e.g. "/borrow/listings" or full URL)
 * @param {RequestInit} [options={}] - Standard fetch options
 * @param {number} [timeoutMs=30000] - Timeout per attempt in milliseconds
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}, timeoutMs = 30000) {
  const relativePath = normalizeEndpoint(endpoint);

  // Determine order of backends to try: start with currently active, then try all others
  const orderedUrls = [
    activeBaseUrl,
    ...BACKEND_URLS.filter((u) => u !== activeBaseUrl),
  ];

  let lastError = null;

  for (let i = 0; i < orderedUrls.length; i++) {
    const targetBase = orderedUrls[i];
    const fullUrl = `${targetBase}${relativePath}`;
    const isFallbackAttempt = i > 0;

    if (isFallbackAttempt) {
      console.warn(
        `[CampusWash Failover] Switching request from ${orderedUrls[0]} to fallback backend ${targetBase}: ${relativePath}`
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Merge abort signal with existing caller signal if provided
    let combinedSignal = controller.signal;
    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      // Check if Render returned a service suspension or gateway crash error
      if (isRenderServiceFailure(response.status)) {
        console.warn(
          `[CampusWash Failover] Backend at ${targetBase} returned status ${response.status}. Attempting next available backend...`
        );
        lastError = new Error(`Backend at ${targetBase} returned HTTP ${response.status}`);
        continue; // Try next backend URL
      }

      // If this was a fallback attempt and it succeeded (status < 500), promote it to activeBaseUrl!
      if (isFallbackAttempt) {
        console.info(
          `[CampusWash Failover] Fallback backend ${targetBase} successfully handled the request. Setting as primary active backend.`
        );
        setActiveBaseUrl(targetBase);
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      const isNetworkOrAbort =
        err.name === "AbortError" ||
        err.name === "TypeError" ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError");

      console.warn(
        `[CampusWash Failover] Request to ${targetBase}${relativePath} failed (${err.message || err.name}). Checking fallback backends...`
      );

      lastError = err;

      // Continue to next backend if available
      continue;
    }
  }

  // If all backends failed, throw the last encountered error
  throw lastError || new Error("All configured backend instances are currently unreachable.");
}

// Export BASE_URL for backward compatibility
export const BASE_URL = activeBaseUrl;
