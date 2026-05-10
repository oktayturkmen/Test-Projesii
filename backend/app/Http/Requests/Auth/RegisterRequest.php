<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // The HaveIBeenPwned check is opt-in: it requires outbound HTTP and
        // would make the test suite flaky/slow; we enable it only outside
        // local/testing so production registrations still benefit from it.
        $passwordRule = Password::min(10)
            ->letters()
            ->mixedCase()
            ->numbers();

        if (! $this->isLocalLikeEnvironment()) {
            $passwordRule = $passwordRule->uncompromised();
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', $passwordRule],
        ];
    }

    private function isLocalLikeEnvironment(): bool
    {
        return in_array(app()->environment(), ['local', 'testing'], true);
    }
}
