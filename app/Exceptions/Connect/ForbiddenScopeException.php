<?php

namespace App\Exceptions\Connect;

class ForbiddenScopeException extends ConnectDomainException
{
    public function __construct(string $detail = 'المفتاح يفتقر للصلاحية المطلوبة لتنفيذ هذا الإجراء على المنشأة المحددة.')
    {
        parent::__construct(
            sanitizedDetail: $detail,
            errorCode: 'ERR_FORBIDDEN_SCOPE',
            errorTitle: 'Forbidden Scope',
            statusCode: 403
        );
    }
}
