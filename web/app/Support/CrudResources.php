<?php

namespace App\Support;

use App\Models\IssueType;
use App\Models\Job;
use App\Models\Property;
use App\Models\Suburb;
use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

final class CrudResources
{
    public static function definitions(): array
    {
        $field = fn (string $name, string $label, string $type = 'text', bool $required = true, array $extra = []) => compact('name', 'label', 'type', 'required') + $extra;
        $active = $field('is_active', 'Active', 'checkbox', false, ['default' => true]);
        $order = $field('sort_order', 'Display order', 'number', true, ['default' => 0, 'min' => 0, 'max' => 10000]);

        return [
            'people' => ['label' => 'People', 'singular' => 'person', 'model' => User::class, 'search' => ['first_name', 'last_name', 'email', 'phone'], 'fields' => [
                $field('first_name', 'First name', 'text', true, ['max' => 100]),
                $field('last_name', 'Last name', 'text', true, ['max' => 100]),
                $field('email', 'Email', 'email', true, ['max' => 255]),
                $field('phone', 'Phone', 'tel', true, ['max' => 32]),
                $field('role', 'Role', 'select', true, ['choices' => ['member' => 'Member', 'tradie' => 'Fundi']]),
                $field('status', 'Status', 'select', true, ['choices' => ['active' => 'Active', 'suspended' => 'Suspended']]),
                $field('password', 'Password', 'password', false, ['max' => 128, 'help' => 'Required for a new person (at least 8 characters). Leave blank when editing to keep the password.']),
            ]],
            'fundis' => ['label' => 'Fundis', 'singular' => 'fundi', 'model' => User::class, 'search' => ['first_name', 'last_name', 'email', 'phone'], 'fields' => [
                $field('first_name', 'First name', 'text', true, ['max' => 100]),
                $field('last_name', 'Last name', 'text', true, ['max' => 100]),
                $field('email', 'Email', 'email', true, ['max' => 255]),
                $field('phone', 'Phone', 'tel', true, ['max' => 32]),
                $field('status', 'Fundi status', 'select', true, ['choices' => ['active' => 'Active', 'suspended' => 'Suspended'], 'default' => 'active']),
                $field('business_name', 'Business name', 'text', false, ['max' => 200, 'section' => 'Business information (optional)', 'help' => 'Leave all business fields blank for an independent fundi. Add a business name to save business information.']),
                $field('trading_name', 'Trading name', 'text', false, ['max' => 200, 'section' => 'Business information (optional)']),
                $field('abn', 'Business registration reference', 'text', false, ['max' => 20, 'section' => 'Business information (optional)']),
                $field('about_text', 'About the business', 'textarea', false, ['max' => 2000, 'section' => 'Business information (optional)']),
            ]],
            'tradies' => ['label' => 'Fundi businesses', 'singular' => 'fundi business', 'model' => TradieCompany::class, 'search' => ['business_name', 'trading_name'], 'fields' => [
                $field('business_name', 'Business name', 'text', true, ['max' => 200]),
                $field('owner_user_id', 'Fundi contact', 'select', true, ['reference' => 'fundis', 'help' => 'Create a person with the Fundi role first. Each contact can own one business.']),
                $field('trading_name', 'Trading name', 'text', false, ['max' => 200]),
                $field('abn', 'Business registration reference', 'text', false, ['max' => 20]),
                $field('about_text', 'About the business', 'textarea', false, ['max' => 2000]),
                $field('status', 'Status', 'select', true, ['choices' => ['pending_review' => 'Pending review', 'approved' => 'Approved', 'suspended' => 'Suspended', 'rejected' => 'Rejected']]),
            ]],
            'properties' => ['label' => 'Properties', 'singular' => 'property', 'model' => Property::class, 'search' => ['label', 'address_line_1'], 'fields' => [
                $field('label', 'Property label', 'text', true, ['max' => 60]),
                $field('member_user_id', 'Member', 'select', true, ['reference' => 'members']),
                $field('address_line_1', 'Street address', 'text', true, ['max' => 200]),
                $field('address_line_2', 'Additional address', 'text', false, ['max' => 200]),
                $field('suburb_id', 'Location', 'select', true, ['reference' => 'locations']),
                $field('property_type', 'Property type', 'select', true, ['choices' => ['house' => 'House', 'apartment' => 'Apartment', 'townhouse' => 'Townhouse', 'duplex' => 'Duplex', 'commercial' => 'Commercial', 'other' => 'Other']]),
                $field('access_notes', 'Access notes', 'textarea', false, ['max' => 2000]),
            ]],
            'jobs' => ['label' => 'Jobs', 'singular' => 'job', 'model' => Job::class, 'search' => ['public_id', 'custom_issue', 'description'], 'fields' => [
                $field('custom_issue', 'Job title', 'text', true, ['max' => 200]),
                $field('property_id', 'Property', 'select', true, ['reference' => 'properties', 'help' => 'The member is taken from the selected property.']),
                $field('tradie_category_id', 'Trade category', 'select', true, ['reference' => 'categories']),
                $field('description', 'Description', 'textarea', false, ['max' => 2000]),
                $field('urgency', 'Urgency', 'select', true, ['choices' => ['flexible' => 'Flexible', 'within_48h' => 'Within 48 hours', 'same_day' => 'Same day', 'emergency' => 'Emergency']]),
                $field('assigned_tradie_company_id', 'Assigned fundi business', 'select', false, ['reference' => 'tradies']),
                $field('status', 'Status', 'select', true, ['choices' => ['pending_dispatch' => 'Open', 'in_progress' => 'In progress', 'completed' => 'Completed', 'cancelled' => 'Cancelled']]),
            ]],
            'locations' => ['label' => 'Locations', 'singular' => 'location', 'model' => Suburb::class, 'search' => ['name', 'postcode', 'state'], 'fields' => [
                $field('name', 'Location name', 'text', true, ['max' => 120]),
                $field('postcode', 'Postcode', 'text', true, ['max' => 10]),
                $field('state', 'Country / region code', 'text', true, ['max' => 8, 'default' => 'KE']),
                $active,
            ]],
            'categories' => ['label' => 'Trade categories', 'singular' => 'trade category', 'model' => TradieCategory::class, 'search' => ['name', 'slug'], 'fields' => [
                $field('name', 'Name', 'text', true, ['max' => 64]),
                $field('slug', 'Slug', 'text', true, ['max' => 32, 'help' => 'Lowercase letters, numbers and hyphens, for example plumbing.']),
                $order, $active,
            ]],
            'issue-types' => ['label' => 'Issue types', 'singular' => 'issue type', 'model' => IssueType::class, 'search' => ['name', 'slug'], 'fields' => [
                $field('name', 'Name', 'text', true, ['max' => 100]),
                $field('tradie_category_id', 'Trade category', 'select', true, ['reference' => 'categories']),
                $field('slug', 'Slug', 'text', true, ['max' => 48]),
                $order, $active,
            ]],
        ];
    }

