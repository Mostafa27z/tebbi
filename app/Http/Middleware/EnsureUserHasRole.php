<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! in_array($user->role, $roles)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'غير مصرح لك بالوصول إلى هذه الصفحة أو تنفيذ هذا الإجراء.',
                ], 403);
            }

            // Redirect user to their own dedicated area based on their role
            return match ($user->role) {
                'doctor' => redirect()->route('doctor.dashboard')->with('error', 'ليس لديك صلاحية للوصول إلى تلك الصفحة.'),
                'admin' => redirect()->route('admin.analytics')->with('error', 'ليس لديك صلاحية للوصول إلى تلك الصفحة.'),
                default => redirect()->route('patient.portal')->with('error', 'ليس لديك صلاحية للوصول إلى تلك الصفحة.'),
            };
        }

        // Prevent unapproved doctors from accessing active clinical queues
        if ($user->role === 'doctor' && in_array('doctor', $roles)) {
            if ($user->doctorProfile && ! $user->doctorProfile->is_available_today) {
                return redirect()->route('dashboard')->with('error', 'طلب انضمامك كطبيب قيد التدقيق المهني والاعتماد.');
            }
        }

        return $next($request);
    }
}

