<?php

namespace App\Enums;

enum Urgency: string
{
    case Emergency = 'emergency';
    case SameDay = 'same_day';
    case Within48h = 'within_48h';
    case Flexible = 'flexible';
}
