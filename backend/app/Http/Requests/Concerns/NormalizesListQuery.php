<?php

namespace App\Http\Requests\Concerns;

use App\Enums\Currency;

/**
 * Provides input normalization + validation helpers for list / detail
 * endpoints that accept pagination and currency selection via the query
 * string. The goal is to keep controllers thin and prevent string mangling
 * (`strtoupper`, `min(max(...))`) from leaking into them.
 */
trait NormalizesListQuery
{
    protected int $defaultPerPage = 15;

    protected int $maxPerPage = 50;

    protected int $minPerPage = 1;

    /**
     * Uppercase + trim a currency-shaped query/body field so downstream
     * validation + service code only ever sees canonical codes.
     */
    protected function uppercaseCurrencyKey(string $key): void
    {
        $value = $this->input($key);

        if (is_string($value)) {
            $this->merge([$key => strtoupper(trim($value))]);
        }
    }

    /**
     * @return array<int, mixed>
     */
    protected function perPageRule(): array
    {
        return ['nullable', 'integer', "min:{$this->minPerPage}", "max:{$this->maxPerPage}"];
    }

    /**
     * Resolve the validated currency (or query-string fallback) to a string,
     * substituting the BASE currency when nothing usable is provided.
     */
    public function resolveCurrency(string $key = 'currency'): string
    {
        $raw = $this->input($key, $this->query($key));

        if (! is_string($raw) || trim($raw) === '') {
            return Currency::BASE->value;
        }

        return strtoupper(trim($raw));
    }

    public function resolvePerPage(string $key = 'per_page'): int
    {
        $value = $this->input($key, $this->query($key, $this->defaultPerPage));

        return min(max((int) $value, $this->minPerPage), $this->maxPerPage);
    }
}
