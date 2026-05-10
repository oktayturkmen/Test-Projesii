<?php

namespace App\Exceptions\Domain;

class InventoryException extends DomainException
{
    protected string $errorCode = 'inventory_error';
}
