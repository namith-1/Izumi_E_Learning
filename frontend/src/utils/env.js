const trimTrailingSlash = (value) => value.replace(/\/$/, "");

export const BACKEND_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE ||
    "http://localhost:5000",
);

export const API_BASE_URL = `${BACKEND_BASE_URL}/api`;
export const API_DOCS_URL = `${BACKEND_BASE_URL}/api-docs`;
 