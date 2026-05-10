import { NextResponse } from "next/server";
import { proxyBackendJson } from "@/lib/server/backend-client";

async function checkBackend(): Promise<{ ok: boolean; status?: number; error?: string }> {
  const response = await proxyBackendJson({
    path: "/api/health",
    timeoutMs: 3000,
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: "Backend /api/health endpoint'ine ulasilamadi.",
    };
  }

  return {
    ok: true,
    status: response.status,
  };
}

export async function GET() {
  const backend = await checkBackend();
  const isHealthy = backend.ok;

  return NextResponse.json({
    success: isHealthy,
    message: isHealthy ? "Proxy ve backend saglikli." : "Proxy calisiyor, backend sagliksiz.",
    data: {
      proxy: {
        ok: true,
      },
      backend,
    },
  }, {
    status: isHealthy ? 200 : 503,
  });
}
