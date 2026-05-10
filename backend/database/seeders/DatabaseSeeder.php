<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Non-production only: demo admin, demo müşteri, katalog ürünleri, örnek
     * sepet ve bir sipariş. Production'da çalıştırılmaz.
     *
     * @see README.md — `php artisan migrate` sonrası `php artisan db:seed`
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('DatabaseSeeder skipped: refusing to create demo data in production.');

            return;
        }

        $adminEmail = (string) env('SEED_ADMIN_EMAIL', 'admin@e-ticaret.test');
        $adminPassword = (string) env('SEED_ADMIN_PASSWORD', 'Admin-Demo-2026!');

        $demoEmail = (string) env('SEED_DEMO_EMAIL', 'musteri@e-ticaret.test');
        $demoPassword = (string) env('SEED_DEMO_PASSWORD', 'Musteri-Demo-2026!');

        $admin = User::firstOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'Demo Admin',
                'password' => $adminPassword,
                'email_verified_at' => now(),
            ]
        );
        if (! $admin->isAdmin()) {
            $admin->promoteToAdmin();
        }

        $customer = User::firstOrCreate(
            ['email' => $demoEmail],
            [
                'name' => 'Demo Müşteri',
                'password' => $demoPassword,
                'email_verified_at' => now(),
            ]
        );
        if ($customer->isAdmin()) {
            $customer->demoteToUser();
        }

        $this->seedCatalogProducts();

        $this->seedDemoCart($customer);
        $this->seedDemoOrder($customer);

        $this->command?->newLine();
        $this->command?->info('Demo veri hazır.');
        $this->command?->table(
            ['Rol', 'E-posta', 'Şifre (sadece lokal)'],
            [
                ['Admin', $adminEmail, $adminPassword],
                ['Müşteri', $demoEmail, $demoPassword],
            ]
        );
        $this->command?->warn('Bu şifreleri yalnızca lokal geliştirmede kullanın; production .env ile asla commit etmeyin.');
    }

    private function seedCatalogProducts(): void
    {
        $demoImage =
            'https://res.cloudinary.com/dpj8mf7ye/image/upload/f_auto,q_auto,w_600/1162302_ORH_8_LW_0_6a96dc9bd7_jyaq8g';

        /** @var list<array{name: string, description: string, price: string, stock: int, image: ?string}> $rows */
        $rows = [
            [
                'name' => 'Akıllı Telefon X1',
                'description' => 'Demo katalog: AMOLED ekran, 128 GB depolama, günlük kullanım için dengeli performans.',
                'price' => '18999.99',
                'stock' => 42,
                'image' => $demoImage,
            ],
            [
                'name' => 'Kablosuz Kulaklık Pro',
                'description' => 'Gürültü engelleme, 30 saate kadar pil; ofis ve seyahat için.',
                'price' => '3499.00',
                'stock' => 120,
                'image' => null,
            ],
            [
                'name' => 'Taşınabilir Şarj Cihazı 20K',
                'description' => 'USB-C ve USB-A çıkışları; uçak kabin uyumlu kapasite.',
                'price' => '899.50',
                'stock' => 200,
                'image' => null,
            ],
            [
                'name' => 'Mekanik Klavye RGB',
                'description' => 'Hot-swap anahtarlar, Türkçe Q düzen seçeneği ile uyumlu gövde.',
                'price' => '4299.00',
                'stock' => 35,
                'image' => null,
            ],
            [
                'name' => 'Ergonomic Mouse',
                'description' => 'Dikey tutuş, bilek yükünü azaltmak için tasarlandı.',
                'price' => '1599.00',
                'stock' => 88,
                'image' => null,
            ],
            [
                'name' => '27" IPS Monitör',
                'description' => '100 Hz, düşük mavi ışık modu; uzaktan çalışma için.',
                'price' => '6599.00',
                'stock' => 15,
                'image' => $demoImage,
            ],
            [
                'name' => 'USB-C Hub 7-in-1',
                'description' => 'HDMI, kart okuyucu, PD şarj; ince dizüstüler için.',
                'price' => '1249.90',
                'stock' => 150,
                'image' => null,
            ],
            [
                'name' => 'Webcam 1080p',
                'description' => 'Otomatik pozlama, çift mikrofon; görüntülü görüşme odaklı.',
                'price' => '2199.00',
                'stock' => 60,
                'image' => null,
            ],
            [
                'name' => 'Laptop Stand Alüminyum',
                'description' => '6 kademeli yükseklik, havalandırma kanalları.',
                'price' => '749.00',
                'stock' => 95,
                'image' => null,
            ],
            [
                'name' => 'Kablosuz Mouse Pad Şarjlı',
                'description' => 'Qi uyumlu şarj alanı ve kaymaz taban.',
                'price' => '1899.00',
                'stock' => 0,
                'image' => null,
            ],
        ];

        foreach ($rows as $row) {
            Product::updateOrCreate(
                ['name' => $row['name']],
                [
                    'description' => $row['description'],
                    'price' => $row['price'],
                    'stock' => $row['stock'],
                    'image' => $row['image'],
                ]
            );
        }
    }

    private function seedDemoCart(User $customer): void
    {
        $cart = Cart::firstOrCreate(['user_id' => $customer->id]);

        $cart->items()->delete();

        $products = Product::query()
            ->where('stock', '>', 0)
            ->orderBy('id')
            ->take(3)
            ->get();

        if ($products->isEmpty()) {
            return;
        }

        $quantities = [2, 1, 1];
        foreach ($products->values() as $index => $product) {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => $quantities[$index] ?? 1,
            ]);
        }
    }

    private function seedDemoOrder(User $customer): void
    {
        if (Order::query()->where('user_id', $customer->id)->exists()) {
            return;
        }

        $product = Product::query()->where('stock', '>', 0)->orderBy('id')->first();
        if (! $product) {
            return;
        }

        $quantity = 1;
        $lineTotal = (string) bcmul((string) $product->price, (string) $quantity, 2);

        $order = Order::create([
            'user_id' => $customer->id,
            'status' => OrderStatus::Pending->value,
            'total_price' => '0.00',
            'currency' => 'TRY',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => 'PRD-'.$product->id,
            'product_image' => $product->image,
            'quantity' => $quantity,
            'price' => $lineTotal,
        ]);

        $order->update(['total_price' => $lineTotal]);
    }
}
