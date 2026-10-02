<?php

namespace App\Http\Controllers\Tradie;

use App\Actions\Dispatch\AcceptOfferAction;
use App\Actions\Dispatch\DeclineOfferAction;
use App\Enums\OfferStatus;
use App\Exceptions\Dispatch\OfferExpiredException;
use App\Exceptions\Dispatch\OfferNoLongerAvailableException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tradie\DeclineOfferRequest;
use App\Models\JobOffer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->tradieCompany;

        $leads = JobOffer::with(['job.property.suburb', 'job.category', 'job.issueType', 'job.images'])
            ->where('tradie_company_id', $company->id)
            ->whereIn('status', [OfferStatus::Offered->value, OfferStatus::Viewed->value])
            ->where('expires_at', '>', now())
            ->orderBy('expires_at')
            ->get();

        return Inertia::render('Tradie/Leads/Index', ['leads' => $leads]);
    }

    public function show(Request $request, JobOffer $offer): Response
    {
        $company = $request->user()->tradieCompany;
        abort_if($offer->tradie_company_id !== $company->id, 403);

        // Mark as viewed
        if ($offer->status === OfferStatus::Offered && $offer->viewed_at === null) {
            $offer->update([
                'status' => OfferStatus::Viewed,
                'viewed_at' => now(),
            ]);
        }

        $offer->load(['job.property.suburb', 'job.category', 'job.issueType', 'job.images']);

        return Inertia::render('Tradie/Leads/Show', ['offer' => $offer]);
    }

    public function accept(Request $request, JobOffer $offer, AcceptOfferAction $action): JsonResponse
    {
        $company = $request->user()->tradieCompany;
        abort_if($offer->tradie_company_id !== $company->id, 403);

        try {
            $job = $action->execute($offer, $request->user());
        } catch (OfferExpiredException) {
            return response()->json(['message' => 'This offer has expired.'], 410);
        } catch (OfferNoLongerAvailableException) {
            return response()->json(['message' => 'This offer is no longer available.'], 409);
        }

        return response()->json([
            'job' => $job->only(['id', 'public_id']),
            'public_id' => $job->public_id,
        ]);
    }

    public function decline(DeclineOfferRequest $request, JobOffer $offer, DeclineOfferAction $action): JsonResponse
    {
        $company = $request->user()->tradieCompany;
        abort_if($offer->tradie_company_id !== $company->id, 403);

        try {
            $action->execute($offer, $request->user(), $request->validated('reason'));
        } catch (OfferNoLongerAvailableException) {
            return response()->json(['message' => 'Offer no longer available.'], 409);
        }

        return response()->json(['message' => 'Offer declined.']);
    }
}
