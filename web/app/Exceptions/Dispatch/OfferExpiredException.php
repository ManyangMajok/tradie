<?php

namespace App\Exceptions\Dispatch;

use RuntimeException;

class OfferExpiredException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('This offer has expired.');
    }
}
