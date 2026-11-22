<?php

namespace App\Services\Connect;

class ConnectContext
{
    protected static array $context = [];

    public static function setContext(array $context): void
    {
        static::$context = array_merge(static::$context, $context);
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::$context[$key] ?? $default;
    }

    public static function all(): array
    {
        return static::$context;
    }

    public static function clear(): void
    {
        static::$context = [];
    }
}
