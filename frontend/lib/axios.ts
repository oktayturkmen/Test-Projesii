import axios, { AxiosError } from "axios";
import { resolveSafeRedirect } from "@/lib/safe-redirect";
import { useAuthStore } from "@/store/auth.store";

const CSRF_COOKIE_NAME = "csrf_token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export const apiClient = axios.create({
  // Frontend never talks to Laravel directly; all calls go through Next.js API routes.
  baseURL: "/api",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() ?? "GET";

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);

    if (csrfToken) {
      config.headers.set("X-CSRF-Token", csrfToken);
    }
  }

  return config;
});

/**
 * Marker we attach to AxiosError instances when the response interceptor has
 * already kicked off a redirect to /login. Call sites can then call
 * `isAuthRedirected(error)` in their catch blocks and skip the toast/error
 * UI — the page navigation IS the user-facing feedback. Otherwise the user
 * sees a red toast for ~200ms before the route swaps under them, which feels
 * like a flash of error noise.
 */
const AUTH_REDIRECTED_FLAG = "__authRedirected" as const;

type AuthRedirectedError = { [AUTH_REDIRECTED_FLAG]?: true };

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !window.location.pathname.startsWith("/login")
    ) {
      // Tag the error so call sites can suppress duplicate toast notices.
      (error as AxiosError & AuthRedirectedError)[AUTH_REDIRECTED_FLAG] = true;

      // Differentiate "your session timed out" vs "you were never logged in":
      // showing "Oturum süreniz doldu" to a guest user is misleading.
      const wasAuthenticated = useAuthStore.getState().isAuthenticated;
      const reason = wasAuthenticated ? "session_expired" : "auth_required";

      // Drop the stale auth state before we navigate so the login page
      // doesn't briefly render with the old user info still in memory.
      useAuthStore.getState().setUser(null);

      const redirect = resolveSafeRedirect(
        `${window.location.pathname}${window.location.search}`,
        "/"
      );
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("redirect", redirect);
      loginUrl.searchParams.set("reason", reason);
      window.location.assign(loginUrl.toString());
    }

    return Promise.reject(error);
  }
);

export function isAuthRedirected(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as AuthRedirectedError)[AUTH_REDIRECTED_FLAG] === true
  );
}
