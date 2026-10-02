<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IssueTypeSeeder extends Seeder
{
    public function run(): void
    {
        $json = database_path('seeders/data/issue_types.json');
        $data = json_decode(file_get_contents($json), true);
        $now = now();

        foreach ($data as $categorySlug => $issues) {
            $category = DB::table('tradie_categories')->where('slug', $categorySlug)->first();

            if (! $category) {
                continue;
            }

            $records = [];
            foreach ($issues as $order => $name) {
                $records[] = [
                    'tradie_category_id' => $category->id,
                    'slug' => Str::slug($name),
                    'name' => $name,
                    'sort_order' => $order,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('issue_types')->upsert(
                $records,
                ['tradie_category_id', 'slug'],
                ['name', 'sort_order', 'is_active', 'updated_at']
            );
        }
    }
}
