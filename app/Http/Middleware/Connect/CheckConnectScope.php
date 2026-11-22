<?php

namespace App\Http\Middleware\Connect;

use App\Exceptions\Connect\ForbiddenScopeException;
use App\Models\ConnectCredential;
use App\Models\Facility;
use Closure;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckConnectScope
{
    public function handle(Request $request, Closure $next, string $action): Response
    {
        /** @var ConnectCredential|null $credential */
        $credential = $request->attributes->get('connect_credential');

        if (! $credential) {
            throw new ForbiddenScopeException('لا توجد بيانات اعتماد صالحة مرفقة بالطلب.');
        }

        // Determine target facility
        $facilityId = $request->route('facility_id')
            ?? $request->route('facility')?->id
            ?? $request->route('facility')
            ?? $request->input('facility_id')
            ?? $request->attributes->get('connect_booking_intent')?->facility_id;

        if ($facilityId === null && ($bookingRef = ($request->route('booking_reference') ?? $request->input('booking_reference')))) {
            $facilityId = \App\Models\Appointment::where('booking_reference', $bookingRef)->value('facility_id');
        }

        if ($facilityId === null && $credential->owner_type === 'App\Models\Facility') {
            $facilityId = $credential->owner_id;
        }

        if ($facilityId !== null) {
            $facility = Facility::find($facilityId);

            if (! $facility) {
                throw new ModelNotFoundException("Facility [{$facilityId}] not found.");
            }

            // Anti-enumeration: if credential belongs to a Group, ensure facility belongs to that Group
            if ($credential->owner_type === 'App\Models\Group' && (int) $facility->group_id !== (int) $credential->owner_id) {
                throw new ModelNotFoundException('Resource not found or outside permitted scope.');
            }

            // If credential belongs directly to a Facility, ensure it matches
            if ($credential->owner_type === 'App\Models\Facility' && (int) $facility->id !== (int) $credential->owner_id) {
                throw new ModelNotFoundException('Resource not found or outside permitted scope.');
            }

            // Verify specific scope for this facility
            if (! $credential->hasScope($facility->id, $action)) {
                throw new ForbiddenScopeException(
                    "المفتاح يفتقر لصلاحية [{$action}] المطلوبة للمنشأة [{$facility->id}]."
                );
            }
        } else {
            // General query (e.g. catalog list across facilities)
            if (! $credential->hasScope(null, $action)) {
                throw new ForbiddenScopeException("المفتاح يفتقر لصلاحية [{$action}] العامة.");
            }
        }

        return $next($request);
    }
}
