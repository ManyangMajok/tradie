<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DeleteRecordRequest;
use App\Support\CrudResources;
use Illuminate\Support\Facades\Password;

class AccountAccessController extends Controller
{
    public function store(DeleteRecordRequest $request, string $resource, int $record)
    {
        abort_unless(in_array($resource, ['people', 'fundis']), 404);
        $user = CrudResources::query($resource)->findOrFail($record);
        $token = Password::createToken($user);
        $url = route('password.reset', ['token' => $token, 'email' => $user->email]);

        return back()->with('setup_url', $url)->with('success', 'Password setup link created. Share it privately with this person. It expires in 60 minutes.');
    }
}
