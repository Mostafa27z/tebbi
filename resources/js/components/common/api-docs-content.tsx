import React, { useState } from 'react';
import {
    KeyRound,
    Copy,
    Check,
    Code2,
    ShieldCheck,
    AlertCircle,
    Clock,
    Terminal,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Zap,
    Lock,
    Sparkles,
    CheckCircle2,
    XCircle,
    Info,
    Calendar,
    Users,
    Activity,
    Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Language = 'curl' | 'js' | 'php' | 'python';

interface EndpointParam {
    name: string;
    location: 'path' | 'query' | 'header' | 'body';
    type: string;
    required: boolean;
    description: string;
    example?: string;
}

interface EndpointDoc {
    id: string;
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    title: string;
    subtitle: string;
    description: string;
    requiresAuth: boolean;
    authType: string;
    headers?: { name: string; required: boolean; value: string; description: string }[];
    params: EndpointParam[];
    snippets: Record<Language, string>;
    successStatus: number;
    successResponse: string;
    errorResponses: { status: number; title: string; json: string }[];
}

const ENDPOINTS: EndpointDoc[] = [
    {
        id: 'availability',
        method: 'GET',
        path: '/connect/v1/facilities/{facility_id}/doctors/{doctor_id}/availability',
        title: 'استعلام المواعيد والأوقات الشاغرة',
        subtitle: 'Doctor Real-time Availability & Slot Capacity',
        description: 'يسترجع هذا المسار جميع فترات ومواعيد الكشف المتاحة للطبيب في المنشأة ليوم محدد بتوقيت الرياض، مع توضيح الطاقة الاستيعابية والأسعار المعتمدة وحالة كل موعد.',
        requiresAuth: true,
        authType: 'Bearer sk_live_... أو pk_live_...',
        headers: [
            { name: 'Authorization', required: true, value: 'Bearer sk_live_9a8b7c6d...', description: 'مفتاح الربط البرمجي السري للمنشأة' },
            { name: 'Accept', required: true, value: 'application/json', description: 'نوع الاستجابة المطلوبة' }
        ],
        params: [
            { name: 'facility_id', location: 'path', type: 'integer', required: true, description: 'المعرّف الرقمي للمنشأة أو المستشفى في نظام طبيبي', example: '1' },
            { name: 'doctor_id', location: 'path', type: 'integer', required: true, description: 'المعرّف الرقمي للطبيب أو ملف الاستشاري المطلوب', example: '4' },
            { name: 'date', location: 'query', type: 'string (YYYY-MM-DD)', required: true, description: 'تاريخ اليوم المطلوب الاستعلام عن مواعيده (بتوقيت آسيا/الرياض)', example: '2026-11-23' }
        ],
        snippets: {
            curl: `curl -X GET "https://tebiby.com/connect/v1/facilities/1/doctors/4/availability?date=2026-11-23" \\
  -H "Authorization: Bearer sk_live_YOUR_SECRET_KEY" \\
  -H "Accept: application/json"`,
            js: `const response = await fetch(
  "https://tebiby.com/connect/v1/facilities/1/doctors/4/availability?date=2026-11-23",
  {
    method: "GET",
    headers: {
      "Authorization": "Bearer sk_live_YOUR_SECRET_KEY",
      "Accept": "application/json"
    }
  }
);
const data = await response.json();
console.log(data.data.slots);`,
            php: `$client = new \\GuzzleHttp\\Client();
$response = $client->request('GET', 'https://tebiby.com/connect/v1/facilities/1/doctors/4/availability', [
    'query' => ['date' => '2026-11-23'],
    'headers' => [
        'Authorization' => 'Bearer sk_live_YOUR_SECRET_KEY',
        'Accept' => 'application/json',
    ],
]);
$data = json_decode($response->getBody(), true);`,
            python: `import requests

url = "https://tebiby.com/connect/v1/facilities/1/doctors/4/availability"
params = {"date": "2026-11-23"}
headers = {
    "Authorization": "Bearer sk_live_YOUR_SECRET_KEY",
    "Accept": "application/json"
}

res = requests.get(url, headers=headers, params=params)
print(res.json())`
        },
        successStatus: 200,
        successResponse: JSON.stringify({
            status: "success",
            data: {
                facility: { id: 1, name: "مستشفى د. سليمان الحبيب - العليا", timezone: "Asia/Riyadh" },
                doctor: { id: 4, name: "د. عبدالمحسن الشمري", specialty: "طب وجراحة الأسنان", default_fee: "250.00" },
                date: "2026-11-23",
                day_name: "Monday",
                slots: [
                    {
                        start_time: "09:00",
                        end_time: "09:15",
                        status: "available_instant",
                        fee: 250,
                        remaining_capacity: 1,
                        is_available: true
                    },
                    {
                        start_time: "09:15",
                        end_time: "09:30",
                        status: "available_instant",
                        fee: 250,
                        remaining_capacity: 1,
                        is_available: true
                    },
                    {
                        start_time: "09:30",
                        end_time: "09:45",
                        status: "fully_booked",
                        fee: 250,
                        remaining_capacity: 0,
                        is_available: false
                    }
                ]
            }
        }, null, 2),
        errorResponses: [
            {
                status: 400,
                title: 'تاريخ غير صالح أو خارج النطاق',
                json: JSON.stringify({
                    type: "https://tebiby.com/errors/invalid-date",
                    title: "Bad Request",
                    status: 400,
                    detail: "The date query parameter must be a valid future or current date in YYYY-MM-DD format."
                }, null, 2)
            },
            {
                status: 401,
                title: 'مفتاح الربط غير صالح أو منتهي الصلاحية',
                json: JSON.stringify({
                    type: "https://tebiby.com/errors/unauthorized",
                    title: "Unauthorized",
                    status: 401,
                    detail: "Invalid Bearer secret key or credential has expired."
                }, null, 2)
            }
        ]
    },
    {
        id: 'booking-intent',
        method: 'POST',
        path: '/connect/v1/booking-intents',
        title: 'قفل السعر وتوليد رمز الحجز المؤقت (Gate 1B - الخطوة الأولى)',
        subtitle: 'Create Booking Intent & Lock Rate',
        description: 'ينشئ هذا المسار رغبة حجز مؤقتة (Booking Intent) يقفل خلالها سعر الكشف والعيادة لمدة 15 دقيقة، ويصدر رمز مشفر (intent_token) يُستخدم إلزامياً في خطوة تأكيد الحجز.',
        requiresAuth: true,
        authType: 'Bearer sk_live_...',
        headers: [
            { name: 'Authorization', required: true, value: 'Bearer sk_live_YOUR_KEY', description: 'مفتاح الربط السري' },
            { name: 'Content-Type', required: true, value: 'application/json', description: 'نوع محتوى الطلب' },
            { name: 'Accept', required: true, value: 'application/json', description: 'نوع الاستجابة المطلوبة' }
        ],
        params: [
            { name: 'facility_id', location: 'body', type: 'integer', required: true, description: 'معرف المنشأة الطبية', example: '1' },
            { name: 'doctor_id', location: 'body', type: 'integer', required: true, description: 'معرف الطبيب المراد حجز موعد معه', example: '4' },
            { name: 'appointment_date', location: 'body', type: 'string (YYYY-MM-DD)', required: true, description: 'تاريخ الموعد المطلوب', example: '2026-11-23' },
            { name: 'appointment_time', location: 'body', type: 'string (HH:MM)', required: true, description: 'وقت بداية الموعد المحجوز بصيغة 24 ساعة', example: '09:00' },
            { name: 'client_mutation_id', location: 'body', type: 'string (UUID)', required: false, description: 'معرف فريد للعملية من جهة نظامك لمنع تكرار إنشاء الحجز', example: 'd3b07384-d113-469b-b09e-049f7e531e34' }
        ],
        snippets: {
            curl: `curl -X POST "https://tebiby.com/connect/v1/booking-intents" \\
  -H "Authorization: Bearer sk_live_YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "facility_id": 1,
    "doctor_id": 4,
    "appointment_date": "2026-11-23",
    "appointment_time": "09:00"
  }'`,
            js: `const response = await fetch("https://tebiby.com/connect/v1/booking-intents", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_YOUR_SECRET_KEY",
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify({
    facility_id: 1,
    doctor_id: 4,
    appointment_date: "2026-11-23",
    appointment_time: "09:00"
  })
});
const result = await response.json();
console.log(result.data.intent_token);`,
            php: `$response = $client->post('https://tebiby.com/connect/v1/booking-intents', [
    'headers' => [
        'Authorization' => 'Bearer sk_live_YOUR_SECRET_KEY',
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    ],
    'json' => [
        'facility_id' => 1,
        'doctor_id' => 4,
        'appointment_date' => '2026-11-23',
        'appointment_time' => '09:00',
    ],
]);
$data = json_decode($response->getBody(), true);`,
            python: `import requests

res = requests.post(
    "https://tebiby.com/connect/v1/booking-intents",
    headers={"Authorization": "Bearer sk_live_YOUR_SECRET_KEY", "Content-Type": "application/json"},
    json={
        "facility_id": 1,
        "doctor_id": 4,
        "appointment_date": "2026-11-23",
        "appointment_time": "09:00"
    }
)
intent_token = res.json()["data"]["intent_token"]`
        },
        successStatus: 201,
        successResponse: JSON.stringify({
            status: "success",
            data: {
                intent_token: "bit_live_8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
                facility_id: 1,
                doctor_id: 4,
                appointment_date: "2026-11-23",
                appointment_time: "09:00",
                locked_fee: "250.00",
                currency: "SAR",
                expires_at: "2026-11-23T09:15:00+03:00",
                lifespan_seconds: 900
            }
        }, null, 2),
        errorResponses: [
            {
                status: 422,
                title: 'خطأ تحقق في البيانات أو الموعد غير متاح',
                json: JSON.stringify({
                    type: "https://tebiby.com/errors/validation-error",
                    title: "Unprocessable Entity",
                    status: 422,
                    detail: "The selected appointment slot is already fully booked or outside doctor schedule."
                }, null, 2)
            }
        ]
    },
    {
        id: 'create-appointment',
        method: 'POST',
        path: '/connect/v1/facilities/{facility_id}/appointments',
        title: 'تأكيد وحجز الموعد النهائي (Gate 1B - الخطوة الثانية)',
        subtitle: 'Confirm & Book Final Appointment',
        description: 'المسار النهائي لتسجيل الحجز الفعلي في جدول الطبيب ومنظومة الاستقبال، وإصدار رقم التذكرة ورمز الباركود الذكي (QR Code). يتطلب مفتاح منع التكرار X-Idempotency-Key.',
        requiresAuth: true,
        authType: 'Bearer <intent_token> أو sk_live_...',
        headers: [
            { name: 'Authorization', required: true, value: 'Bearer bit_live_...', description: 'رمز النية المؤقت أو المفتاح السري' },
            { name: 'X-Idempotency-Key', required: true, value: 'idemp_req_abc12345678', description: 'مفتاح فريد للطلب لمنع تكرار الحجز عند انقطاع الاتصال' },
            { name: 'Content-Type', required: true, value: 'application/json', description: 'نوع المحتوى' },
            { name: 'Accept', required: true, value: 'application/json', description: 'نوع الاستجابة' }
        ],
        params: [
            { name: 'facility_id', location: 'path', type: 'integer', required: true, description: 'معرف المنشأة في الرابط', example: '1' },
            { name: 'intent_token', location: 'body', type: 'string', required: true, description: 'رمز الحجز المؤقت الصادر من مسار booking-intents', example: 'bit_live_8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b' },
            { name: 'external_patient_id', location: 'body', type: 'string (max 64)', required: true, description: 'رقم الملف الطبي للمريض في نظام المستشفى أو الشريك (HIS Patient ID)', example: 'HIS-REC-90812' },
            { name: 'patient_name', location: 'body', type: 'string (max 100)', required: true, description: 'اسم المريض الثلاثي أو الرباعي', example: 'عبدالعزيز محمد الخالدي' },
            { name: 'patient_phone', location: 'body', type: 'string (+9665xxxxxxxx)', required: true, description: 'رقم جوال المريض المعتمد بصيغة دولية صحيحة', example: '+966512345678' },
            { name: 'notes', location: 'body', type: 'string (max 500)', required: false, description: 'ملاحظات المريض أو شكوى الحجز الأولية', example: 'ألم حاد في الضرس العلوي منذ يومين' },
            { name: 'type', location: 'body', type: 'enum (in_person | video)', required: false, description: 'نوع الزيارة (حضوري بالعيادة أو كشف عن بعد)', example: 'in_person' }
        ],
        snippets: {
            curl: `curl -X POST "https://tebiby.com/connect/v1/facilities/1/appointments" \\
  -H "Authorization: Bearer bit_live_8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b" \\
  -H "X-Idempotency-Key: idemp_req_f47ac10b-58cc-4372-a567-0e02b2c3d479" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "intent_token": "bit_live_8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    "external_patient_id": "HIS-PAT-90812",
    "patient_name": "عبدالعزيز محمد الخالدي",
    "patient_phone": "+966512345678",
    "notes": "ألم حاد في الضرس العلوي"
  }'`,
            js: `const response = await fetch("https://tebiby.com/connect/v1/facilities/1/appointments", {
  method: "POST",
  headers: {
    "Authorization": "Bearer bit_live_8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    "X-Idempotency-Key": "idemp_" + crypto.randomUUID(),
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify({
    intent_token: "bit_live_8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    external_patient_id: "HIS-PAT-90812",
    patient_name: "عبدالعزيز محمد الخالدي",
    patient_phone: "+966512345678",
    notes: "حجز عبر تكامل HIS"
  })
});
const appointment = await response.json();
console.log(appointment.data.booking_reference);`,
            php: `$response = $client->post('https://tebiby.com/connect/v1/facilities/1/appointments', [
    'headers' => [
        'Authorization' => 'Bearer ' . $intentToken,
        'X-Idempotency-Key' => 'idemp_' . uniqid(),
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    ],
    'json' => [
        'intent_token' => $intentToken,
        'external_patient_id' => 'HIS-PAT-90812',
        'patient_name' => 'عبدالعزيز محمد الخالدي',
        'patient_phone' => '+966512345678',
        'notes' => 'حجز عيادة الأسنان',
    ],
]);
$data = json_decode($response->getBody(), true);`,
            python: `import requests, uuid

res = requests.post(
    "https://tebiby.com/connect/v1/facilities/1/appointments",
    headers={
        "Authorization": f"Bearer {intent_token}",
        "X-Idempotency-Key": f"idemp_{uuid.uuid4()}",
        "Content-Type": "application/json"
    },
    json={
        "intent_token": intent_token,
        "external_patient_id": "HIS-PAT-90812",
        "patient_name": "عبدالعزيز محمد الخالدي",
        "patient_phone": "+966512345678"
    }
)
print(res.json()["data"]["booking_reference"])`
        },
        successStatus: 201,
        successResponse: JSON.stringify({
            status: "success",
            data: {
                appointment_id: 142,
                booking_reference: "TEB-OLAYA-20261123-K7M2",
                status: "confirmed",
                facility: { id: 1, name: "مستشفى د. سليمان الحبيب - العليا" },
                doctor: { id: 4, name: "د. عبدالمحسن الشمري" },
                appointment_date: "2026-11-23",
                appointment_time: "09:00",
                queue_number: "A-014",
                patient: {
                    external_patient_id: "HIS-PAT-90812",
                    name: "عبدالعزيز محمد الخالدي",
                    phone: "+966512345678"
                },
                fee_amount: "250.00",
                currency: "SAR",
                qr_code_payload: "TEBIBY:APPT:TEB-OLAYA-20261123-K7M2",
                created_at: "2026-11-22T19:30:00+03:00"
            }
        }, null, 2),
        errorResponses: [
            {
                status: 409,
                title: 'تعارض في مفتاح عدم التكرار (Idempotency Mismatch) أو حجز مكرر',
                json: JSON.stringify({
                    type: "https://tebiby.com/errors/idempotency-mismatch",
                    title: "Conflict",
                    status: 409,
                    detail: "The X-Idempotency-Key has already been used with a different request payload."
                }, null, 2)
            },
            {
                status: 429,
                title: 'تجاوز حد الحجوزات اليومي للرقم (5 حجوزات / يوم)',
                json: JSON.stringify({
                    type: "https://tebiby.com/errors/rate-limit-exceeded",
                    title: "Too Many Requests",
                    status: 429,
                    detail: "Daily booking quota exceeded for this patient phone number (max 5 appointments per day)."
                }, null, 2)
            }
        ]
    },
    {
        id: 'cancel-appointment',
        method: 'POST',
        path: '/connect/v1/facilities/{facility_id}/appointments/{booking_reference}/cancel',
        title: 'إلغاء الموعد واسترداد الحجز',
        subtitle: 'Cancel Appointment & Release Slot',
        description: 'يقوم هذا المسار بإلغاء موعد مؤكد وإعادة إتاحة الوقت والعيادة للمرضى الآخرين، وتحديث حالة التذكرة في شاشات الاستقبال والانتظار.',
        requiresAuth: true,
        authType: 'Bearer sk_live_...',
        headers: [
            { name: 'Authorization', required: true, value: 'Bearer sk_live_YOUR_KEY', description: 'مفتاح الربط السري' },
            { name: 'Content-Type', required: true, value: 'application/json', description: 'نوع المحتوى' },
            { name: 'Accept', required: true, value: 'application/json', description: 'نوع الاستجابة' }
        ],
        params: [
            { name: 'facility_id', location: 'path', type: 'integer', required: true, description: 'معرف المنشأة في الرابط', example: '1' },
            { name: 'booking_reference', location: 'path', type: 'string', required: true, description: 'كود الحجز الطبي الموحد الصادر عند التأكيد', example: 'TEB-OLAYA-20261123-K7M2' },
            { name: 'reason', location: 'body', type: 'string (max 255)', required: false, description: 'سبب الإلغاء المدخل من قبل المريض أو العيادة', example: 'طلب المريض تغيير الموعد لظرف عمل' }
        ],
        snippets: {
            curl: `curl -X POST "https://tebiby.com/connect/v1/facilities/1/appointments/TEB-OLAYA-20261123-K7M2/cancel" \\
  -H "Authorization: Bearer sk_live_YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "reason": "طلب المريض الإلغاء"
  }'`,
            js: `const response = await fetch(
  "https://tebiby.com/connect/v1/facilities/1/appointments/TEB-OLAYA-20261123-K7M2/cancel",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer sk_live_YOUR_SECRET_KEY",
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ reason: "طلب المريض الإلغاء" })
  }
);
const result = await response.json();
console.log(result.status);`,
            php: `$response = $client->post(
    'https://tebiby.com/connect/v1/facilities/1/appointments/TEB-OLAYA-20261123-K7M2/cancel',
    [
        'headers' => [
            'Authorization' => 'Bearer sk_live_YOUR_SECRET_KEY',
            'Content-Type' => 'application/json',
        ],
        'json' => ['reason' => 'طلب المريض الإلغاء'],
    ]
);`,
            python: `import requests

res = requests.post(
    "https://tebiby.com/connect/v1/facilities/1/appointments/TEB-OLAYA-20261123-K7M2/cancel",
    headers={"Authorization": "Bearer sk_live_YOUR_SECRET_KEY"},
    json={"reason": "طلب المريض الإلغاء"}
)`
        },
        successStatus: 200,
        successResponse: JSON.stringify({
            status: "success",
            message: "تم إلغاء الموعد وإعادة فتح الموعد بنجاح.",
            data: {
                booking_reference: "TEB-OLAYA-20261123-K7M2",
                status: "cancelled",
                cancelled_at: "2026-11-22T19:35:12+03:00",
                cancellation_reason: "طلب المريض الإلغاء"
            }
        }, null, 2),
        errorResponses: [
            {
                status: 404,
                title: 'الحجز غير موجود',
                json: JSON.stringify({
                    type: "https://tebiby.com/errors/not-found",
                    title: "Not Found",
                    status: 404,
                    detail: "No appointment found with the provided booking reference."
                }, null, 2)
            }
        ]
    }
];

export const ApiDocsContent: React.FC = () => {
    const [selectedEndpoint, setSelectedEndpoint] = useState<string>(ENDPOINTS[0].id);
    const [activeLang, setActiveLang] = useState<Language>('curl');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const activeEp = ENDPOINTS.find((e) => e.id === selectedEndpoint) || ENDPOINTS[0];

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="space-y-8 font-['Tajawal']" dir="rtl">
            {/* Top Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#005ab5] via-blue-700 to-indigo-900 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                
                <div className="relative z-10 max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-100">
                        <Terminal className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Tebiby Connect API — مواصفات ومعايير الربط البرمجي v1</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black font-['Cairo'] leading-tight">
                        دليل التكامل والربط المباشر مع منظومة طبيبي
                    </h1>

                    <p className="text-sm text-blue-100/90 leading-relaxed">
                        توفر واجهة برمجة تطبيقات <strong className="text-white">Tebiby Connect</strong> لشركاء الرعاية الصحية والمستشفيات تكاملاً آمناً ومباشراً مع أنظمتهم الداخلية (HIS / EMR). يمكنك استعلام المواعيد، قفل الأسعار، وإتمام الحجوزات الطبية في أجزاء من الثانية.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-blue-200">
                        <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 font-mono">
                            <span className="text-gray-400">Base URL:</span>
                            <span className="text-cyan-300 font-bold">https://tebiby.com/connect/v1</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-400/30 text-emerald-300 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>معتمد ومطابق لمعايير HIPAA & NDMO</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout: Sidebar + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
                    <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                        <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider font-['Cairo']">
                            المسارات البرمجية المتاحة
                        </div>

                        <div className="space-y-1.5">
                            {ENDPOINTS.map((ep) => {
                                const isSelected = ep.id === selectedEndpoint;
                                const isGet = ep.method === 'GET';

                                return (
                                    <button
                                        key={ep.id}
                                        type="button"
                                        onClick={() => setSelectedEndpoint(ep.id)}
                                        className={cn(
                                            'w-full text-right p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer group border',
                                            isSelected
                                                ? 'bg-blue-50/80 border-blue-200 shadow-xs'
                                                : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'px-2 py-0.5 rounded-lg text-[10px] font-black font-mono shrink-0 mt-0.5',
                                                isGet
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-blue-100 text-[#005ab5]'
                                            )}
                                        >
                                            {ep.method}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div
                                                className={cn(
                                                    'text-xs font-bold truncate leading-snug',
                                                    isSelected ? 'text-[#005ab5]' : 'text-slate-800 group-hover:text-slate-900'
                                                )}
                                            >
                                                {ep.title}
                                            </div>
                                            <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5 dir-ltr text-left">
                                                {ep.path.replace('/connect/v1', '')}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Authentication quick card */}
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-['Cairo']">
                            <Lock className="w-4 h-4" />
                            <span>المصادقة والتوثيق الأمني</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            جميع الطلبات البرمجية تتطلب إرسال الترويسة التالية في الـ Request Headers:
                        </p>
                        <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-700/60 select-all dir-ltr text-left">
                            Authorization: Bearer sk_live_...
                        </div>
                        <p className="text-[11px] text-slate-400">
                            ملاحظة: مفتاح الـ Live يعمل فقط مع بيانات الإنتاج الحقيقية، بينما Sandbox مخصص للاختبار والمحاكاة.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Endpoint Header Card */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <span
                                    className={cn(
                                        'px-2.5 py-1 rounded-xl text-xs font-black font-mono shadow-xs',
                                        activeEp.method === 'GET'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-[#005ab5] text-white'
                                    )}
                                >
                                    {activeEp.method}
                                </span>
                                <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 dir-ltr select-all">
                                    {activeEp.path}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => copyToClipboard(activeEp.path, 'path')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                {copiedKey === 'path' ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700">تم النسخ</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>نسخ المسار</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div>
                            <h2 className="text-xl font-black font-['Cairo'] text-slate-900">
                                {activeEp.title}
                            </h2>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                {activeEp.subtitle}
                            </p>
                            <p className="text-sm text-slate-600 leading-relaxed mt-2.5">
                                {activeEp.description}
                            </p>
                        </div>
                    </div>

                    {/* Headers Table */}
                    {activeEp.headers && activeEp.headers.length > 0 && (
                        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                            <h3 className="text-sm font-bold font-['Cairo'] text-slate-900 flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-[#005ab5]" />
                                <span>ترويسات الطلب المطلوبة (Request Headers)</span>
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-bold font-['Cairo']">
                                            <th className="pb-2.5 font-bold">الاسم</th>
                                            <th className="pb-2.5 font-bold">الحالة</th>
                                            <th className="pb-2.5 font-bold">مثال للقيمة</th>
                                            <th className="pb-2.5 font-bold">الوصف</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activeEp.headers.map((h, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="py-3 font-mono font-bold text-slate-800">{h.name}</td>
                                                <td className="py-3">
                                                    {h.required ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                                            مطلوب Required
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                            اختياري Optional
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 font-mono text-slate-600 dir-ltr text-left">{h.value}</td>
                                                <td className="py-3 text-slate-500">{h.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Parameters Table: Required vs Optional explicitly labeled */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold font-['Cairo'] text-slate-900 flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-[#005ab5]" />
                                <span>المعاملات والحقول البرمجية (Parameters & Payload)</span>
                            </h3>
                            <span className="text-[11px] text-slate-400 font-bold">
                                {activeEp.params.filter(p => p.required).length} حقول مطلوبة إلزامياً
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-bold font-['Cairo']">
                                        <th className="pb-3 font-bold">اسم الحقل</th>
                                        <th className="pb-3 font-bold">الموقع</th>
                                        <th className="pb-3 font-bold">النوع</th>
                                        <th className="pb-3 font-bold">الإلزامية</th>
                                        <th className="pb-3 font-bold">الوصف والتفاصيل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeEp.params.map((param, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 font-mono font-bold text-slate-900">
                                                {param.name}
                                                {param.example && (
                                                    <span className="block text-[10px] font-normal text-slate-400 font-mono mt-0.5">
                                                        مثال: {param.example}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 font-mono text-[11px] text-slate-500">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold">
                                                    {param.location}
                                                </span>
                                            </td>
                                            <td className="py-3.5 font-mono text-[11px] text-blue-600 font-bold">
                                                {param.type}
                                            </td>
                                            <td className="py-3.5">
                                                {param.required ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                        مطلوب Required
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                        اختياري Optional
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 text-slate-600 leading-relaxed">
                                                {param.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Code Snippets & Language Switcher */}
                    <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold font-['Cairo'] text-slate-200">
                                    نموذج الكود البرمجي للتنفيذ
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                                {(['curl', 'js', 'php', 'python'] as Language[]).map((lang) => (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => setActiveLang(lang)}
                                        className={cn(
                                            'px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase font-mono cursor-pointer',
                                            activeLang === lang
                                                ? 'bg-[#005ab5] text-white shadow-xs'
                                                : 'text-slate-400 hover:text-white'
                                        )}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 dir-ltr text-left">
                                <code>{activeEp.snippets[activeLang]}</code>
                            </pre>

                            <button
                                type="button"
                                onClick={() => copyToClipboard(activeEp.snippets[activeLang], 'snippet')}
                                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                                title="نسخ الكود"
                            >
                                {copiedKey === 'snippet' ? (
                                    <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Responses (Success & Errors) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Success Response */}
                        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs font-bold font-['Cairo'] text-slate-900">
                                        استجابة النجاح ({activeEp.successStatus})
                                    </span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 font-mono">
                                    HTTP {activeEp.successStatus} OK
                                </span>
                            </div>

                            <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed dir-ltr text-left max-h-72">
                                <code>{activeEp.successResponse}</code>
                            </pre>
                        </div>

                        {/* Error Response Example */}
                        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs font-bold font-['Cairo'] text-slate-900">
                                        نموذج الخطأ القياسي (RFC 7807)
                                    </span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 font-mono">
                                    HTTP {activeEp.errorResponses[0]?.status}
                                </span>
                            </div>

                            <pre className="p-3.5 rounded-2xl bg-slate-900 text-rose-300 font-mono text-[11px] overflow-x-auto leading-relaxed dir-ltr text-left max-h-72">
                                <code>{activeEp.errorResponses[0]?.json}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
