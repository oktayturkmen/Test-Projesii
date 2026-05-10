import Image from "next/image";
import Link from "next/link";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HomeContactSection } from "@/components/home/HomeContactSection";
import { HomeFeatures } from "@/components/home/HomeFeatures";

// Cloudinary delivers an `f_auto,q_auto` optimised version of the hero asset.
// Hosted on `res.cloudinary.com`, which is whitelisted as a built-in remote
// image host in `next.config.ts`.
const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dpj8mf7ye/image/upload/f_auto,q_auto/1162302_ORH_8_LW_0_6a96dc9bd7_jyaq8g";

export default function Home() {
  return (
    <>
      <section className="relative isolate">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-12 sm:py-16 md:grid-cols-[1.1fr_1fr] md:gap-10 md:py-16 lg:gap-12 lg:py-20">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
              Aradığın ürünleri{" "}
              <span className="text-brand">hızlıca</span>{" "}
              bul.
            </h1>

            <p className="max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
              Güncel katalog, güvenli sepet ve sade bir alışveriş deneyimi.
            </p>

            <div className="mt-2">
              <Link
                href="/products"
                className="group inline-flex items-center gap-3 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-xl dark:shadow-black/25"
              >
                Hemen Keşfet
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M13 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Yumuşak halo — düz beyaz arka plan üzerinde ürün hover ediyor hissi verir */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 m-auto h-72 w-72 rounded-full bg-cyan-100/70 blur-3xl dark:bg-cyan-900/30 sm:h-80 sm:w-80"
            />
            <div className="relative aspect-square w-full">
              <Image
                src={HERO_IMAGE_URL}
                alt="Öne çıkan ürün görseli"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 60vw, 90vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <FeaturedProducts />
      <HomeFeatures />
      <HomeContactSection />
    </>
  );
}
