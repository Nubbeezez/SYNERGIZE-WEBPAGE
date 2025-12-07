<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    /**
     * Get all settings (admin view).
     */
    public function index(): JsonResponse
    {
        $settings = SiteSetting::all()->map(function ($setting) {
            return [
                'key' => $setting->key,
                'value' => match ($setting->type) {
                    'boolean' => (bool) $setting->value,
                    'integer' => (int) $setting->value,
                    'json' => json_decode($setting->value, true),
                    default => $setting->value,
                },
                'type' => $setting->type,
                'updated_at' => $setting->updated_at,
            ];
        });

        return response()->json(['data' => $settings]);
    }

    /**
     * Update a setting.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string',
            'value' => 'required',
        ]);

        $setting = SiteSetting::where('key', $request->key)->first();

        if (!$setting) {
            return response()->json(['error' => 'Setting not found'], 404);
        }

        // Validate value type matches setting type
        $typeError = $this->validateSettingType($setting->type, $request->value);
        if ($typeError) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_TYPE',
                    'message' => $typeError,
                ],
            ], 400);
        }

        $oldValue = $setting->value;

        $storedValue = match ($setting->type) {
            'json' => json_encode($request->value),
            'boolean' => $request->value ? '1' : '0',
            default => (string) $request->value,
        };

        $setting->update(['value' => $storedValue]);
        SiteSetting::clearCache();

        // Log the change
        AuditLog::create([
            'actor_steam_id' => auth()->user()->steam_id,
            'action' => 'setting.update',
            'target_type' => 'setting',
            'target_id' => $setting->id,
            'payload' => [
                'key' => $request->key,
                'old_value' => $oldValue,
                'new_value' => $storedValue,
            ],
        ]);

        return response()->json([
            'message' => 'Setting updated successfully',
            'data' => [
                'key' => $setting->key,
                'value' => $request->value,
            ],
        ]);
    }

    /**
     * Update multiple settings at once.
     */
    public function updateBatch(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
        ]);

        $updated = [];

        foreach ($request->settings as $item) {
            $setting = SiteSetting::where('key', $item['key'])->first();

            if ($setting) {
                // Validate value type matches setting type
                $typeError = $this->validateSettingType($setting->type, $item['value']);
                if ($typeError) {
                    return response()->json([
                        'error' => [
                            'code' => 'INVALID_TYPE',
                            'message' => "Invalid type for '{$item['key']}': {$typeError}",
                        ],
                    ], 400);
                }

                $oldValue = $setting->value;

                $storedValue = match ($setting->type) {
                    'json' => json_encode($item['value']),
                    'boolean' => $item['value'] ? '1' : '0',
                    default => (string) $item['value'],
                };

                $setting->update(['value' => $storedValue]);
                $updated[] = $item['key'];

                // Log each change
                AuditLog::create([
                    'actor_steam_id' => auth()->user()->steam_id,
                    'action' => 'setting.update',
                    'target_type' => 'setting',
                    'target_id' => $setting->id,
                    'payload' => [
                        'key' => $item['key'],
                        'old_value' => $oldValue,
                        'new_value' => $storedValue,
                    ],
                ]);
            }
        }

        SiteSetting::clearCache();

        return response()->json([
            'message' => 'Settings updated successfully',
            'updated' => $updated,
        ]);
    }

    /**
     * Validate that a value matches the expected setting type.
     *
     * @return string|null Error message if invalid, null if valid
     */
    private function validateSettingType(string $type, mixed $value): ?string
    {
        return match ($type) {
            'boolean' => is_bool($value) || in_array($value, [0, 1, '0', '1', true, false], true)
                ? null
                : 'Value must be a boolean.',

            'integer' => is_numeric($value) && (int) $value == $value
                ? null
                : 'Value must be an integer.',

            'json' => is_array($value) || is_object($value)
                ? null
                : 'Value must be a JSON object or array.',

            'string' => is_string($value) || is_numeric($value)
                ? null
                : 'Value must be a string.',

            default => null, // Unknown types pass through
        };
    }
}
