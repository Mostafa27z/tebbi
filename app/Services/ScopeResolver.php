<?php

namespace App\Services;

use App\Models\Facility;
use App\Models\Group;
use App\Models\User;
use Illuminate\Support\Collection;

class ScopeResolver
{
    /**
     * Get IDs of all facilities the user has access to manage or view.
     */
    public function accessibleFacilityIds(User $user): Collection
    {
        if ($user->isSuperAdmin()) {
            return Facility::pluck('id');
        }

        $groupAdminGroupIds = $user->roleAssignments()
            ->where('role', 'group_admin')
            ->where('scope_type', 'group')
            ->pluck('scope_id');

        $facilitiesFromGroups = Facility::whereIn('group_id', $groupAdminGroupIds)->pluck('id');

        $directFacilities = $user->roleAssignments()
            ->whereIn('role', ['facility_admin', 'receptionist'])
            ->where('scope_type', 'facility')
            ->pluck('scope_id');

        // Doctors have access to the facilities where they are assigned
        $doctorFacilities = collect();
        if ($user->doctorProfile) {
            $doctorFacilities = $user->doctorProfile->doctorFacilities()
                ->where('is_active', true)
                ->pluck('facility_id');
        }

        return $facilitiesFromGroups
            ->concat($directFacilities)
            ->concat($doctorFacilities)
            ->unique()
            ->values();
    }

    /**
     * Get IDs of all groups the user has administrative access to.
     */
    public function accessibleGroupIds(User $user): Collection
    {
        if ($user->isSuperAdmin()) {
            return Group::pluck('id');
        }

        return $user->roleAssignments()
            ->where('role', 'group_admin')
            ->where('scope_type', 'group')
            ->pluck('scope_id')
            ->unique()
            ->values();
    }

    /**
     * Check if user can manage a specific facility.
     */
    public function canManageFacility(User $user, int $facilityId): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        $facility = Facility::find($facilityId);
        if (!$facility) {
            return false;
        }

        // Group admin for this facility's group
        if ($user->isGroupAdmin($facility->group_id)) {
            return true;
        }

        // Direct facility admin
        return $user->roleAssignments()
            ->where('role', 'facility_admin')
            ->where('scope_type', 'facility')
            ->where('scope_id', $facilityId)
            ->exists();
    }

    /**
     * Check if user can manage a specific medical group.
     */
    public function canManageGroup(User $user, int $groupId): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->isGroupAdmin($groupId);
    }
}

