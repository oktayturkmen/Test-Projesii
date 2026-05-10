<?php

namespace App\Exceptions\Domain;

class CurrencyConversionException extends DomainException
{
    protected string $errorCode = 'currency_provider_unavailable';
}
