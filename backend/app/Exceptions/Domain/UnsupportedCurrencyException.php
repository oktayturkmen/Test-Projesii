<?php

namespace App\Exceptions\Domain;

class UnsupportedCurrencyException extends DomainException
{
    protected string $errorCode = 'unsupported_currency';
}
