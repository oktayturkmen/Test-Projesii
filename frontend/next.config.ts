import type { NextConfig } from "next";
import path from "path";

/**
 * Image SSRF surface lives in `_next/image`, which fetches the upstream
 * URL server-side. A wildcard `**` pattern would let any admin-supplied
 * URL trigger an outbound request from the Next runtime. Allowed hosts
 * are the union of:
 *
 *   1. `BUILT_IN_IMAGE_HOSTS` — public, multi-tenant delivery CDNs that the
 *      app itself ships assets from (e.g. the hero product image). These
 *      have no SSRF surface for our use-case (no metadata endpoints, no
 *      internal hostnames) and don't require operator action to render.
 *   2. `NEXT_IMAGE_ALLOWED_HOSTS` — comma-separated CSV provided by the
 *      operator for their own product CDN.
 *
 * `next/image` refuses anything outside this set; the frontend already
 * renders a clean "no image" fallback when that happens.
 */
const BUILT_IN_IMAGE_HOSTS = ["res.cloudinary.com"];

function parseAllowedImageHosts(): { protocol: "https"; hostname: string }[] {
  const csv = process.env.NEXT_IMAGE_ALLOWED_HOSTS ?? "";
  const fromEnv = csv
    .split(",")
    .map((host) => host.trim())
    .filter((host) => host.length > 0);

  const merged = Array.from(new Set([...BUILT_IN_IMAGE_HOSTS, ...fromEnv]));

  return merged.map((hostname) => ({ protocol: "https" as const, hostname }));
}

const nextConfig: NextConfig = {
  // Monorepo / üst dizinde başka lockfile varken Turbopack kökünü netleştirir.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    remotePatterns: parseAllowedImageHosts(),
  },
};

export default nextConfig;
