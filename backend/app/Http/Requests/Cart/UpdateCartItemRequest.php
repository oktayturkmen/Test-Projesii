<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCartItemRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cart_item_id' => ['required', 'integer', 'exists:cart_items,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
