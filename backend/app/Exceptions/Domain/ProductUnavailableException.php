<?php

namespace App\Exceptions\Domain;

class ProductUnavailableException extends DomainException
{
    protected string $errorCode = 'product_unavailable';
}
