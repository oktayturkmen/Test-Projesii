import "server-only";

import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/server/backend";
import { errorPayload, proxyBackendJson } from "@/lib/server/backend-client";
import { isCsrfValid } from "@/lib/server/csrf";

export type ProxyJsonResult = {
  ok: boolean;
  status: number;
  payload: unknown;
  token?: string;
};

async function proxyJson(
  request: NextRequest,
  backendPath: string,
  token?: string
): Promise<ProxyJsonResult> {
  return proxyBackendJson({
    path: backendPath,
    method: request.method,
    body: await request.text(),
    token,
  });
}

export async function proxyPublicJson(
  request: NextRequest,
  backendPath: string
): Promise<ProxyJsonResult> {
  return proxyJson(request, backendPath);
}

export async function proxyProtectedJson(
  request: NextRequest,
  backendPath: string
): Promise<ProxyJsonResult> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return {
      ok: false,
      status: 401,
      payload: errorPayload("Bu sayfayi goruntulemek icin giris yapmalisiniz."),
    };
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !isCsrfValid(request)) {
    return {
      ok: false,
      status: 419,
      payload: errorPayload("CSRF dogrulamasi basarisiz."),
    };
  }

  const result = await proxyJson(request, backendPath, token);

  if (result.status === 401) {
    return {
      ...result,
      payload: errorPayload("Oturum sureniz doldu. Lutfen tekrar giris yapin."),
    };
  }

  return result;
}
