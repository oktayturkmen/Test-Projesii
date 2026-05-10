# ARCHITECTURE.md

# Test Projesi Mimarisi

## Genel Amaç

Bu proje modern web mimarisi prensiplerine uygun şekilde geliştirilecektir.

Sistem:

- Frontend → Next.js
- Backend API → Laravel
- Güvenlik Katmanı → Next.js Proxy Layer
- Authentication → JWT + HttpOnly Cookie
- Veritabanı → MySQL

mimarisi ile çalışacaktır.

---

# 1. Sistem Mimarisi

```text
Browser
   ↓
Next.js Frontend
   ↓
Next.js Proxy API Layer
   ↓
Laravel Backend API
   ↓
MySQL Database
```

KRİTİK KURAL:

Frontend hiçbir zaman Laravel backend'e doğrudan erişmeyecek.

Tüm istekler önce Next.js proxy katmanına gidecek.

---

# 2. Teknoloji Stack

## Frontend

- Next.js 16+ (App Router; kök `proxy.ts` ile **Node runtime** üzerinde route koruması)
- TypeScript
- TailwindCSS
- Axios
- Zustand veya Context API

## Backend

- Laravel 11
- Laravel JWT Auth
- Eloquent ORM
- REST API

## Database

- MySQL

## Güvenlik

- JWT Authentication
- HttpOnly Cookie
- Proxy Isolation
- CORS Protection
- Proxy + JWT ile yetkilendirme (Next `proxy.ts`, Laravel `jwt.auth` / `admin.access`)

---

# 3. Monorepo Yapısı

```text
project-root/
│
├── frontend/
│   ├── app/                 # sayfalar (route groups) + app/api/* Laravel proxy
│   ├── components/
│   ├── services/
│   ├── lib/
│   ├── store/
│   ├── types/
│   └── proxy.ts             # Next.js 16: Node runtime route guard (HttpOnly cookie kontrolü)
│
├── backend/
│   ├── app/                 # Http/, Models/, Services/, Repositories/, DTOs/, ...
│   ├── routes/
│   └── database/
│
└── docker-compose.yml       # şu an yalnızca MySQL (tam stack isteğe bağlı genişletilebilir)
```

---

# 4. Frontend Mimarisi (Next.js)

## Klasör Yapısı

```text
frontend/
│
├── app/
│   ├── login/
│   ├── register/
│   ├── account/             # profil / şifre (auth gerekli)
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── dashboard/
│   ├── admin/
│   └── api/                 # Next Route Handlers → Laravel (tek dış API yüzeyi)
│       ├── auth/
│       ├── account/
│       ├── products/
│       ├── cart/
│       ├── orders/
│       ├── currency/
│       └── admin/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── product/
│   ├── cart/
│   └── auth/
│
├── services/                # istemci; baseURL /api (proxy)
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── cart.service.ts
│   ├── order.service.ts
│   └── currency.service.ts
│
├── store/
│   ├── auth.store.ts
│   ├── cart.store.ts
│   └── currency.store.ts
│
├── lib/
│   ├── axios.ts
│   ├── server/              # proxy, CSRF, backend URL (server-only)
│   └── ...
│
└── proxy.ts                 # korumalı sayfa eşlemesi (cookie yoksa /login)
```

---

# 5. Proxy Layer Yapısı

Bu projenin en önemli kısmıdır.

## Amaç

- Laravel backend URL gizlemek
- JWT token güvenli taşımak
- API izolasyonu sağlamak
- Frontend'i backend'den bağımsızlaştırmak

---

## İstek Akışı

```text
Client Browser
   ↓
/api/products
   ↓
Next.js API Route
   ↓
Laravel API
```

---

## Proxy Route Örneği

```text
frontend/app/api/products/route.ts
```

Bu dosya:

1. Request alır
2. Cookie içindeki token'ı okur
3. Laravel API'ye request gönderir
4. Response'u frontend'e döner

---

# 6. Backend Mimarisi (Laravel)

## Klasör Yapısı

```text
backend/
│
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Requests/
│   │
│   ├── Models/
│   ├── Services/
│   ├── Repositories/
│   └── DTOs/
│
├── routes/
│   └── api.php
│
├── database/
│   ├── migrations/
│   └── seeders/
│
└── config/
```

---

# 7. Backend Katmanları

## Controller Layer

Görev:

- HTTP request almak
- Validation çağırmak
- Service katmanını çalıştırmak
- Response dönmek

Controller içinde business logic yazılmayacak.

---

## Service Layer

Görev:

