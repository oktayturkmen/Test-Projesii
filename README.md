# E-Ticaret Test

Next.js 16 + Laravel 11 monorepo: mağaza UI’si, **Next `app/api/*` proxy** üzerinden Laravel, **JWT HttpOnly cookie**, yazma isteklerinde **CSRF**, rol bazlı **admin**. Bu README, projeyi ayağa kaldırmak ve mimari/güvenlik özünü tek yerde tutmak için yazıldı.

---

## Mimari özeti

```text
Tarayıcı → Next.js (sayfalar + /api/* Route Handlers)
         → Laravel /api/* (X-Proxy-Secret ile doğrulanır)
         → MySQL
```

**Kural:** Tarayıcı Laravel’a doğrudan gitmez; Axios `baseURL: "/api"` kullanır, istekler Next proxy’sine gider.

**Stack:** Next (App Router, kök `proxy.ts` — **Node runtime** route guard), TypeScript, Tailwind, Zustand, Axios | Laravel 11, JWT, Eloquent | MySQL (lokal), SQLite `:memory:` (PHPUnit).

**Backend katmanları:** İnce controller → Service → Repository; FormRequest ile doğrulama.

---

## Repo yapısı (özet)

```text
frontend/app/          # sayfalar + api/* → Laravel proxy
frontend/proxy.ts      # cookie yoksa /login (account, cart, checkout, orders, dashboard, admin)
frontend/services/     # istemci API çağrıları (/api)
frontend/lib/server/   # proxy, CSRF, backend URL (server-only)
backend/app/Http       # Controllers, Middleware, Requests
backend/app/Services|Repositories|Models
backend/routes/api.php
docker-compose.yml     # yalnızca MySQL
```

---

## Güvenlik (özet)

| Konu | Uygulama |
|------|-----------|
| API yüzeyi | Laravel route’ları `proxy.only` + `BACKEND_PROXY_SECRET` (Next her istekte aynı header’ı ekler). |
| JWT | Login/register yanıtında token header’da; Next HttpOnly `access_token` cookie yazar; JSON’dan strip. localStorage/sessionStorage yok. |
| CSRF | POST/PUT/PATCH/DELETE: `csrf_token` cookie + `X-CSRF-Token` eşleşmesi (korumalı proxy). |
| Sayfa koruması | `frontend/proxy.ts` — cookie yoksa `/login`. |
| Admin | Laravel `admin.access`; storefront `/admin` layout’u rol kontrolü. |
| Ürün görseli URL | Backend `SafeImageUrl`; Next `NEXT_IMAGE_ALLOWED_HOSTS`. |

---

## HTTP API (Laravel yolu; tarayıcıda `/api` ön eki Next üzerinden)

Tümü `routes/api.php` içinde throttle ile gruplanmıştır (auth/cart/order için ayrı limitler).

**Auth:** `POST .../auth/register`, `login`, `logout`; `GET .../auth/me`; `PATCH .../auth/profile`, `PUT .../auth/password` (oturum + account-write throttle).

**Health:** `GET .../health`

**Ürünler:** `GET|POST .../products`, `GET|PUT|DELETE .../products/{id}` (yazma: admin + JWT).

**Sepet:** `GET .../cart`, `POST .../cart/add`, `PUT .../cart/update`, `DELETE .../cart/remove/{id}` (JWT).

**Siparişler:** `POST .../orders`, `GET .../orders`, `GET .../orders/{id}` (JWT).

**Kur:** `GET .../currency/rates`

**Admin:** `GET .../admin/stats|orders|users|products`, `GET .../admin/products/{id}`, `PATCH .../admin/orders/{id}/status` (JWT + admin).

Swagger UI: `http://127.0.0.1:8000/api/docs` (Bearer token ile deneme; storefront’ta cookie akışı Postman’de özetlenir).

---

## Gereksinimler

- Node.js 20+, npm 10+
- PHP 8.3+ (`bcmath`, `mbstring`, `pdo_mysql`, `intl`; testler için `pdo_sqlite`)
- Composer 2+, MySQL 8+

---

## Çalıştırma (lokal)

