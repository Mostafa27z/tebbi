<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::prefix('connect/v1')
                ->as('connect.')
                ->group(base_path('routes/connect.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'connect.auth' => \App\Http\Middleware\Connect\ConnectAuthenticate::class,
            'connect.scope' => \App\Http\Middleware\Connect\CheckConnectScope::class,
            'connect.boot_guard' => \App\Http\Middleware\Connect\ConnectBootGuard::class,
            'connect.cors' => \App\Http\Middleware\Connect\ConnectCors::class,
            'connect.db_guard' => \App\Http\Middleware\Connect\HandleConnectDatabaseExceptions::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Redacted report for ConnectQueryException only
        $exceptions->reportable(function (\App\Exceptions\Connect\ConnectQueryException $e) {
            \Illuminate\Support\Facades\Log::channel('connect')->error('[REDACTED_SQL] Connect Database Error', [
                'code' => $e->getCode(),
                'error_id' => $e->getErrorId(),
                'context_id' => $e->getContextId(),
            ]);
        })->stop();

        // RFC 7807 problem+json render handler for Connect requests
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            $connectHost = config('connect.host');
            $isConnect = (! empty($connectHost) && $request->getHost() === $connectHost)
                || $request->routeIs('connect.*')
                || $request->is('connect/*');

            if (! $isConnect) {
                return null; // Let Laravel and Inertia handle non-Connect web requests untouched
            }

            $requestId = $request->attributes->get('connect_request_id') ?? (string) \Illuminate\Support\Str::uuid();
            $timestamp = now()->toIso8601String();

            // 1. ValidationException
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                $invalidParams = [];
                $ruleMap = [
                    'required' => 'Field is required',
                    'required_if' => 'Field is required under current conditions',
                    'regex' => 'Invalid format',
                    'date' => 'Must be a valid date in YYYY-MM-DD format',
                    'date_format' => 'Invalid date format',
                    'after' => 'Date must be after the specified date',
                    'after_or_equal' => 'Date must not be in the past',
                    'in' => 'Selected value is not permitted',
                    'string' => 'Must be a string',
                    'integer' => 'Must be an integer',
                    'numeric' => 'Must be numeric',
                    'max' => 'Value exceeds maximum allowed length',
                    'min' => 'Value does not meet minimum allowed length',
                    'array' => 'Must be an array',
                    'exists' => 'Referenced resource does not exist',
                    'unique' => 'Value has already been taken',
                    'boolean' => 'Must be a boolean',
                    'uuid' => 'Must be a valid UUID',
                    'email' => 'Must be a valid email address',
                ];

                $failedRules = $e->validator ? $e->validator->failed() : [];
                if (! empty($failedRules)) {
                    foreach ($failedRules as $field => $rules) {
                        $ruleName = strtolower(key($rules));
                        $invalidParams[] = [
                            'name' => $field,
                            'reason' => $ruleMap[$ruleName] ?? 'Invalid field value',
                        ];
                    }
                } else {
                    foreach ($e->errors() as $field => $messages) {
                        $invalidParams[] = [
                            'name' => $field,
                            'reason' => 'Invalid field value',
                        ];
                    }
                }

                return response()->json([
                    'type' => 'https://api.tebiby.com/errors/ERR_VALIDATION_FAILED',
                    'title' => 'Validation Failed',
                    'status' => 422,
                    'code' => 'ERR_VALIDATION_FAILED',
                    'detail' => 'بيانات الطلب غير صالحة، يرجى مراجعة المدخلات والتصحيح.',
                    'request_id' => $requestId,
                    'timestamp' => $timestamp,
                    'invalid_params' => $invalidParams,
                ], 422, ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }

            // 2. ModelNotFoundException -> 404
            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json([
                    'type' => 'https://api.tebiby.com/errors/ERR_RESOURCE_NOT_FOUND',
                    'title' => 'Resource Not Found',
                    'status' => 404,
                    'code' => 'ERR_RESOURCE_NOT_FOUND',
                    'detail' => 'المورد المطلوب غير موجود أو يتبع لمنشأة غير مشمولة في صلاحيات مفتاحك.',
                    'request_id' => $requestId,
                    'timestamp' => $timestamp,
                ], 404, ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }

            // 3. ConnectDomainException
            if ($e instanceof \App\Exceptions\Connect\ConnectDomainException) {
                $payload = [
                    'type' => 'https://api.tebiby.com/errors/' . $e->getErrorCode(),
                    'title' => $e->getErrorTitle(),
                    'status' => $e->getStatusCode(),
                    'code' => $e->getErrorCode(),
                    'detail' => $e->getSanitizedDetail(),
                    'request_id' => $requestId,
                    'timestamp' => $timestamp,
                ];

                if (! empty($e->getInvalidParams())) {
                    $payload['invalid_params'] = $e->getInvalidParams();
                }

                return response()->json($payload, $e->getStatusCode(), ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }

            // 4. AuthenticationException & AuthorizationException
            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return response()->json([
                    'type' => 'https://api.tebiby.com/errors/ERR_UNAUTHORIZED',
                    'title' => 'Unauthorized',
                    'status' => 401,
                    'code' => 'ERR_UNAUTHORIZED',
                    'detail' => 'مفتاح API غير صالح، منتهي الصلاحية، أو مفقود.',
                    'request_id' => $requestId,
                    'timestamp' => $timestamp,
                ], 401, ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }

            if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                return response()->json([
                    'type' => 'https://api.tebiby.com/errors/ERR_FORBIDDEN_SCOPE',
                    'title' => 'Forbidden Scope',
                    'status' => 403,
                    'code' => 'ERR_FORBIDDEN_SCOPE',
                    'detail' => 'المفتاح يفتقر للصلاحية المطلوبة لتنفيذ هذا الإجراء على المنشأة المحددة.',
                    'request_id' => $requestId,
                    'timestamp' => $timestamp,
                ], 403, ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }

            // 5. ConnectQueryException -> 500
            if ($e instanceof \App\Exceptions\Connect\ConnectQueryException) {
                return response()->json([
                    'type' => 'https://api.tebiby.com/errors/ERR_INTERNAL_SERVER',
                    'title' => 'Internal Database Error',
                    'status' => 500,
                    'code' => 'ERR_INTERNAL_SERVER',
                    'detail' => 'حدث خطأ أثناء معالجة البيانات، تم تسجيل الحادثة للمراجعة.',
                    'request_id' => $requestId,
                    'timestamp' => $timestamp,
                ], 500, ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }

            // 6. Generic Symfony HttpException
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $genericMap = [
                    400 => ['ERR_BAD_REQUEST', 'Bad Request', 'صيغة الطلب غير صحيحة أو البيانات المشفرة تالفة.'],
                    404 => ['ERR_RESOURCE_NOT_FOUND', 'Not Found', 'المسار أو المورد المطلوب غير موجود.'],
                    405 => ['ERR_METHOD_NOT_ALLOWED', 'Method Not Allowed', 'طريقة الطلب غير مدعومة لهذا المسار.'],
                    409 => ['ERR_CONFLICT', 'Conflict', 'تعارض في معالجة الطلب، يرجى إعادة المحاولة.'],
                    429 => ['ERR_RATE_LIMIT_EXCEEDED', 'Too Many Requests', 'تم تجاوز معدل الطلبات المسموح به.'],
                    501 => ['ERR_NOT_IMPLEMENTED', 'Not Implemented', 'هذا المسار محجوز لمرحلة قادمة.'],
                ];
                [$code, $title, $detail] = $genericMap[$status] ?? ['ERR_INTERNAL_SERVER', 'Error', 'حدث خطأ أثناء معالجة الطلب.'];

                return response()->json([
                    'type' => "https://api.tebiby.com/errors/{$code}",
                    'title' => $title,
                    'status' => $status,
                    'code' => $code,
                    'detail' => $detail,
                    'request_id' => $requestId,
                    'timestamp' => $timestamp,
                ], $status, ['Content-Type' => 'application/problem+json; charset=utf-8']);
            }

            // 7. Default 500 fallback
            return response()->json([
                'type' => 'https://api.tebiby.com/errors/ERR_INTERNAL_SERVER',
                'title' => 'Internal Server Error',
                'status' => 500,
                'code' => 'ERR_INTERNAL_SERVER',
                'detail' => 'حدث خطأ داخلي غير متوقع في محرك المعالجة. يرجى التواصل مع الدعم الفني وتزويدهم بمعرف الطلب.',
                'request_id' => $requestId,
                'timestamp' => $timestamp,
            ], 500, ['Content-Type' => 'application/problem+json; charset=utf-8']);
        });
    })->create();
