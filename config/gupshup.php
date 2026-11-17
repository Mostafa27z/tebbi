<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Gupshup WhatsApp Business API Configuration
    |--------------------------------------------------------------------------
    */

    'enabled' => env('GUPSHUP_ENABLED', true),

    'api_key' => env('GUPSHUP_API_KEY', 'sk_9e81b654e8e34bfda66cb864e719e83b'),

    'app_id' => env('GUPSHUP_APP_ID', 'ea8766f0-ed4a-4dd6-9cfc-179167a0a1d4'),

    'app_name' => env('GUPSHUP_APP_NAME', 'miraah'),

    'source_number' => env('GUPSHUP_SOURCE_NUMBER', '966537678660'),

    'channel' => env('GUPSHUP_CHANNEL', 'whatsapp'),

    'base_url' => env('GUPSHUP_BASE_URL', 'https://api.gupshup.io/wa'),

    /*
    |--------------------------------------------------------------------------
    | Patient Notification Templates (Meta UTILITY - Arabic)
    |--------------------------------------------------------------------------
    */

    'templates' => [
        'booking_received' => [
            'id' => env('GUPSHUP_TPL_BOOKING_RECEIVED_ID', '429e4a1c-c85b-4c0f-b620-1ca456d7027f'),
            'elementName' => 'tebiby_booking_received_ar',
            'category' => 'UTILITY',
            'languageCode' => 'ar',
            'templateType' => 'TEXT',
            'vertical' => 'Appointment update',
            'content' => 'مرحباً {{1}}، تم استلام طلب حجز موعدك بنجاح برقم #{{2}} لدى د. {{3}} في {{4}}. الموعد المقترح: {{5}} في تمام الساعة {{6}}. طلبك الآن قيد مراجعة وتأكيد إدارة المنشأة، وسنوافيك برسالة فور اعتماده.',
            'example' => 'مرحباً فيصل سعد، تم استلام طلب حجز موعدك بنجاح برقم #TB-4892 لدى د. أحمد المحمد في مجمع عيادات العليا الطبي. الموعد المقترح: 2026-11-20 في تمام الساعة 05:30 م. طلبك الآن قيد مراجعة وتأكيد إدارة المنشأة، وسنوافيك برسالة فور اعتماده.',
        ],

        'booking_confirmed' => [
            'id' => env('GUPSHUP_TPL_BOOKING_CONFIRMED_ID', '1f0d3806-0457-4c58-8f17-b52fa994bee1'),
            'elementName' => 'tebiby_booking_confirmed_ar',
            'category' => 'UTILITY',
            'languageCode' => 'ar',
            'templateType' => 'TEXT',
            'vertical' => 'Appointment update',
            'content' => 'مرحباً {{1}}، يسرنا إبلاغك بأنه تم تأكيد حجز موعدك رسمياً برقم #{{2}} لدى د. {{3}} في {{4}}. موعد الكشف: {{5}} الساعة {{6}}. نرجو التكرم بالحضور قبل الموعد بـ 15 دقيقة لمراجعة قسم الاستقبال وإثبات الحضور.',
            'example' => 'مرحباً فيصل سعد، يسرنا إبلاغك بأنه تم تأكيد حجز موعدك رسمياً برقم #TB-4892 لدى د. أحمد المحمد في مجمع عيادات العليا الطبي. موعد الكشف: 2026-11-20 الساعة 05:30 م. نرجو التكرم بالحضور قبل الموعد بـ 15 دقيقة لمراجعة قسم الاستقبال وإثبات الحضور.',
        ],

        'arrival_confirmed' => [
            'id' => env('GUPSHUP_TPL_ARRIVAL_CONFIRMED_ID', '34f53acb-76b9-48f7-b38c-2219ba6bcef1'),
            'elementName' => 'tebiby_arrival_confirmed_ar',
            'category' => 'UTILITY',
            'languageCode' => 'ar',
            'templateType' => 'TEXT',
            'vertical' => 'Appointment update',
            'content' => 'مرحباً {{1}}، أهلاً بك في {{2}}. تم تسجيل وصولك بالاستقبال بنجاح. رقم دورك في قائمة الانتظار: #{{3}} لدى د. {{4}}. يمكنك تتبع ترتيبك لحظة بلحظة عبر الرابط: {{5}} ونتمنى لك دوام الصحة والعافية.',
            'example' => 'مرحباً فيصل سعد، أهلاً بك في مجمع عيادات العليا الطبي. تم تسجيل وصولك بالاستقبال بنجاح. رقم دورك في قائمة الانتظار: #4 لدى د. أحمد المحمد. يمكنك تتبع ترتيبك لحظة بلحظة عبر الرابط: https://tebiby.com/queue/TB-4892 ونتمنى لك دوام الصحة والعافية.',
        ],

        'turn_approaching' => [
            'id' => env('GUPSHUP_TPL_TURN_APPROACHING_ID', '6622f6c2-d62b-46b7-93d5-c1a1a1f1acad'),
            'elementName' => 'tebiby_turn_approaching_ar',
            'category' => 'UTILITY',
            'languageCode' => 'ar',
            'templateType' => 'TEXT',
            'vertical' => 'Appointment update',
            'content' => 'عزيزي المريض {{1}}، اقترب دورك للدخول! يتبقى مريض واحد فقط قبل دور تذكرتك رقم #{{2}} لدى د. {{3}} في {{4}}. يرجى التواجد بالقرب من صالة انتظار العيادة للاستعداد.',
            'example' => 'عزيزي المريض فيصل سعد، اقترب دورك للدخول! يتبقى مريض واحد فقط قبل دور تذكرتك رقم #4 لدى د. أحمد المحمد في مجمع عيادات العليا الطبي. يرجى التواجد بالقرب من صالة انتظار العيادة للاستعداد.',
        ],

        'patient_called' => [
            'id' => env('GUPSHUP_TPL_PATIENT_CALLED_ID', 'a47e8501-8a41-4ab6-95f2-76b8c82821d4'),
            'elementName' => 'tebiby_patient_called_ar',
            'category' => 'UTILITY',
            'languageCode' => 'ar',
            'templateType' => 'TEXT',
            'vertical' => 'Appointment update',
            'content' => 'نداء للمريض {{1}}: حان دورك الآن! تفضل بالدخول إلى عيادة د. {{2}} في {{3}} (تذكرة رقم: #{{4}}). نتمنى لك دوام الصحة والعافية.',
            'example' => 'نداء للمريض فيصل سعد: حان دورك الآن! تفضل بالدخول إلى عيادة د. أحمد المحمد في مجمع عيادات العليا الطبي (تذكرة رقم: #4). نتمنى لك دوام الصحة والعافية.',
        ],

        'consultation_completed' => [
            'id' => env('GUPSHUP_TPL_CONSULTATION_COMPLETED_ID', '1150c830-6935-4c51-b656-0ba65ddd647d'),
            'elementName' => 'tebiby_consultation_completed_ar',
            'category' => 'UTILITY',
            'languageCode' => 'ar',
            'templateType' => 'TEXT',
            'vertical' => 'Appointment update',
            'content' => 'الحمد لله على سلامتك يا {{1}}، نود إشعارك باكتمال كشفك الطبي لدى د. {{2}}. تم إصدار وصفتك وتقريرك الطبي برقم #{{3}}. يمكنك استعراض التقرير والوصفة عبر الرابط: {{4}} مع تمنياتنا لك بالشفاء العاجل.',
            'example' => 'الحمد لله على سلامتك يا فيصل سعد، نود إشعارك باكتمال كشفك الطبي لدى د. أحمد المحمد. تم إصدار وصفتك وتقريرك الطبي برقم #RX-948201. يمكنك استعراض التقرير والوصفة عبر الرابط: https://tebiby.com/patient/portal مع تمنياتنا لك بالشفاء العاجل.',
        ],

        'appointment_cancelled' => [
            'id' => env('GUPSHUP_TPL_APPOINTMENT_CANCELLED_ID', 'e6395ee8-9939-4568-bfbf-6f9f98b214eb'),
            'elementName' => 'tebiby_appointment_cancelled_ar',
            'category' => 'UTILITY',
            'languageCode' => 'ar',
            'templateType' => 'TEXT',
            'vertical' => 'Appointment update',
            'content' => 'مرحباً {{1}}، نود إحاطتك بأنه تم إلغاء حجز موعدك رقم #{{2}} لدى د. {{3}} في {{4}} المقرر بتاريخ {{5}}. في حال رغبت بإعادة الحجز أو الاستفسار، يسعدنا تواصلكم معنا عبر المنصة.',
            'example' => 'مرحباً فيصل سعد، نود إحاطتك بأنه تم إلغاء حجز موعدك رقم #TB-4892 لدى د. أحمد المحمد في مجمع عيادات العليا الطبي المقرر بتاريخ 2026-11-20. في حال رغبت بإعادة الحجز أو الاستفسار، يسعدنا تواصلكم معنا عبر المنصة.',
        ],
    ],
];
