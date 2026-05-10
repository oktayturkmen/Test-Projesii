<?php

namespace App\Exceptions\Domain;

class CartException extends DomainException
{
    protected string $errorCode = 'cart_error';
}
