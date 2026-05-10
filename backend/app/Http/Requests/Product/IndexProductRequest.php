<?php

namespace App\Http\Requests\Product;

use App\Http\Requests\Concerns\NormalizesListQuery;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexProductRequest extends FormRequest
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
        // Currency value-correctness is enforced inside the domain so that
        // unsupported codes hit the canonical UnsupportedCurrencyException
        // path and therefore the stable error_code contract.
        return [
            'currency' => ['nullable', 'string', 'size:3'],
            'per_page' => $this->perPageRule(),
            'sort' => ['nullable', 'string', Rule::in(['price_asc', 'price_desc'])],
        ];
    }

    public function resolvePriceSort(): ?string
    {
        /** @var string|null $sort */
        $sort = $this->validated('sort');

        return $sort;
    }
}
