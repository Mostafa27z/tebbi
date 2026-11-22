<?php

namespace App\Services\Connect;

use App\Models\ConnectCredential;
use App\Models\ConnectIdempotencyKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IdempotencyService
{
    /**
     * Verify or initialize an idempotency key lock.
     *
     * @return array [bool $isReplay, ?JsonResponse $cachedResponse, ?ConnectIdempotencyKey $record]
     */
    public function check(Request $request, ConnectCredential $credential): array
    {
        $idempotencyKey = $request->header('Idempotency-Key');

        if (empty($idempotencyKey)) {
            abort(response()->json([
                'type' => 'https://connect.tebiby.com/errors/err-idempotency-key-required',
                'title' => 'Idempotency Key Required',
                'status' => 400,
                'detail' => 'The Idempotency-Key header is required for state-mutating requests.',
                'code' => 'ERR_IDEMPOTENCY_KEY_REQUIRED',
            ], 400, ['Content-Type' => 'application/problem+json']));
        }

        $requestHash = hash('sha256', json_encode($request->all()));
        $requestPath = $request->path();

        /** @var ConnectIdempotencyKey|null $existing */
        $existing = ConnectIdempotencyKey::where('credential_id', $credential->id)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing) {
            if ($existing->status === 'completed') {
                if ($existing->request_hash !== $requestHash) {
                    abort(response()->json([
                        'type' => 'https://connect.tebiby.com/errors/err-payload-mismatch',
                        'title' => 'Payload Mismatch',
                        'status' => 422,
                        'detail' => 'The request payload does not match the original request for this Idempotency-Key.',
                        'code' => 'ERR_PAYLOAD_MISMATCH',
                    ], 422, ['Content-Type' => 'application/problem+json']));
                }

                $headers = $existing->response_headers ?? [];
                $headers['Idempotent-Replay'] = 'true';
                $headers['X-Cache-Lookup'] = 'HIT';

                return [
                    true,
                    response()->json($existing->response_body, $existing->response_status ?: 200, $headers),
                    $existing,
                ];
            }

            if ($existing->status === 'in_progress') {
                if ($existing->locked_at && $existing->locked_at->isAfter(now()->subSeconds(30))) {
                    abort(response()->json([
                        'type' => 'https://connect.tebiby.com/errors/err-conflict-in-flight',
                        'title' => 'Request In Flight',
                        'status' => 409,
                        'detail' => 'A matching request with this Idempotency-Key is currently being processed.',
                        'code' => 'ERR_CONFLICT_IN_FLIGHT',
                    ], 409, ['Content-Type' => 'application/problem+json']));
                }
            }
        }

        // Initialize lock record
        $record = ConnectIdempotencyKey::updateOrCreate(
            [
                'credential_id' => $credential->id,
                'idempotency_key' => $idempotencyKey,
            ],
            [
                'request_path' => $requestPath,
                'request_hash' => $requestHash,
                'status' => 'in_progress',
                'locked_at' => now(),
                'expires_at' => now()->addHours(24),
            ]
        );

        return [false, null, $record];
    }

    /**
     * Mark idempotency record as completed with cached response.
     */
    public function recordCompleted(ConnectIdempotencyKey $record, int $status, array $body, array $headers = []): void
    {
        $record->update([
            'response_status' => $status,
            'response_body' => $body,
            'response_headers' => $headers,
            'status' => 'completed',
            'locked_at' => null,
        ]);
    }
}

