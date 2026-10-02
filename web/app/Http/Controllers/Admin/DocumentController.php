<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    /**
     * Serve a private tradie credential document to an authenticated admin.
     *
     * Paths are stored as relative paths under the 'local' disk root, e.g.
     * "tradie_docs/{uuid}.pdf". We validate the prefix to prevent traversal.
     */
    public function show(Request $request, string $path): StreamedResponse
    {
        // Only paths stored by the upload controller are valid.
        abort_unless(str_starts_with($path, 'tradie_docs/'), 403);

        // Reject any traversal attempts.
        abort_if(str_contains($path, '..'), 403);

        abort_unless(Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path);
    }
}
