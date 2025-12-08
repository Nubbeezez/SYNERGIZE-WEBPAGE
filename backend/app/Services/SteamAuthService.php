<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SteamAuthService
{
    private const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
    private const STEAM_API_URL = 'https://api.steampowered.com';
    private const STATE_TTL = 600; // 10 minutes

    /**
     * Generate Steam OpenID login URL with CSRF state protection.
     */
    public function getLoginUrl(): array
    {
        // Generate CSRF state token
        $state = Str::random(40);
        $callbackUrl = config('services.steam.callback_url');

        // Store state for validation (expires in 10 minutes)
        Cache::put("steam_auth_state:{$state}", [
            'created_at' => now()->timestamp,
            'callback_url' => $callbackUrl,
        ], self::STATE_TTL);

        $params = [
            'openid.ns' => 'http://specs.openid.net/auth/2.0',
            'openid.mode' => 'checkid_setup',
            'openid.return_to' => $callbackUrl . '?state=' . $state,
            'openid.realm' => config('app.url'),
            'openid.identity' => 'http://specs.openid.net/auth/2.0/identifier_select',
            'openid.claimed_id' => 'http://specs.openid.net/auth/2.0/identifier_select',
        ];

        return [
            'url' => self::STEAM_OPENID_URL . '?' . http_build_query($params),
            'state' => $state,
        ];
    }

    /**
     * Validate CSRF state token from callback.
     */
    public function validateState(?string $state): bool
    {
        if (empty($state)) {
            Log::warning('Steam auth: Missing state parameter');
            return false;
        }

        $storedState = Cache::pull("steam_auth_state:{$state}");

        if (!$storedState) {
            Log::warning('Steam auth: Invalid or expired state token', ['state' => $state]);
            return false;
        }

        return true;
    }

    /**
     * Validate Steam OpenID callback and return Steam ID.
     */
    public function validateCallback(array $params): ?string
    {
        // Validate required OpenID parameters exist
        $requiredParams = [
            'openid.ns',
            'openid.mode',
            'openid.op_endpoint',
            'openid.claimed_id',
            'openid.identity',
            'openid.return_to',
            'openid.response_nonce',
            'openid.assoc_handle',
            'openid.signed',
            'openid.sig',
        ];

        foreach ($requiredParams as $param) {
            if (empty($params[$param])) {
                Log::error('Steam OpenID: Missing required parameter', ['param' => $param]);
                return null;
            }
        }

        // Validate OpenID namespace
        if ($params['openid.ns'] !== 'http://specs.openid.net/auth/2.0') {
            Log::error('Steam OpenID: Invalid namespace', ['ns' => $params['openid.ns']]);
            return null;
        }

        // Validate return_to matches our callback URL (prevent open redirect)
        $expectedCallback = config('services.steam.callback_url');
        $returnTo = parse_url($params['openid.return_to'] ?? '');
        $expected = parse_url($expectedCallback);

        if (($returnTo['host'] ?? '') !== ($expected['host'] ?? '') ||
            ($returnTo['path'] ?? '') !== ($expected['path'] ?? '')) {
            Log::error('Steam OpenID: return_to mismatch', [
                'return_to' => $params['openid.return_to'],
                'expected' => $expectedCallback,
            ]);
            return null;
        }

        // Validate op_endpoint is Steam's server
        if ($params['openid.op_endpoint'] !== self::STEAM_OPENID_URL) {
            Log::error('Steam OpenID: Invalid op_endpoint', [
                'op_endpoint' => $params['openid.op_endpoint'],
            ]);
            return null;
        }

        // Validate claimed_id format before verification
        $claimedId = $params['openid.claimed_id'];
        if (!preg_match('/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/', $claimedId)) {
            Log::error('Steam OpenID: Invalid claimed_id format', [
                'claimed_id' => $claimedId,
            ]);
            return null;
        }

        // Validate identity matches claimed_id
        if ($params['openid.identity'] !== $claimedId) {
            Log::error('Steam OpenID: identity/claimed_id mismatch', [
                'identity' => $params['openid.identity'],
                'claimed_id' => $claimedId,
            ]);
            return null;
        }

        // Change mode to check_authentication for verification
        $verifyParams = $params;
        $verifyParams['openid.mode'] = 'check_authentication';

        $response = Http::timeout(10)->asForm()->post(self::STEAM_OPENID_URL, $verifyParams);

        if (!$response->successful()) {
            Log::error('Steam OpenID verification request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        // Parse the key-value response
        $responseBody = $response->body();
        $isValid = false;
        $hasNs = false;

        foreach (explode("\n", $responseBody) as $line) {
            $line = trim($line);
            if ($line === 'is_valid:true') {
                $isValid = true;
            }
            if (str_starts_with($line, 'ns:')) {
                $hasNs = true;
            }
        }

        if (!$isValid) {
            Log::error('Steam OpenID validation rejected', [
                'body' => $responseBody,
            ]);
            return null;
        }

        // Extract and validate Steam ID from claimed_id
        if (preg_match('/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/', $claimedId, $matches)) {
            $steamId = $matches[1];

            // Additional validation: Steam IDs start with 7656119
            if (!str_starts_with($steamId, '7656119')) {
                Log::error('Steam OpenID: Invalid Steam ID format', [
                    'steam_id' => $steamId,
                ]);
                return null;
            }

            return $steamId;
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
