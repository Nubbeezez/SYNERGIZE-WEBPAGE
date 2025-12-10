<?php

namespace App\Traits;

/**
 * Provides helper methods for escaping SQL LIKE wildcards.
 * This prevents users from injecting LIKE patterns into search queries.
 */
trait EscapesLikeWildcards
{
    /**
     * Escape SQL LIKE wildcards in a string.
     *
     * @param string $value The value to escape
     * @return string The escaped value
     */
    protected function escapeLikeWildcards(string $value): string
    {
        return str_replace(['%', '_'], ['\%', '\_'], $value);
    }

    /**
     * Create a safe LIKE search term.
     *
     * @param string $value The search value
     * @param string $position Where to add wildcards: 'both', 'start', 'end', 'none'
     * @return string The safe LIKE search term
     */
    protected function safeLikeSearch(string $value, string $position = 'both'): string
    {
        $escaped = $this->escapeLikeWildcards($value);

        return match ($position) {
            'both' => "%{$escaped}%",
            'start' => "%{$escaped}",
            'end' => "{$escaped}%",
            'none' => $escaped,
            default => "%{$escaped}%",
        };
    }
}
