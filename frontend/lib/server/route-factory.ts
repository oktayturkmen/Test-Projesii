import "server-only";

import { NextRequest, NextResponse } from "next/server";

import {
  type ProxyJsonResult,
  proxyProtectedJson,
  proxyPublicJson,
} from "@/lib/server/proxy";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/server/backend";
import { clearCsrfCookie } from "@/lib/server/csrf";
import { sanitizeErrorPayload } from "@/lib/server/sanitize";

export type RouteContext<P extends Record<string, string> = Record<string, never>> = {
  params: Promise<P>;
};

export type ProxyHookArgs = {
  request: NextRequest;
  response: NextResponse;
  backend: ProxyJsonResult;
};

export type ProxyRouteOptions<
  P extends Record<string, string> = Record<string, never>,
> = {
  /**
   * `true` -> proxyProtectedJson (auth cookie + CSRF check on writes).
   * `false` -> proxyPublicJson (open endpoint).
   */
  protected: boolean;
  /**
   * Either a static backend path or a resolver receiving the request and
   * (already-awaited) dynamic params.
   */
  backendPath: string | ((args: { request: NextRequest; params: P }) => string);
  /**
   * If true, append the incoming request's query string to the backend path.
   * The factory takes care of `?` vs `&` joining.
   */
  forwardQuery?: boolean;
  /** Optional response-body transformer (e.g. strip auth tokens). */
  sanitize?: (payload: unknown) => unknown;
  /** Runs only when `backend.ok` (success branch). */
  onSuccess?: (args: ProxyHookArgs) => void | Promise<void>;
  /** Runs on every response, success or failure. */
  onResponse?: (args: ProxyHookArgs) => void | Promise<void>;
};

function appendSearchParams(path: string, params: URLSearchParams): string {
  const query = params.toString();

  if (query.length === 0) {
    return path;
  }

  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}

/**
 * Factory that produces a Next.js Route Handler proxying a single backend
 * endpoint. It folds away the boilerplate (path resolution, query forwarding,
 * payload sanitization, post-success cookie writes) that every route handler
 * was duplicating.
 */
export function createProxyRoute<
  P extends Record<string, string> = Record<string, never>,
>(options: ProxyRouteOptions<P>) {
  return async (
    request: NextRequest,
    context?: RouteContext<P>
  ): Promise<NextResponse> => {
    const params = (context ? await context.params : ({} as P)) as P;

    const basePath =
      typeof options.backendPath === "function"
        ? options.backendPath({ request, params })
        : options.backendPath;

    const path = options.forwardQuery
      ? appendSearchParams(basePath, request.nextUrl.searchParams)
      : basePath;

    const proxy = options.protected ? proxyProtectedJson : proxyPublicJson;
    const backend = await proxy(request, path);

    const transformedPayload = options.sanitize
      ? options.sanitize(backend.payload)
      : backend.payload;
    const payload = backend.ok
      ? transformedPayload
      : sanitizeErrorPayload(transformedPayload, backend.status);

    const response = NextResponse.json(payload, { status: backend.status });

    if (options.protected && backend.status === 401) {
      response.cookies.set(AUTH_COOKIE_NAME, "", authCookieOptions(0));
      clearCsrfCookie(response);
    }

    if (options.onSuccess && backend.ok) {
      await options.onSuccess({ request, response, backend });
    }

    if (options.onResponse) {
      await options.onResponse({ request, response, backend });
    }

    return response;
  };
}
