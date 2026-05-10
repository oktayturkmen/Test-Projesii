<?php

namespace App\Http\Requests\Admin;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateOrderStatusRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', new Enum(OrderStatus::class)],
        ];
    }

    public function resolveStatus(): OrderStatus
    {
        return OrderStatus::from((string) $this->validated('status'));
    }
}
