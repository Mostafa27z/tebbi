<?php

namespace App\Http\Middleware\Connect;

use App\Exceptions\Connect\ConnectQueryException;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use PDOException;
use Symfony\Component\HttpFoundation\Response;

class HandleConnectDatabaseExceptions
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (QueryException|PDOException $e) {
            $requestId = $request->attributes->get('connect_request_id');

            Log::channel('connect')->error('[REDACTED_SQL] Database Query Exception Caught in Connect Pipeline', [
                'request_id' => $requestId,
                'sql_state' => $e->getCode(),
            ]);

            throw new ConnectQueryException(
                message: 'A database query error occurred during Connect processing.',
                code: (int) ($e->getCode() ?: 500),
                previous: $e,
                contextId: $requestId
            );
        }
    }
}
