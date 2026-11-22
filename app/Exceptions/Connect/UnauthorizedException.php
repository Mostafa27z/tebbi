<?php

namespace App\Exceptions\Connect;

class UnauthorizedException extends ConnectDomainException
{
    public function __construct(string $detail = 'مفتاح API غير صالح، منتهي الصلاحية، أو مفقود.')
    {
        parent::__construct(
            sanitizedDetail: $detail,
            errorCode: 'ERR_UNAUTHORIZED',
            errorTitle: 'Unauthorized',
            statusCode: 401
        );
    }
}