**Backend** — `backend/.env` ← `.env.example`

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan jwt:secret --force
php artisan migrate
php artisan db:seed
php artisan serve
```

**Frontend** — `frontend/.env.local` ← `.env.example`

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

**Zorunlu:** `BACKEND_PROXY_SECRET` **backend `.env` ve `frontend/.env.local` içinde aynı** string olmalı.

| | URL |
|---|-----|
| Mağaza | http://localhost:3000 |
| Laravel | http://127.0.0.1:8000 |
| Swagger | http://127.0.0.1:8000/api/docs |

---

## Demo hesaplar (`php artisan db:seed`)

Production’da seeder çalışmaz.

| Rol | E-posta | Şifre |
|-----|---------|--------|
| Admin | `admin@e-ticaret.test` | `Admin-Demo-2026!` |
| Müşteri | `musteri@e-ticaret.test` | `Musteri-Demo-2026!` |

Özelleştirme: `SEED_ADMIN_*`, `SEED_DEMO_*` (`backend/.env.example` yorumları). Sıfırdan: `php artisan migrate:fresh --seed`. Ek admin: `php artisan user:make-admin mail@ornek.com`

---

## Ortam değişkenleri (özet)

| Yer | Anahtarlar |
|-----|------------|
| Backend | `APP_KEY`, `JWT_SECRET`, `BACKEND_PROXY_SECRET`, `DB_*`, `CORS_ALLOWED_ORIGINS` |
| Frontend | `BACKEND_API_URL`, `BACKEND_PROXY_SECRET`, `AUTH_COOKIE_SECURE`, `NEXT_IMAGE_ALLOWED_HOSTS` |

---

## Komutlar

```bash
cd backend && php artisan test          # SQLite :memory: — phpunit.xml + TestCase DB guard
cd frontend && npm run lint && npm run build
cd backend && php artisan env:assert-production-safety   # üretim env doğrulaması (CI’da da)
```

---

## Sızdırılmış / değişen gizlilik: rotasyon

Şüphe halinde (`.env` sızıntısı, kayıp cihaz, contributor ayrılışı vb.) sırayla:

1. **`php artisan key:generate --force`** — `APP_KEY`
2. **`php artisan jwt:secret --force`** — tüm eski JWT’ler geçersiz; kullanıcılar yeniden giriş yapar
3. **`openssl rand -hex 32`** ile yeni değer → **hem** `backend/.env` **hem** `frontend/.env.local` içinde `BACKEND_PROXY_SECRET=` (aynı olmalı; aksi halde 403)
4. Deploy / servisleri yeniden başlat
5. Smoke: register/login, `GET /api/auth/me`, sepet, sipariş; admin ürün yazma
6. Gerçek değerleri yalnızca sunucu secret manager / ortam değişkeninde tut; repoda yalnızca `.env.example` placeholder kalsın

---

## Docker (yalnızca MySQL)

```bash
docker compose up -d mysql
```

Örnek DB (`backend/.env`): `DB_HOST=127.0.0.1`, `DB_DATABASE=e_ticaret`, kullanıcı/şifre `docker-compose.yml` ile uyumlu. Sonra: `php artisan migrate` ve `php artisan db:seed`.

---

## Sık sorun

- **403 / API yok:** `BACKEND_PROXY_SECRET` iki tarafta aynı mı; `BACKEND_API_URL` doğru mu; Laravel ayakta mı.
- **`next/image` hostname:** `NEXT_IMAGE_ALLOWED_HOSTS` + dev sunucusunu yeniden başlat.
- **Windows kur SSL:** [cacert.pem](https://curl.se/ca/cacert.pem) → `php.ini` `curl.cainfo` / `openssl.cafile`.

---

## Postman

Koleksiyon: `postman/` — `baseUrl` = frontend (`http://localhost:3000`); istekler `/api/*` üzerinden, cookie jar HttpOnly ile uyumludur.


---

## Gelecek

- **`OrderService` ve pessimistic lock:** Sipariş oluşturma akışında ürün satırları `lockForUpdate` ile tutarlı stok/fiyat okuması için kilitlenir (`ProductRepository::findManyForUpdate`). Şu an veri tutarlılığı için bu kilit stratejisi kullanılmıştır; yüksek ölçekli trafik senaryolarında **optimistic locking** (ör. sürüm/`updated_at` tabanlı çakışma çözümü) yapısına geçiş planlanmaktadır.
