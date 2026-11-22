<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\DoctorProfile;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        if ($user->role === 'doctor') {
            $user->loadMissing(['doctorProfile.specialty', 'doctorProfile.clinic']);
        } else {
            $user->loadMissing('roleAssignments');
        }

        $returnUrl = match (true) {
            $user->isSuperAdmin() => '/admin/analytics',
            $user->isGroupAdmin() => '/group/dashboard',
            $user->isFacilityAdmin() || $user->isReceptionist() => '/facility/dashboard',
            $user->role === 'doctor' => '/doctor/dashboard',
            default => '/patient/portal',
        };

        $returnLabel = match (true) {
            $user->isSuperAdmin() => 'لوحة إدارة المنصة',
            $user->isGroupAdmin() => 'لوحة إدارة المجمع الطبي',
            $user->isFacilityAdmin() => 'لوحة إدارة المنشأة الطبية',
            $user->isReceptionist() => 'لوحة الاستقبال والعيادات',
            $user->role === 'doctor' => 'لوحة تحكم الطبيب',
            default => 'بوابة المريض والملف الطبي',
        };

        return Inertia::render('settings/profile', [
            'profileUser' => $user,
            'doctorProfile' => $user->role === 'doctor' ? $user->doctorProfile : null,
            'returnUrl' => $returnUrl,
            'returnLabel' => $returnLabel,
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? $user->phone,
            'national_id' => $validated['national_id'] ?? $user->national_id,
            'gender' => $validated['gender'] ?? $user->gender,
            'dob' => $validated['dob'] ?? $user->dob,
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($user->role === 'doctor') {
            $doctorData = array_filter([
                'title_ar' => $validated['title_ar'] ?? null,
                'subspecialty' => $validated['subspecialty'] ?? null,
                'bio' => $validated['bio'] ?? null,
                'experience_years' => isset($validated['experience_years']) ? (int) $validated['experience_years'] : null,
                'consultation_fee' => isset($validated['consultation_fee']) ? (float) $validated['consultation_fee'] : null,
                'waiting_time_minutes' => isset($validated['waiting_time_minutes']) ? (int) $validated['waiting_time_minutes'] : null,
                'license_no' => $validated['license_no'] ?? null,
                'slot_auto_confirm_limit' => isset($validated['slot_auto_confirm_limit']) ? (int) $validated['slot_auto_confirm_limit'] : null,
                'slot_waitlist_limit' => isset($validated['slot_waitlist_limit']) ? (int) $validated['slot_waitlist_limit'] : null,
            ], fn($val) => !is_null($val));

            if (!empty($doctorData)) {
                $user->doctorProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    $doctorData
                );
            }
        }

        return to_route('profile.edit')->with('success', 'تم حفظ وتحديث بيانات الملف الشخصي بنجاح');
    }

    /**
     * Upload or update user avatar.
     */
    public function uploadAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
        ], [
            'avatar.required' => 'يرجى اختيار ملف صورة صالح.',
            'avatar.image' => 'يجب أن يكون الملف صورة صحيحة.',
            'avatar.mimes' => 'صيغ الصور المسموحة هي: jpeg, png, jpg, webp.',
            'avatar.max' => 'الحد الأقصى لحجم الصورة هو 3 ميجابايت.',
        ]);

        $user = $request->user();

        // Delete old avatar if stored locally
        if ($user->avatar && str_starts_with($user->avatar, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $user->avatar);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar = '/storage/' . $path;
        $user->save();

        return to_route('profile.edit')->with('success', 'تم تحديث صورتك الشخصية بنجاح');
    }

    /**
     * Delete user avatar and revert to default initials.
     */
    public function deleteAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar && str_starts_with($user->avatar, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $user->avatar);
            Storage::disk('public')->delete($oldPath);
        }

        $user->avatar = null;
        $user->save();

        return to_route('profile.edit')->with('success', 'تمت إزالة الصورة الشخصية واستعادة المظهر الافتراضي بنجاح');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
