<?php

namespace App\Http\Requests\Admin;

use App\Models\Server;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServerRequest extends FormRequest
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
            'name' => 'sometimes|string|max:255',
            'ip' => 'sometimes|string|max:255',
            'port' => 'sometimes|integer|between:1,65535',
            'region' => 'sometimes|string|max:10',
            'game_mode' => ['sometimes', 'nullable', 'string', Rule::in(Server::GAME_MODES)],
            'tags' => 'sometimes|array|max:10',
            'tags.*' => 'string|max:50',
            'rcon_password' => 'sometimes|nullable|string|max:255',
            'max_players' => 'sometimes|integer|between:1,128',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.max' => 'Server name cannot exceed 255 characters.',
            'ip.max' => 'Server IP/hostname cannot exceed 255 characters.',
            'port.between' => 'Port must be between 1 and 65535.',
            'region.max' => 'Region code cannot exceed 10 characters.',
            'max_players.between' => 'Maximum players must be between 1 and 128.',
            'game_mode.in' => 'Invalid game mode. Valid modes are: ' . implode(', ', Server::GAME_MODES),
            'tags.max' => 'Maximum 10 tags allowed.',
            'tags.*.max' => 'Each tag cannot exceed 50 characters.',
        ];
    }
}
