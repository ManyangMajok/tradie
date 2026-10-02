<?php

namespace App\Exceptions\Dispatch;

use RuntimeException;

class OfferNoLongerAvailableException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('This offer is no longer available.');
    }
}
