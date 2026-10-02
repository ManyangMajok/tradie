<?php

namespace Database\Seeders;

use App\Models\Suburb;
use Illuminate\Database\Seeder;

class SuburbSeeder extends Seeder
{
    public function run(): void
    {
        // Representative demonstration service areas, not a national postal directory.
        foreach ([
            ['Westlands', '00100', 'Nairobi'], ['Kilimani', '00100', 'Nairobi'],
            ['Karen', '00502', 'Nairobi'], ['Langata', '00509', 'Nairobi'],
            ['Kasarani', '00608', 'Nairobi'], ['Embakasi', '00501', 'Nairobi'],
            ['Nyali', '80100', 'Mombasa'], ['Bamburi', '80100', 'Mombasa'],
            ['Milimani', '40100', 'Kisumu'], ['Nakuru Town', '20100', 'Nakuru'],
            ['Ruiru', '00232', 'Kiambu'], ['Kitengela', '00241', 'Kajiado'],
        ] as [$name, $postcode, $county]) {
            Suburb::updateOrCreate(['name' => $name, 'postcode' => $postcode, 'state' => $county], ['is_active' => true]);
        }
        // Retain referenced old rows so existing requests are preserved.
        Suburb::where('state', 'WA')->update(['is_active' => false]);
    }
}
