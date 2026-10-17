const STORAGE_TOKEN_KEY = "slime_sage_app_secret";
const STORAGE_API_URL_KEY = "slime_sage_api_url";

export const DEFAULT_API_URL =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? "/api"
    : "http://localhost:3000";

export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  },
  getApiUrl: (): string => {
    const stored = localStorage.getItem(STORAGE_API_URL_KEY);
    if (!stored) return DEFAULT_API_URL;
    if (
      stored === "http://localhost:3000" &&
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      return "/api";
    }
    return stored;
  },
  setApiUrl: (url: string): void => {
    localStorage.setItem(STORAGE_API_URL_KEY, url);
  },
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_API_URL_KEY);
  },
};

export const getStoredToken = (): string | null => authStorage.getToken();
export const getStoredApiUrl = (): string => authStorage.getApiUrl();
