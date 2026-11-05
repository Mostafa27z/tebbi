<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register', [
            'specialties' => Specialty::all(),
            'clinics' => Clinic::where('is_active', true)->get(),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $role = $request->input('role', 'patient');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|in:patient,doctor',
            'national_id' => 'nullable|string|max:20',
            'specialty_id' => 'nullable|required_if:role,doctor|exists:specialties,id',
            'clinic_id' => 'nullable|required_if:role,doctor|exists:clinics,id',
            'title_ar' => 'nullable|required_if:role,doctor|string|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone ?? '0500000000',
            'role' => $role,
            'national_id' => $request->national_id,
            'password' => Hash::make($request->password),
            'avatar' => $role === 'doctor'
                ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=faces'
                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
        ]);

        if ($role === 'doctor') {
            DoctorProfile::create([
                'user_id' => $user->id,
                'specialty_id' => $request->specialty_id ?? Specialty::first()->id,
                'clinic_id' => $request->clinic_id ?? Clinic::first()->id,
                'title_ar' => $request->title_ar ?? 'طبيب متقدم للاعتماد',
                'subspecialty' => 'طلب انضمام جديد قيد المراجعة والتدقيق المهني',
                'bio' => 'طبيب مسجل قيد اعتماد الترخيص المهني من إدارة المنصة.',
                'experience_years' => 1,
                'consultation_fee' => 200.00,
                'rating' => 5.0,
                'review_count' => 0,
                'waiting_time_minutes' => 15,
                'accepts_insurance' => false,
                'accepted_insurances' => [],
                'is_available_today' => false, // Requires admin verification before practicing
            ]);
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
