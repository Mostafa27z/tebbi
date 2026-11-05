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
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'demoAccounts' => (! app()->isProduction() && config('app.allow_demo_login', false)) ? [
                [
                    'role' => 'doctor',
                    'name' => 'د. عبدالمحسن الشمري (استشاري أسنان)',
                    'email' => 'dr.shammary@tebiby.com',
                    'badge' => 'طبيب',
                    'icon' => 'stethoscope',
                ],
                [
                    'role' => 'patient',
                    'name' => 'محمد فهد الدوسري (مريض - بوبا)',
                    'email' => 'patient@tebiby.com',
                    'badge' => 'مريض',
                    'icon' => 'user',
                ],
                [
                    'role' => 'admin',
                    'name' => 'المشرف العام للمنصة',
                    'email' => 'admin@tebiby.com',
                    'badge' => 'مدير النظام',
                    'icon' => 'shield',
                ],
            ] : [],
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