    public static function definition(string $resource): array
    {
        return self::definitions()[$resource] ?? abort(404);
    }

    public static function query(string $resource): Builder
    {
        $query = self::definition($resource)['model']::query();

        if ($resource === 'fundis') {
            return $query->where('role', 'tradie')->with('tradieCompany');
        }

        return $resource === 'people' ? $query->whereIn('role', ['member', 'tradie']) : $query;
    }

    public static function navigation(): array
    {
        return collect(self::definitions())->except('tradies')->map(fn ($definition, $key) => ['key' => $key, 'label' => $definition['label']])->values()->all();
    }

    public static function fields(string $resource): array
    {
        return array_map(function ($field) {
            if (isset($field['reference'])) {
                $field['options'] = self::options($field['reference']);
            } elseif (isset($field['choices'])) {
                $field['options'] = collect($field['choices'])->map(fn ($label, $value) => compact('value', 'label'))->values()->all();
            }

            return $field;
        }, self::definition($resource)['fields']);
    }

    private static function options(string $reference): array
    {
        if (in_array($reference, ['members', 'fundis'])) {
            return User::where('role', $reference === 'members' ? 'member' : 'tradie')->orderBy('first_name')->get()
                ->map(fn ($user) => ['value' => $user->id, 'label' => "$user->first_name $user->last_name ($user->email)"])->all();
        }

        return self::query($reference)->orderBy('id')->get()->map(fn ($record) => [
            'value' => $record->id,
            'label' => match ($reference) {
                'tradies' => $record->business_name,
                'properties' => "$record->label — $record->address_line_1 (#$record->id)",
                default => $record->name,
            },
        ])->all();
    }

    public static function values(string $resource, ?Model $record): array
    {
        $values = [];
        foreach (self::definition($resource)['fields'] as $field) {
            $value = $resource === 'fundis' && isset($field['section'])
                ? $record?->tradieCompany?->getAttribute($field['name'])
                : $record?->getAttribute($field['name']);
            $values[$field['name']] = $field['type'] === 'password' ? '' : ($value instanceof \BackedEnum ? $value->value : ($value ?? $field['default'] ?? ''));
        }

        return $values;
    }
}
