<?php

namespace App\Exceptions\Connect;

use RuntimeException;
use Throwable;

class ConnectQueryException extends RuntimeException
{
    protected string $errorId;
    protected ?string $contextId;

    public function __construct(
        string $message = 'Connect Database Operation Failed',
        int $code = 0,
        ?Throwable $previous = null,
        ?string $contextId = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->errorId = (string) \Illuminate\Support\Str::uuid();
        $this->contextId = $contextId;
    }

    public function getErrorId(): string
    {
        return $this->errorId;
    }

    public function getContextId(): ?string
    {
        return $this->contextId;
    }
}
