import "server-only";

import type { Metadata } from "next";

import { proxyBackendJson } from "@/lib/server/backend-client";

type ProductDetailPayload = {
  data?: {
    product?: {
      name?: string;
      description?: string;
    };
  };
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // The route's dynamic segment is constrained server-side, but query string
  // and path traversal can still feed garbage in. Bail out cleanly on a
  // malformed id rather than letting a 502 leak into the metadata pipeline.
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return { title: "Ürün" };
  }

  // We do NOT want a slow upstream to block the entire HTML response just to
  // produce a nicer <title>. A 1.5s budget plus `cache: no-store` (already
  // baked into proxyBackendJson) keeps the worst case bounded.
  try {
    const response = await proxyBackendJson({
      path: `/api/products/${numericId}`,
      timeoutMs: 1500,
    });

    if (!response.ok) {
      return { title: "Ürün" };
    }

    const payload = response.payload as ProductDetailPayload;
    const product = payload?.data?.product;
    const name = typeof product?.name === "string" ? product.name.trim() : "";

    if (name === "") {
      return { title: "Ürün" };
    }

    const description =
      typeof product?.description === "string" && product.description.trim() !== ""
        ? product.description.trim().slice(0, 160)
        : `${name} ürün detayı, fiyat ve stok bilgisi.`;

    return {
      title: name,
      description,
    };
  } catch {
    return { title: "Ürün" };
  }
}

export default function ProductDetailLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
