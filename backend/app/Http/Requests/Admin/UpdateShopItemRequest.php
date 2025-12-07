<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShopItemRequest extends FormRequest
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
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:2000',
            'price' => 'sometimes|integer|min:0|max:1000000',
            'type' => 'sometimes|string|in:perk,skin,role,vip,other',
            'available' => 'sometimes|boolean',
            'stock' => 'sometimes|nullable|integer|min:0|max:10000',
            'metadata' => 'sometimes|nullable|array',
            'metadata.duration_days' => 'sometimes|nullable|integer|min:1|max:365',
            'metadata.perks' => 'sometimes|nullable|array',
            'metadata.perks.*' => 'string|max:100',
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
            'name.max' => 'Item name cannot exceed 255 characters.',
            'description.max' => 'Description cannot exceed 2000 characters.',
            'price.min' => 'Price cannot be negative.',
            'price.max' => 'Price cannot exceed 1,000,000 credits.',
            'type.in' => 'Invalid item type. Must be one of: perk, skin, role, vip, other.',
            'stock.min' => 'Stock cannot be negative.',
            'stock.max' => 'Stock cannot exceed 10,000.',
            'metadata.duration_days.min' => 'Duration must be at least 1 day.',
            'metadata.duration_days.max' => 'Duration cannot exceed 365 days.',
        ];
    }
}
