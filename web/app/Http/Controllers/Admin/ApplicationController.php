<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TradieCompanyStatus;
use App\Http\Controllers\Controller;
use App\Models\TradieCompany;
use App\Notifications\TradieApplicationApproved;
use App\Notifications\TradieApplicationRejected;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function index(): Response
    {
        $applications = TradieCompany::with('owner')
            ->whereIn('status', [TradieCompanyStatus::PendingReview->value])
            ->latest()
            ->get()
            ->map(fn (TradieCompany $c) => [
                'id' => $c->id,
                'business_name' => $c->business_name,
                'abn' => $c->abn,
                'licence_number' => $c->licence_number,
                'licence_state' => $c->licence_state,
                'licence_expires_on' => $c->licence_expires_on?->toDateString(),
                'insurance_expires_on' => $c->insurance_expires_on?->toDateString(),
                'licence_document_path' => $c->licence_document_path,
                'insurance_document_path' => $c->insurance_document_path,
                'created_at' => $c->created_at->toDateTimeString(),
                'owner' => [
                    'id' => $c->owner->id,
                    'first_name' => $c->owner->first_name,
                    'last_name' => $c->owner->last_name,
                    'email' => $c->owner->email,
                    'phone' => $c->owner->phone,
                ],
            ]);

        return Inertia::render('Admin/Applications', ['applications' => $applications]);
    }

    public function approve(Request $request, TradieCompany $application): RedirectResponse
    {
        if ($application->status !== TradieCompanyStatus::PendingReview) {
            return back()->with('error', 'This application has already been processed.');
        }

        $application->update([
            'status' => TradieCompanyStatus::Approved,
            'approved_at' => now(),
            'approved_by_user_id' => $request->user()->id,
        ]);

        $application->owner->notify(new TradieApplicationApproved($application));

        return back()->with('success', "Application for {$application->business_name} approved.");
    }

    public function reject(Request $request, TradieCompany $application): RedirectResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($application->status !== TradieCompanyStatus::PendingReview) {
            return back()->with('error', 'This application has already been processed.');
        }

        $application->update(['status' => TradieCompanyStatus::Rejected]);

        $application->owner->notify(new TradieApplicationRejected($request->reason ?? ''));

        return back()->with('success', "Application for {$application->business_name} rejected.");
    }
}
