import "server-only";

import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "@/lib/server/backend";
import { proxyBackendJson } from "@/lib/server/backend-client";
import type { UserRole } from "@/lib/constants";

export type ServerAuthUser = {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
};

type MePayload = {
  data?: {
    user?: ServerAuthUser | null;
  };
};

/**
 * Server-side companion to `/auth/me`. Lets the root layout decide whether
 * the visitor is authenticated BEFORE the first paint, so the navbar doesn't
 * flicker between guest and logged-in states on hydration.
 *
 * Returns `null` for any negative path (no cookie, expired token, network
 * failure, malformed payload). Callers should treat null as "render guest UI".
 */
export async function getCurrentUserFromCookies(): Promise<ServerAuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await proxyBackendJson({
      path: "/api/auth/me",
      token,
    });

    if (!response.ok) {
      return null;
    }

    const payload = response.payload as MePayload;
    const user = payload?.data?.user ?? null;

    if (!user || typeof user.id !== "number") {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
