<?php

namespace App\Exceptions\Connect;

class BootGuardException extends ConnectDomainException
{
    public function __construct(string $detail = 'Environmental security boot guard rejected connection.')
    {
        parent::__construct(
            sanitizedDetail: $detail,
            errorCode: 'ERR_INTERNAL_SERVER',
            errorTitle: 'Environmental Security Violation',
            statusCode: 500
        );
    }
}
