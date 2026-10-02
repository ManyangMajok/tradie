<?php

namespace App\Enums;

enum PropertyType: string
{
    case House = 'house';
    case Apartment = 'apartment';
    case Townhouse = 'townhouse';
    case Duplex = 'duplex';
    case Commercial = 'commercial';
    case Other = 'other';
}
