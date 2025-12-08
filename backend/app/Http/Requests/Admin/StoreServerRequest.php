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

            if (!$ip) {
                return;
            }

            if (!$this->isValidIpOrHostname($ip)) {
                $validator->errors()->add('ip', 'Invalid IP address or hostname format.');
                return;
            }

            // Block private/reserved IP ranges for security
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                // Direct IP provided
                if ($this->isPrivateOrReservedIp($ip)) {
                    $validator->errors()->add('ip', 'Private or reserved IP addresses are not allowed.');
                }
            } else {
                // Hostname provided - resolve and check each IP
                if ($this->hostnameResolvesToPrivateIp($ip)) {
                    $validator->errors()->add('ip', 'Hostname resolves to a private or reserved IP address, which is not allowed.');
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

        // Block dangerous hostnames
        $blockedHostnames = ['localhost', 'localhost.localdomain', '127.0.0.1.nip.io'];
        if (in_array(strtolower($value), $blockedHostnames, true)) {
            return false;
        }

        // Block hostnames starting with local indicators
        if (preg_match('/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/i', $value)) {
            return false;
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
     * Check if hostname resolves to a private or reserved IP.
     */
    private function hostnameResolvesToPrivateIp(string $hostname): bool
    {
        // Suppress warnings from gethostbynamel for invalid hostnames
        $ips = @gethostbynamel($hostname);

        if ($ips === false) {
            // Could not resolve hostname - allow it (server might not be online yet)
            // The server polling will fail if it's truly invalid
            return false;
        }

        foreach ($ips as $ip) {
            if ($this->isPrivateOrReservedIp($ip)) {
                return true;
            }
        }

        // Also check IPv6 addresses
        $records = @dns_get_record($hostname, DNS_AAAA);
        if ($records) {
            foreach ($records as $record) {
                if (isset($record['ipv6']) && $this->isPrivateOrReservedIp($record['ipv6'])) {
                    return true;
                }
            }
        }

        return false;
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
