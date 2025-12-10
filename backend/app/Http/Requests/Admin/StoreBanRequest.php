<?php

namespace App\Http\Requests\Admin;

use App\Services\SteamAuthService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreBanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by middleware
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'steam_id' => 'required|string|size:17',
            'reason' => 'required|string|max:500',
            'scope' => 'required|in:global,server',
            'server_id' => 'required_if:scope,server|nullable|exists:servers,id',
            'expires_at' => 'nullable|date|after:now',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->has('steam_id')) {
                // Validate Steam ID format
                if (!SteamAuthService::isValidSteamId($this->steam_id)) {
                    $validator->errors()->add('steam_id', 'Invalid Steam ID format.');
                    return;
                }

                // Check if user exists in database (optional - can ban users who haven't logged in yet)
                // Uncomment below if you only want to ban existing users:
                // if (!\App\Models\User::where('steam_id', $this->steam_id)->exists()) {
                //     $validator->errors()->add('steam_id', 'No user found with this Steam ID.');
                // }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'steam_id.required' => 'A Steam ID is required.',
            'steam_id.size' => 'Steam ID must be exactly 17 characters.',
            'reason.required' => 'A ban reason is required.',
            'reason.max' => 'Ban reason cannot exceed 500 characters.',
            'scope.required' => 'Ban scope is required.',
            'scope.in' => 'Ban scope must be either global or server.',
            'server_id.required_if' => 'Server ID is required for server-scoped bans.',
            'server_id.exists' => 'The selected server does not exist.',
            'expires_at.date' => 'Invalid expiration date format.',
            'expires_at.after' => 'Expiration date must be in the future.',
        ];
    }
}
