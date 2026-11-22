<?php

return [
    'host' => env('CONNECT_HOST', 'api.tebiby.com'),
    'audit_salt' => env('CONNECT_AUDIT_SALT', 'tebiby-connect-salt-fixed'),
    'audit_retention_days' => env('CONNECT_AUDIT_RETENTION_DAYS', 90),
    'rate_limit_per_minute' => env('CONNECT_RATE_LIMIT_PER_MINUTE', 120),
];
