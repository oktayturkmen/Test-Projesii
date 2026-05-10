<?php

namespace App\Http\Requests\Currency;

use App\Http\Requests\Concerns\NormalizesListQuery;
use Illuminate\Foundation\Http\FormRequest;

class CurrencyRatesRequest extends FormRequest
{
    use NormalizesListQuery;

    protected function prepareForValidation(): void
    {
        $this->uppercaseCurrencyKey('base');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // We intentionally do NOT enforce the supported-currency list at the
        // request layer; the upstream service raises a domain exception with
        // `error_code: unsupported_base_currency` so callers get a stable
        // error contract even when an unknown code slips through here.
        return [
            'base' => ['nullable', 'string', 'size:3'],
        ];
    }
}
