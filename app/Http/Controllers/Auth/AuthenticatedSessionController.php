<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        // For development/demo mode, pull sample accounts dynamically from the database
        $demoAccounts = [];
        if (! app()->isProduction() && config('app.allow_demo_login', false)) {
            $roles = ['doctor', 'patient', 'admin'];
            foreach ($roles as $role) {
                $user = \App\Models\User::with('doctorProfile.specialty')->where('role', $role)->first();
                if ($user) {
                    $demoAccounts[] = [
                        'role' => $user->role,
                        'name' => $user->name . ($user->doctorProfile ? ' (' . ($user->doctorProfile->title_ar ?: 'طبيب معتمد') . ')' : ''),
                        'email' => $user->email,
                        'badge' => match ($user->role) {
                            'doctor' => 'طبيب',
                            'admin' => 'مدير النظام',
                            default => 'مريض',
                        },
                        'icon' => match ($user->role) {
                            'doctor' => 'stethoscope',
                            'admin' => 'shield',
                            default => 'user',
                        },
                    ];
                }
            }
        }

        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'demoAccounts' => $demoAccounts,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();

        if ($user && $user->role === 'doctor') {
            return redirect()->intended(route('doctor.dashboard', absolute: false));
        }

        if ($user && $user->role === 'admin') {
            return redirect()->intended(route('admin.analytics', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'تم تسجيل الخروج بنجاح.');
    }
}
