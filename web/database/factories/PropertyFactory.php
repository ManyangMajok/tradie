<?php

namespace Database\Factories;

use App\Enums\PropertyType;
use App\Models\Property;
use App\Models\Suburb;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'member_user_id' => User::factory()->member(),
            'label' => fake()->randomElement(['Home', 'Rental 1', 'Holiday House', 'Investment']),
            'address_line_1' => fake()->streetAddress(),
            'address_line_2' => null,
            'suburb_id' => Suburb::factory(),
            'property_type' => fake()->randomElement(PropertyType::cases()),
            'gate_code' => null,
            'access_notes' => null,
            'is_primary' => false,
        ];
    }

    public function primary(): static
    {
        return $this->state(fn () => ['is_primary' => true]);
    }

    public function forMember(User $member): static
    {
        return $this->state(fn () => ['member_user_id' => $member->id]);
    }
}
