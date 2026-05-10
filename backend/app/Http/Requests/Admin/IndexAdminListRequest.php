<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Shared list FormRequest for admin grids (orders, users). Both endpoints
 * only need a normalized `per_page`; keep the bounds local so we don't
 * override trait properties with incompatible defaults.
 */
class IndexAdminListRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function resolvePerPage(string $key = 'per_page'): int
    {
        $value = $this->input($key, $this->query($key, 20));

        return min(max((int) $value, 1), 100);
    }
}
