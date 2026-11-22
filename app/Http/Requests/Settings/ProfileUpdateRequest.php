<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'national_id' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'in:male,female'],
            'dob' => ['nullable', 'date'],
        ];

        if ($this->user()->role === 'doctor') {
            $rules = array_merge($rules, [
                'title_ar' => ['nullable', 'string', 'max:255'],
                'subspecialty' => ['nullable', 'string', 'max:255'],
                'bio' => ['nullable', 'string', 'max:2000'],
                'experience_years' => ['nullable', 'integer', 'min:0', 'max:70'],
                'consultation_fee' => ['nullable', 'numeric', 'min:0'],
                'waiting_time_minutes' => ['nullable', 'integer', 'min:1', 'max:240'],
                'license_no' => ['nullable', 'string', 'max:100'],
                'slot_auto_confirm_limit' => ['nullable', 'integer', 'min:1', 'max:50'],
                'slot_waitlist_limit' => ['nullable', 'integer', 'min:0', 'max:50'],
            ]);
        }

        return $rules;
    }

    /**
     * Custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'الاسم',
            'email' => 'البريد الإلكتروني',
            'phone' => 'رقم الهاتف',
            'national_id' => 'رقم الهوية / الإقامة',
            'gender' => 'الجنس',
            'dob' => 'تاريخ الميلاد',
            'title_ar' => 'اللقب الطبي',
            'subspecialty' => 'التخصص الدقيق',
            'bio' => 'النبذة التعريفية',
            'experience_years' => 'سنوات الخبرة',
            'consultation_fee' => 'سعر الكشف',
            'waiting_time_minutes' => 'متوسط وقت الكشف',
            'license_no' => 'رقم ترخيص مزاولة المهنة',
            'slot_auto_confirm_limit' => 'الحد الأقصى للتأكيد التلقائي',
            'slot_waitlist_limit' => 'الحد الأقصى لقائمة الانتظار',
        ];
    }
}
