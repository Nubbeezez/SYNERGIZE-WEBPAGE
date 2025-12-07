<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateUserRolesRequest extends FormRequest
{
    /**
     * Valid roles in the system.
     */
    public const VALID_ROLES = [
        'user',
        'vip',
        'admin',
        'senior-admin',
        'head-admin',
        'manager',
        'owner',
    ];

    /**
     * Role hierarchy levels.
     */
    public const ROLE_LEVELS = [
        'user' => 0,
        'vip' => 1,
        'admin' => 10,
        'senior-admin' => 10,
        'head-admin' => 20,
        'manager' => 30,
        'owner' => 100,
    ];

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
        $validRoles = implode(',', self::VALID_ROLES);

        return [
            'roles' => 'required|array|min:1',
            'roles.*' => "string|in:{$validRoles}",
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $actor = $this->user();
            $targetUser = $this->route('user');

            if (!$actor || !$targetUser) {
                return;
            }

            $actorLevel = $this->getHighestRoleLevel($actor);
            $targetLevel = $this->getHighestRoleLevel($targetUser);
            $newRoles = $this->input('roles', []);
            $newMaxLevel = $this->getMaxLevelFromRoles($newRoles);

            // Cannot modify users with same or higher level (unless owner)
            if ($actorLevel <= $targetLevel && !$actor->hasRole('owner')) {
                $validator->errors()->add('roles', 'You cannot modify roles for users at or above your permission level.');
            }

            // Cannot assign roles higher than your own (unless owner)
            if ($newMaxLevel >= $actorLevel && !$actor->hasRole('owner')) {
                $validator->errors()->add('roles', 'You cannot assign roles at or above your own permission level.');
            }

            // Only owner can assign owner role
            if (in_array('owner', $newRoles) && !$actor->hasRole('owner')) {
                $validator->errors()->add('roles', 'Only owners can assign the owner role.');
            }
        });
    }

    /**
     * Get the highest role level for a user.
     */
    private function getHighestRoleLevel(User $user): int
    {
        $level = 0;
        foreach ($user->roles ?? [] as $role) {
            $roleLevel = self::ROLE_LEVELS[$role] ?? 0;
            if ($roleLevel > $level) {
                $level = $roleLevel;
            }
        }
        return $level;
    }

    /**
     * Get the maximum level from an array of roles.
     */
    private function getMaxLevelFromRoles(array $roles): int
    {
        $level = 0;
        foreach ($roles as $role) {
            $roleLevel = self::ROLE_LEVELS[$role] ?? 0;
            if ($roleLevel > $level) {
                $level = $roleLevel;
            }
        }
        return $level;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'roles.required' => 'At least one role is required.',
            'roles.array' => 'Roles must be an array.',
            'roles.min' => 'At least one role is required.',
            'roles.*.in' => 'Invalid role specified.',
        ];
    }
}
