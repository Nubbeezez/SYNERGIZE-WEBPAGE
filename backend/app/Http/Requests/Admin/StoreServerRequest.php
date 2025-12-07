<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreServerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by middleware (owner only)
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
            'name' => 'required|string|max:255',
            'ip' => 'required|string|max:255',
            'port' => 'required|integer|between:1,65535',
            'region' => 'required|string|max:10',
            'max_players' => 'required|integer|between:1,128',
            'tags' => 'sometimes|array|max:10',
            'tags.*' => 'string|max:50',
            'rcon_password' => 'sometimes|nullable|string|max:255',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $ip = $this->input('ip');

            if ($ip && !$this->isValidIpOrHostname($ip)) {
                $validator->errors()->add('ip', 'Invalid IP address or hostname format.');
            }

            // Block private/reserved IP ranges for security
            if ($ip && filter_var($ip, FILTER_VALIDATE_IP)) {
                if ($this->isPrivateOrReservedIp($ip)) {
                    $validator->errors()->add('ip', 'Private or reserved IP addresses are not allowed.');
                }
            }
        });
    }

    /**
     * Check if the value is a valid IP address or hostname.
     */
    private function isValidIpOrHostname(string $value): bool
    {
        // Valid IPv4 or IPv6
        if (filter_var($value, FILTER_VALIDATE_IP)) {
            return true;
        }

        // Valid hostname (RFC 1123)
        $hostnamePattern = '/^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*$/';
        return (bool) preg_match($hostnamePattern, $value);
    }

    /**
     * Check if IP is private or reserved.
     */
    private function isPrivateOrReservedIp(string $ip): bool
    {
        return !filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Server name is required.',
            'name.max' => 'Server name cannot exceed 255 characters.',
            'ip.required' => 'Server IP or hostname is required.',
            'ip.max' => 'Server IP/hostname cannot exceed 255 characters.',
            'port.required' => 'Server port is required.',
            'port.between' => 'Port must be between 1 and 65535.',
            'region.required' => 'Server region is required.',
            'region.max' => 'Region code cannot exceed 10 characters.',
            'max_players.required' => 'Maximum players is required.',
            'max_players.between' => 'Maximum players must be between 1 and 128.',
            'tags.max' => 'Maximum 10 tags allowed.',
            'tags.*.max' => 'Each tag cannot exceed 50 characters.',
        ];
    }
}
