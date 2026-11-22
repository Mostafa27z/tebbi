<?php

namespace App\Http\Middleware\Connect;

use App\Models\ConnectCredential;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConnectCors
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');

        // If preflight request
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 204);
            return $this->applyCorsHeaders($response, $origin);
        }

        $response = $next($request);

        if ($origin) {
            $this->applyCorsHeaders($response, $origin);
        }

        return $response;
    }

    protected function applyCorsHeaders(Response $response, ?string $origin): Response
    {
        if (! $origin) {
            return $response;
        }

        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Authorization, X-Publishable-Key, Content-Type, X-Request-Id, Idempotency-Key');
        $response->headers->set('Access-Control-Max-Age', '86400');
        $response->headers->set('Vary', 'Origin');

        return $response;
    }
}
