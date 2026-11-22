<?php

namespace Tests\Feature\Connect;

use App\Models\ConnectCredential;
use App\Models\Group;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class Rfc7807ExceptionHandlerTest extends TestCase
{
    use RefreshDatabase;

    private function getValidSk(): string
    {
        $group = Group::factory()->create();
        $keys = ConnectCredential::generateKeyPair('sandbox');
        ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'RFC Test App',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => ['*' => ['*']],
            'status' => 'active',
        ]);

        return $keys['sk'];
    }

    public function test_validation_exception_returns_problem_json_on_connect_and_redirect_on_web(): void
    {
        $sk = $this->getValidSk();

        // Connect request: returns 422 application/problem+json
        $connectResponse = $this->withHeader('Authorization', 'Bearer ' . $sk)
            ->postJson(route('connect.test.validation'), []);

        $connectResponse->assertStatus(422);
        $connectResponse->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $connectResponse->assertJsonStructure([
            'type',
            'title',
            'status',
            'code',
            'detail',
            'request_id',
            'timestamp',
            'invalid_params' => [
                '*' => ['name', 'reason'],
            ],
        ]);
        $connectResponse->assertJson([
            'code' => 'ERR_VALIDATION_FAILED',
            'status' => 422,
        ]);

        // Web request: returns 302 redirect with session errors (Inertia/standard web behavior untouched)
        $webResponse = $this->post(route('appointments.book'), []);
        $webResponse->assertStatus(302);
        $webResponse->assertSessionHasErrors(['doctor_id', 'patient_name', 'patient_phone']);
        $this->assertFalse($webResponse->headers->contains('Content-Type', 'application/problem+json'));
    }

    public function test_model_not_found_returns_problem_json_on_connect_and_html_on_web(): void
    {
        $sk = $this->getValidSk();

        // Connect request: returns 404 application/problem+json
        $connectResponse = $this->withHeader('Authorization', 'Bearer ' . $sk)
            ->getJson(route('connect.doctors.index', ['facility_id' => 99999]));

        $connectResponse->assertStatus(404);
        $connectResponse->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $connectResponse->assertJson([
            'code' => 'ERR_RESOURCE_NOT_FOUND',
            'status' => 404,
        ]);

        // Web request: non-existent page returns standard 404 HTML (not application/problem+json)
        $webResponse = $this->get('/non-existent-web-page-test-12345');
        $webResponse->assertStatus(404);
        $this->assertFalse($webResponse->headers->contains('Content-Type', 'application/problem+json'));
    }

    public function test_query_exception_redacts_sql_and_returns_500_problem_json(): void
    {
        $sk = $this->getValidSk();

        Log::shouldReceive('channel')
            ->with('connect')
            ->andReturnSelf();
        Log::shouldReceive('error')
            ->atLeast()->once();

        $response = $this->withHeader('Authorization', 'Bearer ' . $sk)
            ->postJson(route('connect.test.db-error'));

        $response->assertStatus(500);
        $response->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $response->assertJson([
            'code' => 'ERR_INTERNAL_SERVER',
            'status' => 500,
        ]);

        $content = $response->getContent();
        // Strict verification: zero SQL or binding leakage in response body
        $this->assertStringNotContainsString('non_existent_table_for_testing_redaction', $content);
        $this->assertStringNotContainsString('sensitive_binding_123', $content);
        $this->assertStringNotContainsString('SELECT', $content);
    }

    public function test_web_route_query_exception_is_reported_normally_and_not_intercepted_by_connect_stop(): void
    {
        Log::spy();

        \Illuminate\Support\Facades\Route::get('/test-web-db-error', function () {
            \Illuminate\Support\Facades\DB::select('SELECT * FROM non_existent_web_table_123');
        });

        $response = $this->get('/test-web-db-error');

        $response->assertStatus(500);
        $this->assertFalse($response->headers->contains('Content-Type', 'application/problem+json'));

        // Assert that default log channel was called with the QueryException in $context['exception']
        Log::shouldHaveReceived('error')->withArgs(function ($message, $context = []) {
            return isset($context['exception']) && $context['exception'] instanceof \Illuminate\Database\QueryException;
        });
    }

    public function test_connect_route_query_exception_stops_default_reporting(): void
    {
        $channelMock = \Mockery::mock();
        $channelMock->shouldReceive('error')->andReturnNull();

        Log::spy();
        Log::shouldReceive('channel')->with('connect')->andReturn($channelMock)->byDefault();
        $sk = $this->getValidSk();

        $response = $this->withHeader('Authorization', 'Bearer ' . $sk)
            ->postJson(route('connect.test.db-error'));

        $response->assertStatus(500);
        $response->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');

        // Assert default root logger was NOT called with ConnectQueryException in $context['exception'] (halted by reportable()->stop())
        Log::shouldNotHaveReceived('error', [
            \Mockery::any(),
            \Mockery::on(function ($context) {
                return isset($context['exception']) && $context['exception'] instanceof \App\Exceptions\Connect\ConnectQueryException;
            }),
        ]);
    }

    public function test_connect_host_default_never_equals_web_host_and_web_exceptions_keep_original_rendering_when_host_empty(): void
    {
        // 1. Assert default connect.host never equals web host
        $defaultConnectHost = config('connect.host');
        $webHost = parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';
        $this->assertNotEquals($webHost, $defaultConnectHost);
        $this->assertEquals('api.tebiby.com', $defaultConnectHost);

        // 2. Set connect.host to empty/null
        \Illuminate\Support\Facades\Config::set('connect.host', null);

        // 3. Web request triggering validation keeps original 302 redirect / session errors
        $response = $this->post(route('appointments.book'), []);
        $response->assertStatus(302);
        $response->assertSessionHasErrors(['doctor_id', 'patient_name', 'patient_phone']);
        $this->assertFalse($response->headers->contains('Content-Type', 'application/problem+json'));

        // 4. Web request triggering 404 keeps HTML rendering, not problem+json
        $response404 = $this->get('/non-existent-random-route-web-12345');
        $response404->assertStatus(404);
        $this->assertFalse($response404->headers->contains('Content-Type', 'application/problem+json'));
    }
}
