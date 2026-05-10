<?php

namespace App\Http\Requests\Order;

use App\Enums\Currency;
use App\Http\Requests\Concerns\NormalizesListQuery;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
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
        return [
            'currency' => ['nullable', 'string', Rule::in(Currency::values())],
        ];
    }
}
