<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterMemberAccountRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class RegisterMemberAccountController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/Register/MemberAccount');
    }

    public function store(RegisterMemberAccountRequest $request): RedirectResponse
    {
        $user = User::create([
            'role' => UserRole::Member,
            'status' => UserStatus::PendingVerification,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        Auth::login($user);

        return redirect()->route('register.member.property');
    }
}
