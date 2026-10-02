<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SuburbSeeder extends Seeder
{
    public function run(): void
    {
        $csv = database_path('seeders/data/wa_suburbs.csv');
        $rows = array_map('str_getcsv', file($csv));
        $headers = array_shift($rows);

        $now = now();
        $records = [];

        foreach ($rows as $row) {
            $data = array_combine($headers, $row);
            $records[] = [
                'name' => trim($data['name']),
                'postcode' => trim($data['postcode']),
                'state' => trim($data['state']),
                'latitude' => $data['latitude'] !== '' ? (float) $data['latitude'] : null,
                'longitude' => $data['longitude'] !== '' ? (float) $data['longitude'] : null,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('suburbs')->upsert(
            $records,
            ['name', 'postcode', 'state'],
            ['latitude', 'longitude', 'is_active', 'updated_at']
        );
    }
}
