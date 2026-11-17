<?php

namespace App\Console\Commands;

use App\Services\GupshupWhatsAppService;
use Illuminate\Console\Command;

class GupshupRegisterTemplatesCommand extends Command
{
    protected $signature = 'gupshup:register-templates';

    protected $description = 'Register all 7 Tebiby WhatsApp notification templates on Gupshup & Meta';

    public function handle(GupshupWhatsAppService $gupshup): int
    {
        $this->info('Submitting Tebiby WhatsApp Templates to Gupshup / Meta...');

        $results = $gupshup->registerAllTemplates();

        $rows = [];
        foreach ($results as $key => $info) {
            $rows[] = [
                $key,
                $info['elementName'] ?? '',
                $info['action'] ?? '',
                $info['id'] ?? 'N/A',
                $info['status'] ?? '',
            ];
        }

        $this->table(
            ['Config Key', 'Element Name', 'Action', 'Gupshup Template ID', 'Meta Status'],
            $rows
        );

        return self::SUCCESS;
    }
}
