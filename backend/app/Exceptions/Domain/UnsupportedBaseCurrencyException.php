<?php

namespace App\Exceptions\Domain;

class UnsupportedBaseCurrencyException extends DomainException
{
    protected string $errorCode = 'unsupported_base_currency';
}
