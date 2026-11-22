<?php

namespace App\Exceptions\Connect;

class PublishableKeyWriteException extends ConnectDomainException
{
    public function __construct(string $detail = 'المفتاح العام (Publishable Key) مخصص لعمليات القراءة فقط، ولا يمكن استخدامه للعمليات التعديلية أو الحجز.')
    {
        parent::__construct(
            sanitizedDetail: $detail,
            errorCode: 'ERR_FORBIDDEN',
            errorTitle: 'Publishable Key Is Read-Only',
            statusCode: 403
        );
    }
}
