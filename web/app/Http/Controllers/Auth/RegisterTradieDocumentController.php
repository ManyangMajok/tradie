<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RegisterTradieDocumentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png'],
        ]);

        $file = $request->file('file');
        $uuid = Str::uuid()->toString();
        $extension = $file->getClientOriginalExtension();
        $path = "tradie_docs/{$uuid}.{$extension}";

        Storage::disk('local')->putFileAs('tradie_docs', $file, "{$uuid}.{$extension}");

        return response()->json(['path' => $path]);
    }
}
