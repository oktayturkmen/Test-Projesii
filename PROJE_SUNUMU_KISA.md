# E-Ticaret Test Projesi - Kısa Sunum

## 1) Proje Amacı
- Modern, güvenli ve ölçeklenebilir bir e-ticaret altyapısı kurmak.
- Frontend ve backend'i net sınırlarla ayırıp sürdürülebilir geliştirme sağlamak.

## 2) Kullanılan Teknolojiler
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind, Zustand
- **Backend:** Laravel 11, JWT Auth, Eloquent ORM
- **Veritabanı:** MySQL
- **Mimari Güvenlik Katmanı:** Next `proxy.ts` + API proxy izolasyonu

## 3) Mimari Yaklaşım
- İstemci doğrudan Laravel'e gitmez; tüm istekler önce Next `/api/*` katmanına gelir.
- Next, istekleri backend'e güvenli şekilde iletir (proxy isolation).
- Backend tarafında katmanlı yapı kullanılır: **Controller -> Service -> Repository**.

## 4) Temel Özellikler
- Kullanıcı kayıt / giriş / çıkış (JWT + HttpOnly cookie)
- Ürün listeleme, detay, admin ürün CRUD
- Sepet yönetimi (ekle, güncelle, sil, listele)
- Sipariş oluşturma ve geçmiş siparişleri görüntüleme
- Admin paneli (sipariş, kullanıcı, ürün yönetimi)
- Döviz desteği (TRY, USD, EUR) ve fiyat dönüştürme

## 5) Güvenlik Özeti
- JWT token tarayıcıda **HttpOnly cookie** içinde tutulur.
- Yazma isteklerinde CSRF doğrulama uygulanır.
- Admin uçları rol bazlı middleware ile korunur.
- Backend uçları `proxy.only` ve paylaşılan secret ile izole edilir.

## 6) Kalite ve Test
- Backend: PHPUnit testleri (feature + unit)
- Frontend: ESLint + TypeScript type-check + production build
- CI pipeline: lint, test, type-check ve build adımlarını otomatik doğrular.

## 7) Sonuç
- Proje, gerçek üretim yaklaşımına yakın bir mimari ile geliştirilmiştir.
- Güvenlik, katmanlı tasarım ve bakım kolaylığı önceliklendirilmiştir.
- Yeni modüller eklenebilir ve sistem mevcut yapıyı bozmadan büyütülebilir.
