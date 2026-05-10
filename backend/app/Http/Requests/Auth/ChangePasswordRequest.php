<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // Mirrors RegisterRequest's policy so the password strength contract
        // is identical across the two write paths. Pwned-password lookup is
        // only enabled outside local/testing for the same reason: it would
        // make the suite flaky and require outbound HTTP from the dev box.
        $passwordRule = Password::min(10)
            ->letters()
            ->mixedCase()
            ->numbers();

        if (! in_array(app()->environment(), ['local', 'testing'], true)) {
            $passwordRule = $passwordRule->uncompromised();
        }

        return [
            'current_password' => ['required', 'string'],
            // `confirmed` looks for a `password_confirmation` field. The
            // frontend sends `new_password` + `new_password_confirmation`.
            'new_password' => ['required', 'string', 'confirmed', 'different:current_password', $passwordRule],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'new_password.different' => 'Yeni sifre mevcut sifreyle ayni olamaz.',
        ];
    }
}
