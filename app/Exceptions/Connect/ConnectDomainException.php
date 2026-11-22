<?php

namespace App\Exceptions\Connect;

use Exception;
use Throwable;

abstract class ConnectDomainException extends Exception
{
    protected string $errorCode;
    protected string $errorTitle;
    protected int $statusCode;
    protected string $sanitizedDetail;
    protected array $invalidParams = [];

    public function __construct(
        string $sanitizedDetail = 'An error occurred during processing.',
        string $errorCode = 'ERR_INTERNAL_SERVER',
        string $errorTitle = 'Internal Error',
        int $statusCode = 500,
        array $invalidParams = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($sanitizedDetail, $statusCode, $previous);
        $this->sanitizedDetail = $sanitizedDetail;
        $this->errorCode = $errorCode;
        $this->errorTitle = $errorTitle;
        $this->statusCode = $statusCode;
        $this->invalidParams = $invalidParams;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getErrorTitle(): string
    {
        return $this->errorTitle;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getSanitizedDetail(): string
    {
        return $this->sanitizedDetail;
    }

    public function getInvalidParams(): array
    {
        return $this->invalidParams;
    }
}
