<?php

namespace App\Http\Controllers\Connect;

use App\Http\Controllers\Controller;
use App\Models\ConnectCredential;
use App\Models\Facility;
use App\Services\ScopeResolver;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;

class CredentialController extends Controller
{
    private const LIFESPAN_MAP = [
        '30_days' => 30,
        '90_days' => 90,
        '180_days' => 180,
        '270_days' => 270,
        '365_days' => 365,
    ];

    private const LIFESPAN_LABELS = [
        '30_days' => '30 يوماً (شهر واحد)',
        '90_days' => '90 يوماً (3 أشهر)',
        '180_days' => '180 يوماً (6 أشهر)',
        '270_days' => '270 يوماً (9 أشهر)',
        '365_days' => '365 يوماً (سنة كاملة)',
    ];

    /**
     * Store a live credential for a facility by facility admin.
     * Note: Facility Admin is strictly limited to creating LIVE keys.
     */
    public function storeForFacility(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isSuperAdmin() && ! $user->isGroupAdmin() && ! $user->isFacilityAdmin()) {
            abort(403, 'غير مصرح لك بإدارة مفاتيح الربط البرمجي للمنشأة.');
        }

        $validated = $request->validate([
            'facility_id' => ['nullable', 'integer', 'exists:facilities,id'],
            'integration_name' => ['required', 'string', 'max:100'],
            'lifespan' => ['required', Rule::in(array_keys(self::LIFESPAN_MAP))],
        ], [
            'integration_name.required' => 'يرجى إدخال اسم النظام أو المنظومة المرتبطة.',
            'lifespan.required' => 'يرجى تحديد مدة صلاحية المفتاح البرمجي.',
        ]);

        $resolver = new ScopeResolver();
        $accessibleIds = $resolver->accessibleFacilityIds($user);

        $facilityId = $validated['facility_id'] ?? null;
        if (! $facilityId || ! $accessibleIds->contains((int) $facilityId)) {
            $facilityId = $accessibleIds->first();
        }

        if (! $facilityId) {
            abort(404, 'لا توجد منشأة طبية صالحة لإصدار مفتاح الربط لها.');
        }

        $facility = Facility::findOrFail($facilityId);

        // Facility Admin can ONLY create LIVE credentials
        $environment = 'live';
        $days = self::LIFESPAN_MAP[$validated['lifespan']];
        $expiresAt = Carbon::now()->addDays($days);

        $keyPair = ConnectCredential::generateKeyPair($environment);

        $credential = ConnectCredential::create([
            'owner_type' => Facility::class,
            'owner_id' => $facility->id,
            'integration_name' => $validated['integration_name'],
            'environment' => $environment,
            'pk_prefix' => $keyPair['pk_prefix'],
            'pk_display' => $keyPair['pk'],
            'pk_hash' => $keyPair['pk_hash'],
            'sk_prefix' => $keyPair['sk_prefix'],
            'sk_encrypted' => Crypt::encryptString($keyPair['sk']),
            'sk_hash' => $keyPair['sk_hash'],
            'scopes' => [
                (string) $facility->id => ['read', 'book', 'cancel', 'facility_wide'],
            ],
            'status' => 'active',
            'expires_at' => $expiresAt,
        ]);

        return redirect()->back()->with('flash_credential', [
            'id' => $credential->id,
            'pk' => $keyPair['pk'],
            'sk' => $keyPair['sk'],
            'integration_name' => $credential->integration_name,
            'environment' => 'live',
            'facility_name' => $facility->name_ar ?? $facility->name ?? 'المنشأة الطبية',
            'expires_at' => $expiresAt->format('Y-m-d'),
            'lifespan_label' => self::LIFESPAN_LABELS[$validated['lifespan']],
        ])->with('success', 'تم إنشاء وتفعيل مفتاح الربط المباشر (Live API Key) بنجاح.');
    }

    /**
     * Store credential for any facility by Super Admin.
     * Super Admin can choose Live OR Sandbox environment.
     */
    public function storeForAdmin(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isSuperAdmin()) {
            abort(403, 'غير مصرح لك بإدارة مفاتيح الربط البرمجي كمسؤول منصة.');
        }

        $validated = $request->validate([
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'environment' => ['required', Rule::in(['live', 'sandbox'])],
            'integration_name' => ['required', 'string', 'max:100'],
            'lifespan' => ['required', Rule::in(array_keys(self::LIFESPAN_MAP))],
        ], [
            'facility_id.required' => 'يرجى اختيار المنشأة الطبية المستهدفة.',
            'environment.required' => 'يرجى تحديد بيئة المفتاح (Live أو Sandbox).',
            'integration_name.required' => 'يرجى إدخال اسم الجهة أو النظام المربوط.',
            'lifespan.required' => 'يرجى تحديد مدة صلاحية المفتاح.',
        ]);

        $facility = Facility::findOrFail($validated['facility_id']);
        $days = self::LIFESPAN_MAP[$validated['lifespan']];
        $expiresAt = Carbon::now()->addDays($days);

        $keyPair = ConnectCredential::generateKeyPair($validated['environment']);

        $credential = ConnectCredential::create([
            'owner_type' => Facility::class,
            'owner_id' => $facility->id,
            'integration_name' => $validated['integration_name'],
            'environment' => $validated['environment'],
            'pk_prefix' => $keyPair['pk_prefix'],
            'pk_display' => $keyPair['pk'],
            'pk_hash' => $keyPair['pk_hash'],
            'sk_prefix' => $keyPair['sk_prefix'],
            'sk_encrypted' => Crypt::encryptString($keyPair['sk']),
            'sk_hash' => $keyPair['sk_hash'],
            'scopes' => [
                (string) $facility->id => ['read', 'book', 'cancel', 'facility_wide'],
            ],
            'status' => 'active',
            'expires_at' => $expiresAt,
        ]);

        return redirect()->back()->with('flash_credential', [
            'id' => $credential->id,
            'pk' => $keyPair['pk'],
            'sk' => $keyPair['sk'],
            'integration_name' => $credential->integration_name,
            'environment' => $validated['environment'],
            'facility_name' => $facility->name_ar ?? $facility->name ?? 'المنشأة الطبية',
            'expires_at' => $expiresAt->format('Y-m-d'),
            'lifespan_label' => self::LIFESPAN_LABELS[$validated['lifespan']],
        ])->with('success', 'تم إنشاء وتفعيل مفتاح الربط البرمجي بنجاح.');
    }

    /**
     * Revoke an active credential.
     */
    public function revoke(Request $request, ConnectCredential $credential): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isSuperAdmin()) {
            $resolver = new ScopeResolver();
            $accessibleIds = $resolver->accessibleFacilityIds($user);
            if (! $accessibleIds->contains((int) $credential->owner_id)) {
                abort(403, 'غير مصرح لك بإلغاء مفتاح هذه المنشأة.');
            }
        }

        $credential->update(['status' => 'revoked']);

        return redirect()->back()->with('success', 'تم إلغاء تفعيل مفتاح الربط البرمجي بنجاح.');
    }

    /**
     * Delete a credential completely.
     */
    public function destroy(Request $request, ConnectCredential $credential): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isSuperAdmin()) {
            $resolver = new ScopeResolver();
            $accessibleIds = $resolver->accessibleFacilityIds($user);
            if (! $accessibleIds->contains((int) $credential->owner_id)) {
                abort(403, 'غير مصرح لك بحذف مفتاح هذه المنشأة.');
            }
        }

        $credential->delete();

        return redirect()->back()->with('success', 'تم حذف مفتاح الربط البرمجي نهائياً.');
    }
}
