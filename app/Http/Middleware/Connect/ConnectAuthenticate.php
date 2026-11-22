<?php

namespace App\Http\Middleware\Connect;

use App\Exceptions\Connect\PublishableKeyWriteException;
use App\Exceptions\Connect\UnauthorizedException;
use App\Models\ConnectApiLog;
use App\Models\ConnectCredential;
use App\Models\ConnectUsageDaily;
use App\Services\Connect\ConnectContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ConnectAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $requestId = $request->header('X-Request-Id') ?? (string) Str::uuid();
        $request->attributes->set('connect_request_id', $requestId);

        $authHeader = $request->header('Authorization');
        $pkHeader = $request->header('X-Publishable-Key');

        $rawKey = null;
        $keyType = null;

        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $rawKey = trim(substr($authHeader, 7));
            $keyType = 'sk';
        } elseif ($pkHeader) {
            $rawKey = trim($pkHeader);
            $keyType = 'pk';
        }

        if (empty($rawKey)) {
            throw new UnauthorizedException('مفتاح API مفقود، يرجى تزويد ترويسة Authorization أو X-Publishable-Key.');
        }

        $hash = ConnectCredential::hashKey($rawKey);

        /** @var ConnectCredential|null $credential */
        $credential = ConnectCredential::where('sk_hash', $hash)
            ->orWhere('pk_hash', $hash)
            ->first();

        if (! $credential && (str_starts_with($rawKey, 'bit_') || str_starts_with($rawKey, 'int_'))) {
            $intent = \App\Models\ConnectBookingIntent::where('intent_token', $rawKey)->first();
            if ($intent) {
                $credential = $intent->credential;
                $request->attributes->set('connect_booking_intent', $intent);
            }
        }

        if (! $credential || ! $credential->isActive()) {
            throw new UnauthorizedException('مفتاح API غير صالح، منتهي الصلاحية، أو تم إيقافه.');
        }

        // Enforce Publishable Key read-only restriction
        if ($keyType === 'pk' && ! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            throw new PublishableKeyWriteException();
        }

        // Attach credential and context
        $request->attributes->set('connect_credential', $credential);
        $request->attributes->set('connect_auth_type', $keyType);

        ConnectContext::setContext([
            'credential_id' => $credential->id,
            'request_id' => $requestId,
            'environment' => $credential->environment,
        ]);

        // Throttled last_used_at update
        if (! $credential->last_used_at || $credential->last_used_at->diffInMinutes(now()) >= 5) {
            $credential->updateQuietly(['last_used_at' => now()]);
        }

        // Record daily usage (increment request_count)
        try {
            $today = now()->format('Y-m-d');
            ConnectUsageDaily::firstOrCreate(
                ['credential_id' => $credential->id, 'usage_date' => $today],
                ['request_count' => 0]
            )->increment('request_count');
        } catch (\Throwable $e) {
            // Silently ignore usage counter failures to avoid blocking the main request
        }

        $response = $next($request);

        // Record API log
        try {
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            ConnectApiLog::create([
                'credential_id' => $credential->id,
                'request_id' => $requestId,
                'method' => $request->method(),
                'path' => substr($request->path(), 0, 255),
                'status_code' => $response->getStatusCode(),
                'duration_ms' => $durationMs,
            ]);
        } catch (\Throwable $e) {
            // Silently ignore log write errors
        }

        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
