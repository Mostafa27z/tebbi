<?php

namespace App\Http\Middleware\Connect;

use App\Exceptions\Connect\BootGuardException;
use App\Models\ConnectCredential;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConnectBootGuard
{
    public function handle(Request $request, Closure $next): Response
    {
        $env = app()->environment();
        $dbName = (string) config('database.connections.' . config('database.default') . '.database');

        // Sandbox environment rule
        if ($env === 'sandbox') {
            if (! str_ends_with(strtolower($dbName), '_sandbox') && $dbName !== ':memory:') {
                throw new BootGuardException(
                    "FATAL BOOT GUARD: Sandbox environment must run on a database ending with '_sandbox'. Connected to: [{$dbName}]"
                );
            }
        }

        // Production environment rule
        if ($env === 'production') {
            if (preg_match('/(_sandbox|_test|_mock|_local|_dev|_staging)$/i', $dbName)) {
                throw new BootGuardException(
                    "FATAL BOOT GUARD: Production environment MUST NOT connect to a test/sandbox/local/dev/staging database: [{$dbName}]"
                );
            }
        }

        // Check credential environment consistency if credential is authenticated
        /** @var ConnectCredential|null $credential */
        $credential = $request->attributes->get('connect_credential');
        if ($credential) {
            if ($env === 'production' && $credential->isSandbox()) {
                throw new BootGuardException('Sandbox credential cannot be used in production environment.');
            }
        }

        return $next($request);
    }
}
