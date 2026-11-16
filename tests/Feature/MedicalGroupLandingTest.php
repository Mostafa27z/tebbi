<?php

namespace Tests\Feature;

use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Group;
use App\Models\User;
use Database\Seeders\TebibySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MedicalGroupLandingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TebibySeeder::class);
    }

    public function test_medical_group_public_landing_loads_successfully_by_slug(): void
    {
        $group = Group::where('slug', 'habeeb-medical-group')->firstOrFail();

        $response = $this->get("/group/{$group->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('group/public-landing')
            ->has('group')
            ->has('facilities')
            ->has('doctors')
            ->has('specialties')
            ->has('stats')
            ->where('group.slug', $group->slug)
        );
    }

    public function test_medical_group_plural_route_redirects_to_canonical(): void
    {
        $group = Group::where('slug', 'habeeb-medical-group')->firstOrFail();

        $response = $this->get("/groups/{$group->slug}");

        $response->assertRedirect("/group/{$group->slug}");
    }

    public function test_admin_can_create_group_with_custom_slug(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();

        $response = $this->actingAs($admin)->post('/admin/groups', [
            'name_ar' => 'مجموعة الأمل الطبية',
            'name_en' => 'Al-Amal Medical Group',
            'slug' => 'al-amal-care',
            'cr_number' => '1010998877',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('groups', [
            'name_ar' => 'مجموعة الأمل الطبية',
            'slug' => 'al-amal-care',
        ]);

        $publicResponse = $this->get('/group/al-amal-care');
        $publicResponse->assertStatus(200);
    }

    public function test_admin_can_update_group_slug(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();
        $group = Group::firstOrFail();

        $response = $this->actingAs($admin)->put("/admin/groups/{$group->id}", [
            'name_ar' => $group->name_ar,
            'name_en' => $group->name_en,
            'slug' => 'habeeb-flagship-group',
            'cr_number' => $group->cr_number,
            'status' => 'active',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('groups', [
            'id' => $group->id,
            'slug' => 'habeeb-flagship-group',
        ]);

        $newPublicResponse = $this->get('/group/habeeb-flagship-group');
        $newPublicResponse->assertStatus(200);
    }

    public function test_non_existent_group_slug_returns_404(): void
    {
        $response = $this->get('/group/non-existent-group-slug-404');
        $response->assertStatus(404);
    }
}
