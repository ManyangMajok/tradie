<?php

namespace App\Http\Controllers\Api\V1\Tradie;

use App\Actions\Dispatch\AcceptOfferAction;
use App\Actions\Dispatch\DeclineOfferAction;
use App\Enums\OfferStatus;
use App\Exceptions\Dispatch\OfferExpiredException;
use App\Exceptions\Dispatch\OfferNoLongerAvailableException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tradie\DeclineOfferRequest;
use App\Models\JobOffer;
use App\Traits\FormatsJobResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    use FormatsJobResponse;

    /**
     * GET /api/v1/tradie/leads
     */
    public function index(Request $request): JsonResponse
    {
        $company = $request->user()->tradieCompany;

        $leads = JobOffer::with(['job.property.suburb', 'job.category', 'job.issueType', 'job.images'])
            ->where('tradie_company_id', $company->id)
            ->whereIn('status', [OfferStatus::Offered->value, OfferStatus::Viewed->value])
            ->where('expires_at', '>', now())
            ->orderBy('expires_at')
            ->get();

        return response()->json(['data' => $leads->map(fn (JobOffer $offer) => $this->formatOffer($offer))->values()]);
    }

    /**
     * GET /api/v1/tradie/leads/{offerId}
     */
    public function show(Request $request, JobOffer $offer): JsonResponse
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

        return response()->json(['data' => $this->formatOffer($offer)]);
    }

    /**
     * POST /api/v1/tradie/leads/{offerId}/accept
     */
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
            'job_id' => $job->id,
            'public_id' => $job->public_id,
        ]);
    }

    /**
     * POST /api/v1/tradie/leads/{offerId}/decline
     */
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
