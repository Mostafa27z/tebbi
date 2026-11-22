<?php

namespace App\Console\Commands;

use App\Models\ConnectAuditLog;
use Illuminate\Console\Command;

class PurgeConnectAuditLogs extends Command
{
    protected $signature = 'connect:purge-audit-logs {--days=90 : The number of days of audit logs to retain}';

    protected $description = 'Purge connect audit logs older than the specified retention window (default 90 days).';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $deleted = ConnectAuditLog::where('created_at', '<', $cutoff)->delete();

        $this->info("Successfully purged {$deleted} Connect audit log record(s) older than {$days} days.");

        return self::SUCCESS;
    }
}
