<?php

namespace App\Exceptions\Domain;

class ProductDeletionException extends DomainException
{
    protected string $errorCode = 'product_has_orders';
}
