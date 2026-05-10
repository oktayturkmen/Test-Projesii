<?php

namespace App\Http\Requests\Cart;

use App\Http\Requests\Concerns\NormalizesListQuery;
use Illuminate\Foundation\Http\FormRequest;

class IndexCartRequest extends FormRequest
{
    use NormalizesListQuery;

    protected function prepareForValidation(): void
    {
        $this->uppercaseCurrencyKey('currency');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // The cart endpoint surfaces a specific domain error for unsupported
        // currencies (`Desteklenmeyen para birimi.`); we therefore only
        // shape the input here and defer enforcement to the service.
        return [
            'currency' => ['nullable', 'string', 'size:3'],
        ];
    }
}
