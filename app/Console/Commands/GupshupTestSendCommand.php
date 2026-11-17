<?php

namespace App\Console\Commands;

use App\Services\GupshupWhatsAppService;
use Illuminate\Console\Command;

class GupshupTestSendCommand extends Command
{
    protected $signature = 'gupshup:test-send {phone : Recipient phone number} {template=booking_received : Template key or elementName} {--params=* : Template parameter values}';

    protected $description = 'Send a test WhatsApp template notification via Gupshup';

    public function handle(GupshupWhatsAppService $gupshup): int
    {
        $phone = $this->argument('phone');
        $template = $this->argument('template');
        $params = $this->option('params');

        if (empty($params)) {
            $params = match ($template) {
                'booking_received', 'booking_confirmed' => ['فيصل سعد', 'TB-4892', 'أحمد المحمد', 'مجمع عيادات العليا الطبي', '2026-11-20', '05:30 م'],
                'arrival_confirmed' => ['فيصل سعد', 'مجمع عيادات العليا الطبي', '4', 'أحمد المحمد', url('/queue/TB-4892')],
                'turn_approaching' => ['فيصل سعد', '4', 'أحمد المحمد', 'مجمع عيادات العليا الطبي'],
                'patient_called' => ['فيصل سعد', 'أحمد المحمد', 'مجمع عيادات العليا الطبي', '4'],
                'consultation_completed' => ['فيصل سعد', 'أحمد المحمد', 'RX-948201', url('/patient/portal')],
                'appointment_cancelled' => ['فيصل سعد', 'TB-4892', 'أحمد المحمد', 'مجمع عيادات العليا الطبي', '2026-11-20'],
                default => ['فيصل سعد'],
            };
        }

        $this->info("Sending template [{$template}] to [{$phone}]...");
        $result = $gupshup->sendTemplateMessage($phone, $template, $params);

        $this->line(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return ($result['status'] ?? '') === 'submitted' ? self::SUCCESS : self::FAILURE;
    }
}