- İş mantığını yönetmek
- Sipariş oluşturma
- Fiyat hesaplama
- Döviz çevirme
- Cart işlemleri

---

## Repository Layer

Görev:

- Database işlemleri
- Query yönetimi
- Veri erişim soyutlaması

---

# 8. Veritabanı Tasarımı

## Tablolar

### users

```text
id
name
email
email_verified_at
password
role                    # varsayılan: user; admin ayrımı için
remember_token
created_at
updated_at
```

---

### products

```text
id
name
description
price
stock
image
created_at
updated_at
```

---

### carts

```text
id
user_id
created_at
updated_at
```

---

### cart_items

```text
id
cart_id
product_id
quantity
created_at
updated_at
```

---

### orders

```text
id
user_id
status
total_price
currency
created_at
updated_at
```

---

### order_items

```text
id
order_id
product_id
quantity
price
created_at
updated_at
```

---

# 9. Authentication Yapısı

## Login Akışı

```text
User Login
   ↓
Next.js Proxy
   ↓
Laravel Auth API
   ↓
JWT Token
   ↓
Next.js HttpOnly Cookie
```

---

## Token Saklama

JWT token:

- localStorage'da tutulmayacak
- sessionStorage'da tutulmayacak
- sadece HttpOnly cookie içinde tutulacak

Cookie özellikleri:

```text
httpOnly: true
secure: true
sameSite: strict
```

---

# 10. Node Runtime Route Koruması (`proxy.ts`)

Next.js 16’da kökteki `proxy.ts` (önceki sürümlerdeki `middleware.ts` rolünün yerini alan konvansiyon) tarayıcı isteklerinde **HttpOnly `access_token` cookie** kontrolü yapar. Resmi dokümantasyona göre `proxy` **Edge değil, Node.js runtime**’da çalışır ve bu runtime seçilemez; Edge runtime ihtiyacı için `middleware` hâlâ desteklenir (deprecated).

Amaç:

- Sayfa (RSC / ilk istek) seviyesinde route protection
- Login kontrolü ve yetkisiz erişimi `/login` yönlendirmesiyle kesme

Korumalı örnek yollar (cookie yoksa login’e yönlendirilir):

```text
/account
/cart
/checkout
/orders
/dashboard
/admin
```

---

## Backend Middleware

Amaç:

- JWT doğrulama
- API authorization
- Protected endpoint güvenliği

---

# 11. API Tasarımı

