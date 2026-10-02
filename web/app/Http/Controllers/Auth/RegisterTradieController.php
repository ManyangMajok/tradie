<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterTradieStep1Request;
use App\Http\Requests\Auth\RegisterTradieStep2Request;
use App\Http\Requests\Auth\RegisterTradieStep3Request;
use App\Http\Requests\Auth\RegisterTradieStep4Request;
use App\Models\Suburb;
use App\Models\TradieAvailability;
use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\TradieCompanyCategory;
use App\Models\TradieServiceArea;
use App\Models\User;
use App\Notifications\AdminNewTradieApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class RegisterTradieController extends Controller
{
    private const SESSION_KEY = 'tradie_registration';

    // ── Step 1: Account + business details ───────────────────────────────

    public function showStep1(): Response
    {
        return Inertia::render('Auth/Register/Tradie/Step1', [
            'draft' => session(self::SESSION_KEY.'.step1', []),
        ]);
    }

    public function storeStep1(RegisterTradieStep1Request $request): RedirectResponse
    {
        $data = $request->validated();

        session()->put(self::SESSION_KEY.'.step1', [
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password_hash' => Hash::make($data['password']),
            'business_name' => $data['business_name'],
            'trading_name' => $data['trading_name'] ?? null,
            'abn' => $data['abn'] ?? null,
            'about_text' => $data['about_text'] ?? null,
        ]);

        return redirect()->route('register.tradie.step2');
    }

    // ── Step 2: Categories + service areas ───────────────────────────────

    public function showStep2(Request $request): Response|RedirectResponse
    {
        if (! session()->has(self::SESSION_KEY.'.step1')) {
            return redirect()->route('register.tradie.step1');
        }

        return Inertia::render('Auth/Register/Tradie/Step2', [
            'categories' => TradieCategory::active()->get(['id', 'slug', 'name']),
            'suburbs' => Suburb::active()->orderBy('name')->get(['id', 'name', 'postcode', 'state']),
            'draft' => session(self::SESSION_KEY.'.step2', []),
        ]);
    }

    public function storeStep2(RegisterTradieStep2Request $request): RedirectResponse
    {
        if (! session()->has(self::SESSION_KEY.'.step1')) {
            return redirect()->route('register.tradie.step1');
        }

        session()->put(self::SESSION_KEY.'.step2', $request->validated());

        return redirect()->route('register.tradie.step3');
    }

    // ── Step 3: Credentials ───────────────────────────────────────────────

    public function showStep3(Request $request): Response|RedirectResponse
    {
        if (! session()->has(self::SESSION_KEY.'.step2')) {
            return redirect()->route('register.tradie.step2');
        }

        return Inertia::render('Auth/Register/Tradie/Step3', [
            'draft' => session(self::SESSION_KEY.'.step3', []),
        ]);
    }

    public function storeStep3(RegisterTradieStep3Request $request): RedirectResponse
    {
        if (! session()->has(self::SESSION_KEY.'.step2')) {
            return redirect()->route('register.tradie.step2');
        }

        session()->put(self::SESSION_KEY.'.step3', $request->validated());

        return redirect()->route('register.tradie.step4');
    }

    // ── Step 4: Agreement + final submit ─────────────────────────────────

    public function showStep4(Request $request): Response|RedirectResponse
    {
        if (! session()->has(self::SESSION_KEY.'.step3')) {
            return redirect()->route('register.tradie.step3');
        }

        return Inertia::render('Auth/Register/Tradie/Step4');
    }

    public function storeStep4(RegisterTradieStep4Request $request): RedirectResponse
    {
        $draft = session(self::SESSION_KEY);

        if (! isset($draft['step1'], $draft['step2'], $draft['step3'])) {
            return redirect()->route('register.tradie.step1');
        }

        $s1 = $draft['step1'];
        $s2 = $draft['step2'];
        $s3 = $draft['step3'];

        DB::transaction(function () use ($s1, $s2, $s3): void {
            $user = User::create([
                'role' => UserRole::Tradie,
                'status' => UserStatus::PendingVerification,
                'first_name' => $s1['first_name'],
                'last_name' => $s1['last_name'],
                'email' => $s1['email'],
                'phone' => $s1['phone'],
                'password' => $s1['password_hash'],
            ]);

            $company = TradieCompany::create([
                'owner_user_id' => $user->id,
                'business_name' => $s1['business_name'],
                'trading_name' => $s1['trading_name'],
                'abn' => $s1['abn'],
                'about_text' => $s1['about_text'],
                'licence_number' => $s3['licence_number'],
                'licence_state' => $s3['licence_state'],
                'licence_expires_on' => $s3['licence_expires_on'],
                'insurance_expires_on' => $s3['insurance_expires_on'],
                'licence_document_path' => $s3['licence_document_path'],
                'insurance_document_path' => $s3['insurance_document_path'],
            ]);

            foreach ($s2['category_ids'] as $categoryId) {
                TradieCompanyCategory::create([
                    'tradie_company_id' => $company->id,
                    'tradie_category_id' => $categoryId,
                    'is_active' => true,
                ]);
            }

            foreach ($s2['suburb_ids'] as $suburbId) {
                TradieServiceArea::create([
                    'tradie_company_id' => $company->id,
                    'suburb_id' => $suburbId,
                    'is_active' => true,
                ]);
            }

            // Default Mon–Fri 07:00–17:00
            foreach (range(1, 5) as $day) {
                TradieAvailability::create([
                    'tradie_company_id' => $company->id,
                    'day_of_week' => $day,
                    'opens_at' => '07:00:00',
                    'closes_at' => '17:00:00',
                    'accepts_emergency' => false,
                ]);
            }

            Auth::login($user);

            session()->forget(self::SESSION_KEY);

            $adminEmail = config('mail.admin_address', config('mail.from.address'));
            Notification::route('mail', $adminEmail)
                ->notify(new AdminNewTradieApplication($company->load('owner')));
        });

        return redirect()->route('tradie.pending-approval');
    }
}
