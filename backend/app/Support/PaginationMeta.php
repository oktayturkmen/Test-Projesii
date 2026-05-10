<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class PaginationMeta
{
    /**
     * @return array{current_page: int, per_page: int, last_page: int, total: int}
     */
    public static function from(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'last_page' => $paginator->lastPage(),
            'total' => $paginator->total(),
        ];
    }
}
