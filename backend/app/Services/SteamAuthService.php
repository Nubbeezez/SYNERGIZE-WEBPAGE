<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SteamAuthService
{
    private const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
    private const STEAM_API_URL = 'https://api.steampowered.com';

    /**
     * Generate Steam OpenID login URL.
     */
    public function getLoginUrl(): string
    {
        $params = [
            'openid.ns' => 'http://specs.openid.net/auth/2.0',
            'openid.mode' => 'checkid_setup',
            'openid.return_to' => config('services.steam.callback_url'),
            'openid.realm' => config('app.url'),
            'openid.identity' => 'http://specs.openid.net/auth/2.0/identifier_select',
            'openid.claimed_id' => 'http://specs.openid.net/auth/2.0/identifier_select',
        ];

        return self::STEAM_OPENID_URL . '?' . http_build_query($params);
    }

    /**
     * Validate Steam OpenID callback and return Steam ID.
     */
    public function validateCallback(array $params): ?string
    {
        // Change mode to check_authentication
        $params['openid.mode'] = 'check_authentication';

        $response = Http::asForm()->post(self::STEAM_OPENID_URL, $params);

        if (!$response->successful()) {
            Log::error('Steam OpenID validation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        // Check if validation was successful
        if (!str_contains($response->body(), 'is_valid:true')) {
            Log::error('Steam OpenID validation rejected', [
                'body' => $response->body(),
            ]);
            return null;
        }

        // Extract Steam ID from claimed_id
        $claimedId = $params['openid.claimed_id'] ?? '';
        if (preg_match('/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/', $claimedId, $matches)) {
            return $matches[1];
        }

        Log::error('Could not extract Steam ID from claimed_id', [
            'claimed_id' => $claimedId,
        ]);

        return null;
    }

    /**
     * Fetch user profile from Steam Web API.
     */
    public function fetchUserProfile(string $steamId): ?array
    {
        $apiKey = config('services.steam.api_key');

        if (!$apiKey) {
            Log::error('Steam API key not configured');
            return null;
        }

        $response = Http::get(self::STEAM_API_URL . '/ISteamUser/GetPlayerSummaries/v2/', [
            'key' => $apiKey,
            'steamids' => $steamId,
        ]);

        if (!$response->successful()) {
            Log::error('Steam API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        $data = $response->json();
        $players = $data['response']['players'] ?? [];

        if (empty($players)) {
            Log::error('No player data returned from Steam API', [
                'steam_id' => $steamId,
            ]);
            return null;
        }

        return $players[0];
    }

    /**
     * Find or create user from Steam authentication.
     */
    public function findOrCreateUser(string $steamId): ?User
    {
        // Fetch profile data from Steam
        $profile = $this->fetchUserProfile($steamId);

        if (!$profile) {
            Log::error('Could not fetch Steam profile', ['steam_id' => $steamId]);
            return null;
        }

        // Find existing user or create new one
        $user = User::updateOrCreate(
            ['steam_id' => $steamId],
            [
                'username' => $profile['personaname'] ?? 'Unknown',
                'avatar_url' => $profile['avatarfull'] ?? null,
            ]
        );

        return $user;
    }

    /**
     * Validate Steam ID format.
     */
    public static function isValidSteamId(string $steamId): bool
    {
        return preg_match('/^7656119\d{10}$/', $steamId) === 1;
    }

    /**
     * Convert Steam ID to Steam profile URL.
     */
    public static function getProfileUrl(string $steamId): string
    {
        return "https://steamcommunity.com/profiles/{$steamId}";
    }
}
