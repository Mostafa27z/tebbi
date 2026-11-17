<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Prescription;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GupshupWhatsAppService
{
    /**
     * Normalize any Saudi or international phone number to E.164 digits without '+'
     * e.g. '+966501234567' -> '966501234567', '0501234567' -> '966501234567'
     */
    public function normalizePhoneNumber(?string $phone): ?string
    {
        if (empty($phone)) {
            return null;
        }

        // Convert Eastern Arabic numerals to Western digits
        $arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        $westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $cleaned = str_replace($arabicNumerals, $westernNumerals, trim($phone));

        // Strip all non-digit characters
        $digits = preg_replace('/\D+/', '', $cleaned);

        if (empty($digits)) {
            return null;
        }

        // Remove leading '00' international prefix
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        // Convert local Saudi mobile format '05XXXXXXXX' (10 digits) -> '9665XXXXXXXX'
        if (strlen($digits) === 10 && str_starts_with($digits, '05')) {
            $digits = '966' . substr($digits, 1);
        }

        // Convert 9-digit Saudi mobile '5XXXXXXXX' -> '9665XXXXXXXX'
        if (strlen($digits) === 9 && str_starts_with($digits, '5')) {
            $digits = '966' . $digits;
        }

        return strlen($digits) >= 9 ? $digits : null;
    }

    /**
     * Format 24-hour time string ('17:30:00') into Arabic 12-hour format ('05:30 م')
     */
    public function formatArabicTime(?string $time): string
    {
        if (empty($time)) {
            return '';
        }

        try {
            $parsed = Carbon::parse($time);
            $period = $parsed->format('A') === 'PM' ? 'م' : 'ص';
            return $parsed->format('h:i') . ' ' . $period;
        } catch (\Throwable) {
            return (string) $time;
        }
    }

    /**
     * Format date string cleanly ('YYYY-MM-DD')
     */
    public function formatDate($date): string
    {
        if (empty($date)) {
            return '';
        }

        if ($date instanceof Carbon) {
            return $date->toDateString();
        }

        try {
            return Carbon::parse((string) $date)->toDateString();
        } catch (\Throwable) {
            return (string) $date;
        }
    }

    /**
     * Strip leading 'د.' or 'دكتور' from doctor name because templates already prefix 'د. {{X}}'
     */
    public function cleanDoctorName(?string $name): string
    {
        if (empty($name)) {
            return 'الطبيب المختص';
        }

        $cleaned = preg_replace('/^(د\.|دكتور|الدكتور)\s*/u', '', trim($name));
        return $cleaned ?: trim($name);
    }

    /**
     * Resolve template key (e.g. 'booking_received') or elementName to Gupshup Template ID / elementName
     */
    public function resolveTemplateIdentifier(string $templateKeyOrName): string
    {
        $templatesConfig = config('gupshup.templates', []);

        // 1. Check if passed as config key (e.g., 'booking_received')
        if (isset($templatesConfig[$templateKeyOrName])) {
            $cfg = $templatesConfig[$templateKeyOrName];
            if (!empty($cfg['id'])) {
                return $cfg['id'];
            }
            $elementName = $cfg['elementName'];
        } else {
            // Check if passed as elementName
            $elementName = $templateKeyOrName;
            foreach ($templatesConfig as $cfg) {
                if (($cfg['elementName'] ?? '') === $templateKeyOrName && !empty($cfg['id'])) {
                    return $cfg['id'];
                }
            }
        }

        // 2. Check cached remote templates map (elementName => id)
        $cachedMap = Cache::get('gupshup_template_id_map', []);
        if (isset($cachedMap[$elementName])) {
            return $cachedMap[$elementName];
        }

        return $elementName;
    }

    /**
     * Send a pre-approved WhatsApp Template Message via Gupshup
     * Endpoint: POST https://api.gupshup.io/wa/api/v1/template/msg
     */
    public function sendTemplateMessage(?string $destinationPhone, string $templateKeyOrId, array $params = []): array
    {
        if (!config('gupshup.enabled', false)) {
            return [
                'status' => 'skipped',
                'reason' => 'gupshup_disabled',
            ];
        }

        $destination = $this->normalizePhoneNumber($destinationPhone);
        if (!$destination) {
            return [
                'status' => 'skipped',
                'reason' => 'invalid_phone',
            ];
        }

        $apiKey = config('gupshup.api_key');
        $source = config('gupshup.source_number');
        $appName = config('gupshup.app_name');
        $channel = config('gupshup.channel', 'whatsapp');
        $baseUrl = rtrim(config('gupshup.base_url', 'https://api.gupshup.io/wa'), '/');

        $templateId = $this->resolveTemplateIdentifier($templateKeyOrId);

        $templatePayload = json_encode([
            'id' => $templateId,
            'params' => array_values(array_map(fn($p) => (string) $p, $params)),
        ], JSON_UNESCAPED_UNICODE);

        try {
            $response = Http::withHeaders([
                'apikey' => $apiKey,
                'Accept' => 'application/json',
            ])
                ->asForm()
                ->timeout(10)
                ->post("{$baseUrl}/api/v1/template/msg", [
                    'channel' => $channel,
                    'source' => $source,
                    'destination' => $destination,
                    'src.name' => $appName,
                    'template' => $templatePayload,
                ]);

            $data = $response->json() ?? ['raw' => $response->body()];

            if ($response->successful()) {
                Log::info('Gupshup WhatsApp template sent successfully', [
                    'destination' => $destination,
                    'template' => $templateKeyOrId,
                    'template_id' => $templateId,
                    'response' => $data,
                ]);

                return [
                    'status' => 'submitted',
                    'http_status' => $response->status(),
                    'messageId' => $data['messageId'] ?? null,
                    'data' => $data,
                ];
            }

            Log::warning('Gupshup WhatsApp template send failed', [
                'destination' => $destination,
                'template' => $templateKeyOrId,
                'template_id' => $templateId,
                'http_status' => $response->status(),
                'response' => $data,
            ]);

            return [
                'status' => 'error',
                'http_status' => $response->status(),
                'data' => $data,
            ];
        } catch (\Throwable $e) {
            Log::error('Gupshup WhatsApp exception', [
                'destination' => $destination,
                'template' => $templateKeyOrId,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'exception',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send a session text message via Gupshup (/api/v1/msg)
     * Reference: https://docs.gupshup.io/reference/msg
     */
    public function sendSessionTextMessage(?string $destinationPhone, string $text): array
    {
        if (!config('gupshup.enabled', false)) {
            return ['status' => 'skipped', 'reason' => 'gupshup_disabled'];
        }

        $destination = $this->normalizePhoneNumber($destinationPhone);
        if (!$destination) {
            return ['status' => 'skipped', 'reason' => 'invalid_phone'];
        }

        $apiKey = config('gupshup.api_key');
        $source = config('gupshup.source_number');
        $appName = config('gupshup.app_name');
        $channel = config('gupshup.channel', 'whatsapp');
        $baseUrl = rtrim(config('gupshup.base_url', 'https://api.gupshup.io/wa'), '/');

        try {
            $response = Http::withHeaders([
                'apikey' => $apiKey,
                'Accept' => 'application/json',
            ])
                ->asForm()
                ->timeout(10)
                ->post("{$baseUrl}/api/v1/msg", [
                    'channel' => $channel,
                    'source' => $source,
                    'destination' => $destination,
                    'src.name' => $appName,
                    'message' => json_encode([
                        'type' => 'text',
                        'text' => $text,
                    ], JSON_UNESCAPED_UNICODE),
                ]);

            return [
                'status' => $response->successful() ? 'submitted' : 'error',
                'http_status' => $response->status(),
                'data' => $response->json() ?? ['raw' => $response->body()],
            ];
        } catch (\Throwable $e) {
            Log::error('Gupshup session message exception', ['error' => $e->getMessage()]);
            return ['status' => 'exception', 'message' => $e->getMessage()];
        }
    }

    /**
     * Fetch all templates registered on Gupshup for this App
     * Endpoint: GET https://api.gupshup.io/wa/app/{appId}/template
     */
    public function listTemplates(): array
    {
        $apiKey = config('gupshup.api_key');
        $appId = config('gupshup.app_id');
        $baseUrl = rtrim(config('gupshup.base_url', 'https://api.gupshup.io/wa'), '/');

        try {
            $response = Http::withHeaders([
                'apikey' => $apiKey,
                'Accept' => 'application/json',
            ])
                ->timeout(15)
                ->get("{$baseUrl}/app/{$appId}/template");

            $data = $response->json() ?? [];
            $templates = $data['templates'] ?? [];

            // Cache elementName -> id map for fast runtime lookup
            if (!empty($templates)) {
                $map = [];
                foreach ($templates as $tpl) {
                    if (!empty($tpl['elementName']) && !empty($tpl['id'])) {
                        $map[$tpl['elementName']] = $tpl['id'];
                    }
                }
                Cache::put('gupshup_template_id_map', $map, now()->addHours(12));
            }

            return [
                'status' => $response->successful() ? 'success' : 'error',
                'http_status' => $response->status(),
                'templates' => $templates,
                'raw' => $data,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'exception',
                'message' => $e->getMessage(),
                'templates' => [],
            ];
        }
    }

    /**
     * Create / Submit a WhatsApp Template to Meta via Gupshup API
     * Endpoint: POST https://api.gupshup.io/wa/app/{appId}/template
     */
    public function createTemplate(array $templateDef): array
    {
        $apiKey = config('gupshup.api_key');
        $appId = config('gupshup.app_id');
        $baseUrl = rtrim(config('gupshup.base_url', 'https://api.gupshup.io/wa'), '/');

        try {
            $response = Http::withHeaders([
                'apikey' => $apiKey,
                'Accept' => 'application/json',
            ])
                ->asForm()
                ->timeout(15)
                ->post("{$baseUrl}/app/{$appId}/template", [
                    'elementName' => $templateDef['elementName'],
                    'languageCode' => $templateDef['languageCode'] ?? 'ar',
                    'category' => $templateDef['category'] ?? 'UTILITY',
                    'templateType' => $templateDef['templateType'] ?? 'TEXT',
                    'vertical' => $templateDef['vertical'] ?? 'Appointment update',
                    'content' => $templateDef['content'],
                    'example' => $templateDef['example'],
                    'enableSample' => 'true',
                    'allowTemplateCategoryChange' => 'false',
                ]);

            return [
                'status' => $response->successful() ? 'success' : 'error',
                'http_status' => $response->status(),
                'data' => $response->json() ?? ['raw' => $response->body()],
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'exception',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Register all 7 configured templates on Gupshup if not already registered
     */
    public function registerAllTemplates(): array
    {
        $existingResult = $this->listTemplates();
        $existingByName = collect($existingResult['templates'] ?? [])->keyBy('elementName');

        $results = [];
        $configuredTemplates = config('gupshup.templates', []);

        foreach ($configuredTemplates as $key => $tplConfig) {
            $elementName = $tplConfig['elementName'];

            if ($existingByName->has($elementName)) {
                $existing = $existingByName->get($elementName);
                $results[$key] = [
                    'action' => 'already_exists',
                    'elementName' => $elementName,
                    'id' => $existing['id'] ?? null,
                    'status' => $existing['status'] ?? 'UNKNOWN',
                ];
                continue;
            }

            $creation = $this->createTemplate($tplConfig);
            $createdTemplate = $creation['data']['template'] ?? $creation['data'] ?? [];

            $results[$key] = [
                'action' => $creation['status'] === 'success' ? 'created' : 'failed',
                'elementName' => $elementName,
                'id' => $createdTemplate['id'] ?? null,
                'status' => $createdTemplate['status'] ?? ($creation['data']['status'] ?? 'ERROR'),
                'response' => $creation['data'] ?? null,
            ];
        }

        // Refresh template map cache after registering
        $this->listTemplates();

        return $results;
    }

    // =========================================================================
    // PATIENT LIFECYCLE NOTIFICATION TRIGGERS (7 TEMPLATES)
    // =========================================================================

    /**
     * Template 1: New Online Booking Received (status = booked)
     * Params: {{1}} Patient Name, {{2}} Booking Ref, {{3}} Doctor Name, {{4}} Facility Name, {{5}} Date, {{6}} Time
     */
    public function notifyBookingReceived(Appointment $appointment): array
    {
        if ($appointment->notify_whatsapp === false) {
            return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
        }

        $appointment->loadMissing(['patient', 'doctor.user', 'doctor.clinic', 'facility']);

        $patientName = $appointment->patient?->name ?? 'مريضنا الكريم';
        $bookingRef = $appointment->booking_reference;
        $doctorName = $this->cleanDoctorName($appointment->doctor?->user?->name);
        $facilityName = $appointment->facility?->name ?? $appointment->doctor?->clinic?->name ?? 'المركز الطبي';
        $date = $this->formatDate($appointment->appointment_date);
        $time = $this->formatArabicTime($appointment->appointment_time);

        return $this->sendTemplateMessage(
            $appointment->patient?->phone,
            'booking_received',
            [$patientName, $bookingRef, $doctorName, $facilityName, $date, $time]
        );
    }

    /**
     * Template 2: Stage 1 - Booking Confirmed by Admin (status = confirmed)
     * Params: {{1}} Patient Name, {{2}} Booking Ref, {{3}} Doctor Name, {{4}} Facility Name, {{5}} Date, {{6}} Time
     */
    public function notifyBookingConfirmed(Appointment $appointment): array
    {
        if ($appointment->notify_whatsapp === false) {
            return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
        }

        $appointment->loadMissing(['patient', 'doctor.user', 'doctor.clinic', 'facility']);

        $patientName = $appointment->patient?->name ?? 'مريضنا الكريم';
        $bookingRef = $appointment->booking_reference;
        $doctorName = $this->cleanDoctorName($appointment->doctor?->user?->name);
        $facilityName = $appointment->facility?->name ?? $appointment->doctor?->clinic?->name ?? 'المركز الطبي';
        $date = $this->formatDate($appointment->appointment_date);
        $time = $this->formatArabicTime($appointment->appointment_time);

        return $this->sendTemplateMessage(
            $appointment->patient?->phone,
            'booking_confirmed',
            [$patientName, $bookingRef, $doctorName, $facilityName, $date, $time]
        );
    }

    /**
     * Template 3: Stage 2 - Arrival Confirmed at Reception & Queue Ticket Issued (status = waiting)
     * Params: {{1}} Patient Name, {{2}} Facility Name, {{3}} Ticket Number, {{4}} Doctor Name, {{5}} Live Queue URL
     */
    public function notifyArrivalConfirmed(Appointment $appointment): array
    {
        if ($appointment->notify_whatsapp === false) {
            return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
        }

        $appointment->loadMissing(['patient', 'doctor.user', 'doctor.clinic', 'facility', 'queueTicket']);

        $patientName = $appointment->patient?->name ?? 'مريضنا الكريم';
        $facilityName = $appointment->facility?->name ?? $appointment->doctor?->clinic?->name ?? 'المركز الطبي';
        $ticketNumber = (string) ($appointment->queueTicket?->ticket_number ?? 1);
        $doctorName = $this->cleanDoctorName($appointment->doctor?->user?->name);
        $queueUrl = url('/queue/' . $appointment->booking_reference);

        return $this->sendTemplateMessage(
            $appointment->patient?->phone,
            'arrival_confirmed',
            [$patientName, $facilityName, $ticketNumber, $doctorName, $queueUrl]
        );
    }

    /**
     * Template 4: Turn Approaching Alert (1 patient ahead in queue)
     * Params: {{1}} Patient Name, {{2}} Ticket Number, {{3}} Doctor Name, {{4}} Facility Name
     */
    public function notifyTurnApproaching(Appointment $appointment): array
    {
        if ($appointment->notify_whatsapp === false) {
            return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
        }

        $appointment->loadMissing(['patient', 'doctor.user', 'doctor.clinic', 'facility', 'queueTicket']);

        $patientName = $appointment->patient?->name ?? 'مريضنا الكريم';
        $ticketNumber = (string) ($appointment->queueTicket?->ticket_number ?? 1);
        $doctorName = $this->cleanDoctorName($appointment->doctor?->user?->name);
        $facilityName = $appointment->facility?->name ?? $appointment->doctor?->clinic?->name ?? 'المركز الطبي';

        return $this->sendTemplateMessage(
            $appointment->patient?->phone,
            'turn_approaching',
            [$patientName, $ticketNumber, $doctorName, $facilityName]
        );
    }

    /**
     * Template 5: Patient Called to Consultation Room (status = in_consultation / called)
     * Params: {{1}} Patient Name, {{2}} Doctor Name, {{3}} Facility Name, {{4}} Ticket Number
     */
    public function notifyPatientCalled(Appointment $appointment): array
    {
        if ($appointment->notify_whatsapp === false) {
            return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
        }

        $appointment->loadMissing(['patient', 'doctor.user', 'doctor.clinic', 'facility', 'queueTicket']);

        $patientName = $appointment->patient?->name ?? 'مريضنا الكريم';
        $doctorName = $this->cleanDoctorName($appointment->doctor?->user?->name);
        $facilityName = $appointment->facility?->name ?? $appointment->doctor?->clinic?->name ?? 'المركز الطبي';
        $ticketNumber = (string) ($appointment->queueTicket?->ticket_number ?? 1);

        return $this->sendTemplateMessage(
            $appointment->patient?->phone,
            'patient_called',
            [$patientName, $doctorName, $facilityName, $ticketNumber]
        );
    }

    /**
     * Template 6: Stage 3 - Consultation Completed & Prescription Issued (status = completed)
     * Params: {{1}} Patient Name, {{2}} Doctor Name, {{3}} Prescription Code / Ref, {{4}} Portal URL
     */
    public function notifyConsultationCompleted(Appointment $appointment, ?Prescription $prescription = null): array
    {
        if ($appointment->notify_whatsapp === false) {
            return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
        }

        $appointment->loadMissing(['patient', 'doctor.user', 'prescription']);

        $rx = $prescription ?? $appointment->prescription;
        $patientName = $appointment->patient?->name ?? 'مريضنا الكريم';
        $doctorName = $this->cleanDoctorName($appointment->doctor?->user?->name);
        $rxCode = $rx?->prescription_code ?? $appointment->booking_reference;
        $portalUrl = url('/patient/portal');

        return $this->sendTemplateMessage(
            $appointment->patient?->phone,
            'consultation_completed',
            [$patientName, $doctorName, $rxCode, $portalUrl]
        );
    }

    /**
     * Template 7: Appointment Cancelled or No-Show (status = cancelled)
     * Params: {{1}} Patient Name, {{2}} Booking Ref, {{3}} Doctor Name, {{4}} Facility Name, {{5}} Date
     */
    public function notifyAppointmentCancelled(Appointment $appointment): array
    {
        if ($appointment->notify_whatsapp === false) {
            return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
        }

        $appointment->loadMissing(['patient', 'doctor.user', 'doctor.clinic', 'facility']);

        $patientName = $appointment->patient?->name ?? 'مريضنا الكريم';
        $bookingRef = $appointment->booking_reference;
        $doctorName = $this->cleanDoctorName($appointment->doctor?->user?->name);
        $facilityName = $appointment->facility?->name ?? $appointment->doctor?->clinic?->name ?? 'المركز الطبي';
        $date = $this->formatDate($appointment->appointment_date);

        return $this->sendTemplateMessage(
            $appointment->patient?->phone,
            'appointment_cancelled',
            [$patientName, $bookingRef, $doctorName, $facilityName, $date]
        );
    }
}