## Auth

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/profile      # oturum açık (throttle: account-write)
PUT    /api/auth/password       # oturum açık (throttle: account-write)
```

Next tarafında eşdeğer proxy: `app/api/auth/*`, `app/api/account/*` (profil/şifre yazma istekleri).

---

## Health

```text
GET    /api/health
```

---

## Products

```text
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

---

## Cart

```text
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/update
DELETE /api/cart/remove/{id}
```

---

## Orders

```text
POST   /api/orders
GET    /api/orders
GET    /api/orders/{id}
```

---

## Currency

```text
GET /api/currency/rates
```

---

## Admin (JWT + admin rolü)

```text
GET    /api/admin/stats
GET    /api/admin/orders
PATCH  /api/admin/orders/{id}/status
GET    /api/admin/users
GET    /api/admin/products
GET    /api/admin/products/{id}
```

Ürün oluşturma/güncelleme/silme, genel mağaza ile aynı `POST|PUT|DELETE /api/products` uçları üzerinden (admin middleware).

---

# 12. Döviz Sistemi

Kodda `CurrencyService` üzerinden yürür: `CurrencyRateResolver` (yapılandırmadan gelen sağlayıcı zinciri + devre kesici), `CurrencyRateCache` (taze + anlık görüntü önbelleği + istek içi memo) ve `CurrencyRatePolicy` (hangi kaynağın hangi akışta kabul edileceği).

## Harici sağlayıcılar

Örnek (zincir `config/currency.php` ile):

- `exchangerate_host` — api.exchangerate.host
- `open_er_api` — OpenER API

Sıra ve zaman aşımı yapılandırmadan okunur; sağlayıcı adları politika tarafından “gerçek kur” kaynağı olarak tanınır.

## Display vs transaction (kritik ayrım)

| Akış | Politika | Statik fallback | Eski (stale) anlık görüntü |
|------|-----------|-----------------|---------------------------|
| **Gösterim** (`ratesForDisplay`, ürün listesi/detay) | `CurrencyRatePolicy::display()` | İzinli — sağlayıcılar çökse bile sabit yedek kurlarla UI bloklanmaz | Çok eski anlık görüntü bile kabul edilebilir (`staleSnapshotGraceMinutes` üst sınırı pratikte sınırsız). |
| **Finansal işlem** (`getRatesForTransaction`, sipariş vb.) | `CurrencyRatePolicy::transaction($grace)` | **Yasak** — statik yedekle sipariş kurulamaz; sağlayıcı yoksa hata. | Yalnızca sağlayıcı kaynaklı (`exchangerate_host`, `open_er_api`, `stale_provider_cache`) ve yapılandırılan **grace** dakikası içinde kabul edilir. |

Özet: Mağaza fiyatı göstermek ile siparişi gerçek kur ile kilitlemek farklı güvenilirlik seviyelerindedir.

---

## Çalışma mantığı (özet)

```text
TRY → taban fiyat (DB)
Diğer para birimleri → seçilen kura göre dönüştürülmüş gösterim (API yanıtında)
```

Fiyatlar istemcide seçilen para birimine göre istenir; dönüşüm ve politika Laravel tarafında uygulanır.

---

# 13. State Management

## Global state (Zustand)

`frontend/store/` altında dört store kullanılır:

| Dosya | Sorumluluk |
|--------|------------|
| `auth.store.ts` | Oturum / kullanıcı özeti (`me`), giriş-çıkış sonrası state |
| `cart.store.ts` | Sepet satırları ve sepet API senkronu |
| `currency.store.ts` | Seçili para birimi (`persist` ile kalıcı) |
| `product.store.ts` | Mağaza ürün listesi ve ürün detayı (ör. `/products` ve detay sayfası) |

Not: Ana sayfadaki öne çıkan ürün şeridi gibi bazı bileşenler kasıtlı olarak bu store’u paylaşmaz; kendi yerel state’i ile çekilir (liste sayfası ile state çakışmasını önlemek için).

---

# 14. Hata Yönetimi

## Frontend

- Toast notification
- Form validation
- Loading states
- Error boundaries

---

## Backend

- Global exception handler
- API error response standard

Örnek:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

# 15. Güvenlik Önlemleri

## Yapılacaklar

✅ HttpOnly Cookie

✅ JWT Validation

✅ Proxy Isolation

✅ Backend Hidden URL

✅ Request Validation

✅ Rate Limiting

✅ Protected Routes

✅ CORS Configuration

---

## Yapılmayacaklar

❌ Direct Backend Access

❌ Token in LocalStorage

❌ Open API Exposure

❌ Sensitive Data Leak

---

# 16. Docker Yapısı (Opsiyonel ama Güçlü)

## Repodaki durum

Kök `docker-compose.yml` şu an **yalnızca MySQL** servisini tanımlar (lokal veritabanı). Frontend ve backend geliştirme için ayrı süreçler (`npm run dev`, `php artisan serve`) kullanılır.

## Hedeflenebilecek tam stack (isteğe bağlı)

```text
- frontend
- backend
- mysql
- nginx
```

Avantaj:

- Kolay kurulum
- Aynı environment
- Production benzeri yapı

---

# 17. Deployment Yaklaşımı

## Frontend

- Vercel

## Backend

- VPS / Railway / Render

## Database

- MySQL Cloud

---

# 18. Kod Standartları

## Frontend

- Component bazlı yapı
- Reusable component
- Type-safe development
- Clean folder structure

---

## Backend

- SOLID principles
- Service pattern
- Repository pattern
- Clean architecture

---

# 19. Geliştirme Sırası

## Aşama 1

- Laravel kurulumu
- JWT setup
- Database migrations

---

## Aşama 2

- Next.js kurulumu
- Tailwind setup
- Proxy layer setup

---

## Aşama 3

- Authentication sistemi
- Login/Register ekranları

---

## Aşama 4

- Product CRUD
- Cart sistemi
- Order sistemi

---

## Aşama 5

- Currency integration
- Security improvements
- Error handling

---

## Aşama 6

- Docker
- Documentation
- Deployment

---

# 20. Projenin Güçlü Görünmesi İçin Bonuslar

## Bonus Özellikler

- Swagger API documentation
- Docker setup
- Unit test
- Repository pattern
- DTO usage
- Role-based auth
- CI/CD pipeline
- Redis cache

---

# Sonuç

Bu proje:

- Modern web architecture
- Secure API communication
- Authentication security
- Proxy based isolation
- Scalable backend structure
- Clean code principles

yaklaşımlarını gösterecek şekilde tasarlanmıştır.

Amaç yalnızca çalışan bir CRUD sistemi yapmak değil;
production seviyesine yakın bir mimari kurabilmektir.

