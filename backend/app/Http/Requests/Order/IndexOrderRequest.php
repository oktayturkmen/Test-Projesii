<?php

namespace App\Http\Requests\Order;

use App\Http\Requests\Concerns\NormalizesListQuery;
use Illuminate\Foundation\Http\FormRequest;

class IndexOrderRequest extends FormRequest
{
    use NormalizesListQuery;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'per_page' => $this->perPageRule(),
        ];
    }
}
