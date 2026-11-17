<?php

namespace App\Console\Commands;

use App\Services\GupshupWhatsAppService;
use Illuminate\Console\Command;

class GupshupCheckTemplatesCommand extends Command
{
    protected $signature = 'gupshup:check-templates';

    protected $description = 'Check approval status of WhatsApp templates on Gupshup / Meta';

    public function handle(GupshupWhatsAppService $gupshup): int
    {
        $this->info('Fetching templates from Gupshup API...');

        $result = $gupshup->listTemplates();

        if ($result['status'] !== 'success') {
            $this->error('Failed to fetch templates from Gupshup.');
            return self::FAILURE;
        }

        $rows = [];
        foreach ($result['templates'] as $tpl) {
            $rows[] = [
                $tpl['elementName'] ?? '',
                $tpl['id'] ?? '',
                $tpl['category'] ?? '',
                $tpl['languageCode'] ?? '',
                $tpl['status'] ?? '',
            ];
        }

        $this->table(
            ['Element Name', 'Gupshup ID', 'Category', 'Lang', 'Status'],
            $rows
        );

        return self::SUCCESS;
    }
}
