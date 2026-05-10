<?php

namespace App\Http\Requests\Product;

use App\Http\Requests\Concerns\NormalizesListQuery;
use Illuminate\Foundation\Http\FormRequest;

class ShowProductRequest extends FormRequest
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
        // See IndexProductRequest::rules() for the rationale on letting the
        // domain enforce the supported-currency list.
        return [
            'currency' => ['nullable', 'string', 'size:3'],
        ];
    }
}
