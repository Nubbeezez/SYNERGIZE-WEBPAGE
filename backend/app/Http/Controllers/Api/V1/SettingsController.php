<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Get public settings (for frontend).
     */
    public function public(): JsonResponse
    {
        $publicKeys = [
            'discord_invite',
            'steam_group_url',
            'site_name',
            'site_description',
        ];

        $settings = [];
        foreach ($publicKeys as $key) {
            $settings[$key] = SiteSetting::get($key);
        }

        return response()->json(['data' => $settings]);
    }
}
