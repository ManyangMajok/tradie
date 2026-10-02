<?php

namespace App\Exceptions\Job;

use Exception;

class InvalidStatusTransitionException extends Exception
{
    public function __construct(string $message = 'Invalid job status transition.')
    {
        parent::__construct($message);
    }
}
