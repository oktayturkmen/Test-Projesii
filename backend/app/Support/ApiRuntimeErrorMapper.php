<?php

namespace App\Support;

use App\Exceptions\Domain\DomainException;

final class ApiRuntimeErrorMapper
{
    public static function toUserMessage(DomainException $exception): string
    {
        /** @var array<string, string> $messages */
        $messages = (array) config('api_errors.messages', []);
        $errorCode = $exception->errorCode();

        if (array_key_exists($errorCode, $messages)) {
            return $messages[$errorCode];
        }

        return $exception->getMessage();
    }
}
