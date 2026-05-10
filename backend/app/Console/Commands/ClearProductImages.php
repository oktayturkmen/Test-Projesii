<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

/**
 * One-shot housekeeping helper for migrating away from seed-generated
 * placeholder image URLs. After switching the factory to default `null`
 * the existing rows can still hold third-party demo URLs (picsum.photos,
 * via.placeholder.com); this command nulls them so the UI shows the
 * "no image" fallback consistently and admins can re-attach real CDN URLs
 * from the admin panel.
 */
class ClearProductImages extends Command
{
    protected $signature = 'products:clear-images
        {--force : Skip the interactive confirmation}';

    protected $description = 'Reset products.image to NULL so demo placeholder URLs are removed';

    public function handle(): int
    {
        $count = Product::query()->whereNotNull('image')->count();

        if ($count === 0) {
            $this->info('No products with image URLs found. Nothing to do.');

            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm("This will clear image on {$count} product(s). Continue?")) {
            $this->warn('Aborted.');

            return self::SUCCESS;
        }

        $affected = Product::query()->whereNotNull('image')->update(['image' => null]);
        $this->info("Cleared image on {$affected} product(s).");

        return self::SUCCESS;
    }
}
