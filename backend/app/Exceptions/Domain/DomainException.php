<?php

namespace App\Exceptions\Domain;

use RuntimeException;

abstract class DomainException extends RuntimeException
{
    protected string $errorCode = 'domain_error';

    public function errorCode(): string
    {
        return $this->errorCode;
    }
}
