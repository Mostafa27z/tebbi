<?php

namespace App\Http\Controllers\Connect;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ConnectAppointmentLink;
use App\Models\QueueTicket;
use Database\Seeders\SandboxCatalogSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SandboxController extends Controller
{
    /**
     * POST /connect/v1/sandbox/reset
     * Reset sandbox data and re-seed catalog (strictly forbidden in production).
     */
    public function reset(Request $request): JsonResponse
    {
        if (! app()->environment('sandbox') && config('app.env') !== 'sandbox') {
            abort(404, 'Sandbox reset is only available in the sandbox environment.');
        }

        // Strict DB-Name Guard inside controller: Must end with '_sandbox'
        $defaultConn = config('database.default');
        $dbName = (string) config("database.connections.{$defaultConn}.database");

        if (! str_ends_with(strtolower($dbName), '_sandbox')) {
            abort(403, "Sandbox reset is strictly forbidden on non-sandbox database: [{$dbName}]");
        }

        // Restrict deletions strictly to rows linked to sandbox credentials within a transaction
        $sandboxCredIds = \App\Models\ConnectCredential::where('environment', 'sandbox')->pluck('id');

        DB::transaction(function () use ($sandboxCredIds) {
            $appointmentIds = ConnectAppointmentLink::whereIn('credential_id', $sandboxCredIds)->pluck('appointment_id');

            QueueTicket::whereIn('appointment_id', $appointmentIds)->delete();
            ConnectAppointmentLink::whereIn('credential_id', $sandboxCredIds)->delete();
            Appointment::whereIn('id', $appointmentIds)->delete();
        });

        // Re-seed sandbox catalog
        $seeder = new SandboxCatalogSeeder();
        $seeder->run();

        return response()->json([
            'status' => 'sandbox_reset_completed',
            'message' => 'Sandbox environment data has been reset and seeded.',
        ]);
    }
}
