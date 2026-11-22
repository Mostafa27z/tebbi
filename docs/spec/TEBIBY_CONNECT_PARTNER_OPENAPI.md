# دليل الربط البرمجي للشركاء والمطورين — منصة طبيبي (Tebiby Connect Partner Reference)
## OpenAPI 3.1 Specification, Public Status Matrix, and Developer Integration Guide

> **الإصدار:** 2.4.0 (Connect Public API Contract & Partner Reference)  
> **تاريخ التحديث:** نوفمبر 2026  
> **البيئة المباشرة (Base URL Live):** `https://api.tebiby.com/v1/connect`  
> **البيئة التجريبية (Base URL Sandbox):** `https://sandbox-api.tebiby.com/v1/connect`  
> **المرجعية النظامية:** نظام حماية البيانات الشخصية السعودي (PDPL).  
> **ملف المواصفات الآلي (OpenAPI 3.1 YAML):** [docs/api/openapi.yaml](file:///g:/Web/Projects/freelancer/tebbi/docs/api/openapi.yaml)  
> **تقرير التدقيق الفعلي للكود:** [REPO_AUDIT_2.md](file:///g:/Web/Projects/freelancer/tebbi/REPO_AUDIT_2.md)

---

## 1. نظرة عامة وقواعد المصادقة والتوقيت (Authentication, Scopes & Timezone)

تعتمد واجهة **Tebiby Connect API** نظام المصادقة المزدوج الصارم (Dual-Key Authentication):

1. **المفتاح العام (`X-Publishable-Key`):**
   * يبدأ بـ `tb_live_pk_...` (أو `tb_test_pk_...` في بيئة الاختبار).
   * مخصص للاستخدام في تطبيقات الهواتف الذكية ومتصفحات الويب (Client-Side).
   * يقتصر على استعراض الدليل العام (الفروع، التخصصات، الأطباء، الخدمات، المواعيد المتاحة) وقراءة طابور الانتظار بواسطة الـ `public_token`.
2. **المفتاح السري (`Authorization: Bearer <Secret_Key>`):**
   * يبدأ بـ `tb_live_sk_...` (أو `tb_test_sk_...` في بيئة الاختبار).
   * **يُحظر كشفه نهائياً في تطبيقات المريض أو المتصفحات**، ويقتصر استخدامه على خوادم الشركاء (Server-to-Server).
   * إلزامي لإنشاء جلسات نية الحجز (`POST /booking-intents`)، وإلغاء المواعيد، ومطابقة التحديثات، وإدارة الـ Webhooks وتدوير الأسرار واستعراض سجلات التسليم.
3. **صلاحيات المفاتيح الرسمية (Credential Scopes):**
   * تدعم المنظومة الصلاحيات التالية لكل منشأة:
     * `read`: استعراض الدليل وتفاصيل التوفر.
     * `book`: إنشاء نيات وحجوزات المواعيد.
     * `cancel`: إلغاء المواعيد المحجوزة.
     * `webhooks`: إدارة واستقبال إشعارات المواعيد الخاصة بالمفتاح.
     * `facility_wide`: استقبال أحداث كافة مواعيد المنشأة (بما فيها الحجوزات المباشرة وحجوزات الاستقبال). يتطلب موافقة خطية صريحة مسبقة من إدارة المنشأة لكل مفتاح، ويخضع لتدقيق مشدد نظراً لمخاطر إعادة التعرف المتبقية (Residual Re-identification Risk).
4. **توكن نية الحجز الموقعة (`Authorization: Bearer <Intent_Token>`):**
   * يبدأ بـ `bit_live_...` (أو `bit_test_...` في بيئة الاختبار).
   * يُصدر حصرياً عبر خادم الشريك من مسار `POST /booking-intents` بعد التحقق من السعر الإجمالي وجدول الطبيب.
   * إلزامي ومفرد الاستخدام (Single-Use) وصالح لمدة 15 دقيقة فقط من لحظة إنشائه لإنشاء الحجز النهائي عبر `POST /appointments`.
5. **ترويسة منع التكرار (`Idempotency-Key`):**
   * رمز فريد (UUID v4) إلزامي في كافة العمليات التعديلية (`POST /appointments`, `POST /appointments/{ref}/cancel`)؛ وغيابه يُرجع فورياً كود **`400 Bad Request`** مع الرمز `ERR_IDEMPOTENCY_KEY_REQUIRED`.
   * إذا انقطع اتصال التطبيق أو أعاد المحاولة بنفس الرمز، يُعيد الخادم الاستجابة الأصلية فوراً مصحوبة بترويسة `Idempotent-Replay: true`.
6. **التوقيت الزمني الصريح (Timezone & ISO 8601):**
   * كافة الحقول الزمنية في الاستجابات والـ Webhooks تلتزم بصيغة **ISO 8601 UTC الموحدة**: `YYYY-MM-DDTHH:mm:ssZ`. أما أوقات وتواريخ المواعيد في الحمولات (`appointment_date`, `appointment_time`) فتمثل التوقيت المحلي لعيادات المملكة العربية السعودية (`Asia/Riyadh`، UTC+3)، ويتم التحقق من عدم كونها في الماضي بمقارنتها صراحةً بتوقيت الرياض: `Carbon::parse("{$date} {$time}", "Asia/Riyadh")->isPast()`.

---

## 2. جدول مواءمة الحالات العام (Public Status Mapping)

تعتمد كافة الـ Endpoints والـ Webhooks التسميات العامة القياسية التالية (لا يتم إخراج السلاسل السريرية الداخلية أبداً):

| الحالة العامة المعتمدة (`status`) | الوصف الدلالي للمريض والشريك الخارجي |
| :--- | :--- |
| `pending_confirmation` | الموعد مسجل في قائمة الانتظار وبانتظار تأكيد إدارة المنشأة. |
| `confirmed` | الحجز مؤكد رسمياً وبانتظار حضور المريض في الموعد المحدد. |
| `checked_in` | المريض وصل صالة الاستقبال بالعيادة وحصل على تذكرة انتظار حية. |
| `in_progress` | المريض داخل غرفة الفحص السريري مع الطبيب المعالج حالياً. |
| `completed` | اكتمل الكشف الطبي وغادر المريض العيادة وصُرفت التوصيات/الروشتة. |
| `cancelled` | الموعد ملغي بناءً على طلب الشريك، أو سُجل عدم حضور (No-Show). |

---

## 3. كتالوج رموز الأخطاء القياسية (Standard RFC 7807 Error Catalog)

تُعاد كافة الأخطاء بترويسة `Content-Type: application/problem+json; charset=utf-8` بصيغة Problem Details الموحدة:

```json
{
  "type": "https://api.tebiby.com/errors/ERR_SLOT_NOT_AVAILABLE",
  "title": "Slot Not Available",
  "status": 422,
  "code": "ERR_SLOT_NOT_AVAILABLE",
  "detail": "عذراً، الموعد المختار لم يعد متاحاً أو اكتملت طاقته الاستيعابية.",
  "request_id": "req_01HJ8Z7K99M88A123BC",
  "timestamp": "2026-11-22T01:30:00Z",
  "invalid_params": []
}
```

| رمز الخطأ (`code`) | كود HTTP | الوصف البرمجي | الإجراء الموصى به للمطور |
| :--- | :---: | :--- | :--- |
| `ERR_UNAUTHORIZED` | 401 | مفتاح API مفقود، منتهي الصلاحية، أو غير مطابق للبيئة الحالية. | التحقق من ترويسة `Authorization` أو `X-Publishable-Key`. |
| `ERR_FORBIDDEN_SCOPE` | 403 | المنشأة مصرح بها ولكن المفتاح يفتقر للصلاحية المحددة لهذه العملية. | استخدام مفتاح سري يمتلك صلاحية الإجراء (`book`, `cancel`, إلخ). |
| `ERR_RESOURCE_NOT_FOUND` | 404 | المورد غير موجود أو يتبع لمنشأة غير مشمولة في مفتاحك (Fail-Silent). | التأكد من صحة المعرف وشموله ضمن صلاحيات مفتاحك. |
| `ERR_IDEMPOTENCY_KEY_REQUIRED` | 400 | ترويسة منع التكرار `Idempotency-Key` مفقودة في طلب تعديلي. | تمرير ترويسة `Idempotency-Key` بقيمة UUID v4 صحيحة. |
| `ERR_VALIDATION_FAILED` | 422 | فشل التحقق من صحة المدخلات (مثل صيغة الهاتف غير المتوافقة مع E.164). | مراجعة مصفوفة `invalid_params` وتصحيح المدخلات. |
| `ERR_CONFLICT_IN_FLIGHT` | 409 | يوجد طلب متطابق بنفس الـ `Idempotency-Key` قيد التنفيذ حالياً. | الانتظار من 2 إلى 3 ثوانٍ قبل إعادة المحاولة. |
| `ERR_PATIENT_IDENTITY_CONFLICT` | 409 | المعرف الخارجي للمريض مسجل مسبقاً بهاتف أو اسم مختلف؛ تعديل الهوية محظور. | التأكد من صحة معرف المريض الخارجي وعدم استخدامه لمرضى مختلفين. |
| `ERR_INVALID_STATE` | 409 | حالة الموعد لا تسمح بتنفيذ العملية (مثل محاولة إلغاء موعد بدأ كشفه). | تحديث حالة الموعد محلياً وإخطار المستخدم. |
| `ERR_INTENT_EXPIRED_OR_USED` | 410 | توكن نية الحجز استُهلك مسبقاً أو تجاوز مهلته الزمنية (15 دقيقة من إنشائه). | إنشاء جلسة حجز جديدة عبر `POST /booking-intents`. |
| `ERR_PRICE_MISMATCH` | 422 | السعر المتوقع المرسل لا يطابق السعر المعتمد للخدمة شامل الضريبة 15%. | جلب أحدث قائمة أسعار شاملة الضريبة وإعادة المحاولة. |
| `ERR_SLOT_NOT_AVAILABLE` | 422 | اكتملت الطاقة الاستيعابية الفورية وقائمة الانتظار في هذا الموعد. | اختيار موعد بديل عبر `GET /availability`. |
| `ERR_SLOT_OUTSIDE_SCHEDULE` | 422 | الموعد يقع في الماضي أو خارج جدول دوام الطبيب المعتمد (`DoctorSchedule`). | اختيار موعد متطابق مع نافذة دوام الطبيب. |
| `ERR_SERVICE_MISMATCH` | 422 | الخدمة المطلوبة لا تتبع للطبيب أو المنشأة المحددة. | التأكد من معرف الخدمة عبر مسار `GET /doctors/{id}/services`. |
| `ERR_PAYLOAD_MISMATCH` | 422 | تم إرسال نفس `Idempotency-Key` ببيانات مختلفة عن الطلب السابق. | توليد UUID v4 جديد لكل طلب يحمل بيانات جديدة. |
| `ERR_DAILY_PHONE_LIMIT` | 422 | تجاوز رقم هاتف المريض الحد الأقصى للحجوزات اليومية (5 حجوزات/يوم). | إبلاغ المريض بضرورة مراجعة العيادة أو الانتظار لليوم التالي. |
| `ERR_RATE_LIMIT_EXCEEDED` | 429 | تجاوز الحد المسموح به من الطلبات في الدقيقة. | تطبيق خوارزمية التراجع الأسي (Exponential Backoff). |
| `ERR_NOT_IMPLEMENTED` | 501 | المسار محجوز لمرحلة قادمة (مثل إعادة الجدولة). | مراجعة وثائق الإصدار الحالي. |
| `ERR_INTERNAL_SERVER` | 500 | خطأ غير متوقع في محرك المعالجة الداخلي. | إعادة المحاولة فورياً (المفتاح تم حذفه للسماح بالـ Retry). |

---

## 4. نقاط النهاية المتاحة (API Endpoints Reference)

### 4.1 استعراض الفروع المصرح بها
* **المسار:** `GET /branches`
* **المصادقة:** المفتاح العام أو السري.
* **استجابة النجاح (200 OK):**
```json
{
  "data": [
    {
      "id": 10,
      "name_ar": "مجمع عيادات النخبة الطبي - الفرع الرئيسي",
      "city": "الرياض",
      "district": "حي النخيل",
      "phone": "+966112003000",
      "is_active": true
    }
  ]
}
```

---

### 4.2 استعراض التخصصات الطبية
* **المسار:** `GET /specialties?facility_id=10`
* **المصادقة:** المفتاح العام أو السري.
* **استجابة النجاح (200 OK):**
```json
{
  "data": [
    {
      "id": 4,
      "name_ar": "طب وجراحة الأسنان"
    }
  ]
}
```

---

### 4.3 استعراض الأطباء
* **المسار:** `GET /doctors?facility_id=10&specialty_id=4`
* **المصادقة:** المفتاح العام أو السري.
* **استجابة النجاح (200 OK):**
```json
{
  "data": [
    {
      "id": 45,
      "name_ar": "د. أحمد الشمري",
      "title": "استشاري تقويم الأسنان",
      "specialty_id": 4,
      "specialty_name": "طب وجراحة الأسنان",
      "photo_url": "https://cdn.tebiby.com/doctors/45.jpg"
    }
  ]
}
```

---

### 4.4 استعراض خدمات وأسعار الطبيب (شفافية الضريبة)
* **المسار:** `GET /doctors/45/services?facility_id=10`
* **المصادقة:** المفتاح العام أو السري.
* **استجابة النجاح (200 OK):**
```json
{
  "data": [
    {
      "id": 12,
      "name_ar": "كشف استشاري تقويم أسنان",
      "base_fee": 250.00,
      "vat_rate": 0.15,
      "vat_amount": 37.50,
      "total_fee": 287.50
    }
  ]
}
```

---

### 4.5 فحص المواعيد المتاحة للعيادة
* **المسار:** `GET /doctors/45/availability?facility_id=10&date=2026-11-25`
* **المصادقة:** المفتاح العام أو السري.
* **استجابة النجاح (200 OK):**
```json
{
  "date": "2026-11-25",
  "doctor_id": 45,
  "facility_id": 10,
  "slot_auto_confirm_limit": 1,
  "slot_waitlist_limit": 2,
  "slots": [
    {
      "time": "17:00",
      "formatted_time": "05:00 م",
      "status": "available_instant",
      "remaining_capacity": 2
    },
    {
      "time": "17:30",
      "formatted_time": "05:30 م",
      "status": "available_waitlist",
      "remaining_capacity": 1
    },
    {
      "time": "18:00",
      "formatted_time": "06:00 م",
      "status": "fully_booked",
      "remaining_capacity": 0
    }
  ]
}
```

---

### 4.6 توليد نية الحجز الموقعة (Create Booking Intent)
* **المسار:** `POST /booking-intents`
* **المصادقة:** **المفتاح السري حصراً (Server-to-Server).**
* **ملاحظة صلاحية التوكن:** تاريخ `expires_at` يُحدد بدقة كـ **15 دقيقة من لحظة إنشاء النية** (`created_at + 15 minutes`) ولا يرتبط بوقت الموعد الطبي.
* **جسم الطلب (Request Body):**
```json
{
  "facility_id": 10,
  "doctor_id": 45,
  "doctor_service_id": 12,
  "appointment_date": "2026-11-25",
  "appointment_time": "17:00",
  "expected_fee": 287.50
}
```
* **استجابة النجاح (201 Created):**
```json
{
  "intent_token": "bit_live_9a8b7c6d5e4f3a2b1c0d",
  "expires_at": "2026-11-22T01:45:00Z",
  "facility_id": 10,
  "doctor_id": 45,
  "appointment_date": "2026-11-25",
  "appointment_time": "17:00",
  "base_fee": 250.00,
  "vat_amount": 37.50,
  "expected_fee": 287.50
}
```

---

### 4.7 تأكيد وإنشاء الحجز النهائي (Create Appointment)
* **المسار:** `POST /appointments`
* **المصادقة:** `Authorization: Bearer <bit_...>` (توكن نية الحجز).
* **الترويسات الإلزامية:** `Idempotency-Key: <UUID_v4>`
* **ملاحظة ملاحظات المريض:** حقل `patient_notes` قيد اعتماد العميل (Pending client approval) وبحد أقصى 500 حرف ويُشطب من السجلات ولا يُرسل في الـ Webhooks.
* **جسم الطلب (Request Body):**
```json
{
  "patient_name": "سارة محمد أحمد",
  "patient_phone": "+966501234567",
  "payment_method": "at_clinic",
  "external_appointment_id": "HOSP-94821",
  "external_patient_id": "PAT-00381",
  "send_whatsapp_notification": false,
  "patient_notes": "مراجعة دورية"
}
```
* **استجابة النجاح (201 Created):**
```json
{
  "booking_reference": "TB-SR8492",
  "external_appointment_id": "HOSP-94821",
  "public_token": "ptk_live_e9a1b2c3d4e5f6a7b8c9d0e1",
  "status": "confirmed",
  "ticket": {
    "ticket_number": 8,
    "current_serving": 4,
    "patients_ahead": 3,
    "estimated_wait_minutes": 45
  },
  "doctor": {
    "id": 45,
    "name": "د. أحمد الشمري",
    "title": "استشاري تقويم الأسنان"
  },
  "facility": {
    "id": 10,
    "name": "مجمع عيادات النخبة الطبي"
  },
  "schedule": {
    "date": "2026-11-25",
    "time": "17:00",
    "formatted_time": "05:00 م"
  },
  "payment": {
    "method": "at_clinic",
    "status": "pending",
    "currency": "SAR",
    "amount": 287.50
  }
}
```
* **أبرز استجابات الأخطاء المحتملة:**
  * **`400 Bad Request` (`ERR_IDEMPOTENCY_KEY_REQUIRED`):** غياب ترويسة منع التكرار `Idempotency-Key`.
  * **`409 Conflict` (`ERR_PATIENT_IDENTITY_CONFLICT`):** تعارض هوية المريض؛ المعرف الخارجي `external_patient_id` مسجل مسبقاً بهاتف أو اسم مختلف.
  * **`409 Conflict` (`ERR_CONFLICT_IN_FLIGHT`):** طلب متطابق بنفس الـ `Idempotency-Key` قيد المعالجة حالياً.
  * **`410 Gone` (`ERR_INTENT_EXPIRED_OR_USED`):** توكن نية الحجز منتهي الصلاحية أو مستهلك مسبقاً.
  * **`422 Unprocessable Content` (`ERR_SLOT_NOT_AVAILABLE`):** اكتمال الطاقة الاستيعابية.
  * **`422 Unprocessable Content` (`ERR_DAILY_PHONE_LIMIT`):** تجاوز سقف الحجوزات اليومية (5 حجوزات نشطة).

---

### 4.8 تتبع الدور الحي والانتظار للواجهات العامة (Live Queue Lookup)
* **المسار:** `GET /queue/{public_token}`
* **المصادقة:** المفتاح العام (`X-Publishable-Key`) أو المفتاح السري.
* **ملاحظة تشغيلية:** يُعرض حقل `delay_minutes` ورمز `delay_reason_code` عند حدوث أي تأخير بالعيادة في هذا الاستعلام المباشر، بينما لا يتم إطلاق أي حدث Webhook للتأخير في المرحلة الأولى.
* **استجابة النجاح (200 OK):**
```json
{
  "ticket_number": 8,
  "current_serving_number": 6,
  "patients_ahead": 1,
  "estimated_wait_minutes": 15,
  "status": "checked_in",
  "is_your_turn": false,
  "delay_minutes": 10,
  "delay_reason_code": "PROCEDURE_OVERRUN",
  "scheduled_time": "05:00 م",
  "expected_time": "05:25 م"
}
```

---

### 4.9 تسوية ومطابقة المواعيد المحدثة (Reconciliation API)
* **المسار:** `GET /appointments?updated_since=2026-11-22T00:00:00Z&page=1&per_page=50`
* **معامل الاحتياط (Fallback):** `GET /appointments?date=2026-11-25&page=1&per_page=50` (لمطابقة مواعيد يوم كامل في حال حدوث تحديثات مجمعة في لوحة التحكم لم تُحدث `updated_at`).
* **المصادقة:** المفتاح السري حصراً.
* **استجابة النجاح (200 OK):**
```json
{
  "data": [
    {
      "booking_reference": "TB-SR8492",
      "external_appointment_id": "HOSP-94821",
      "status": "checked_in",
      "updated_at": "2026-11-22T16:45:10Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 50,
    "total_records": 182,
    "total_pages": 4,
    "next_page": "https://api.tebiby.com/v1/connect/appointments?updated_since=2026-11-22T00:00:00Z&page=2&per_page=50",
    "prev_page": null
  }
}
```

---

### 4.10 إلغاء الموعد (Cancel Appointment)
* **المسار:** `POST /appointments/{booking_reference}/cancel`
* **المصادقة:** المفتاح السري حصراً.
* **الترويسات الإلزامية:** `Idempotency-Key: <UUID_v4>`
* **ملاحظة سبب الإلغاء:** حقل `cancellation_reason` قيد اعتماد العميل (Pending client approval) وبحد أقصى 500 حرف.
* **جسم الطلب (Request Body):**
```json
{
  "cancellation_reason": "طلب المريض - ظروف خاصة"
}
```
* **استجابة النجاح (200 OK):**
```json
{
  "booking_reference": "TB-SR8492",
  "status": "cancelled",
  "cancelled_at": "2026-11-22T01:36:00Z"
}
```

---

### 4.11 إعادة جدولة الموعد (Reschedule Appointment - Reserved)
* **المسار:** `PATCH /appointments/{booking_reference}/reschedule`
* **الحالة:** **محجوز للمرحلة القادمة (Reserved Endpoint).**
* يُرجع الخادم دائماً في المرحلة الأولى كود **`501 Not Implemented`** مع الرمز `ERR_NOT_IMPLEMENTED`.

---

### 4.12 إدارة نقاط الـ Webhooks والتدقيق وتدوير الأسرار
* **عرض النقاط المسجلة:** `GET /webhooks` (المفتاح السري) -> يُرجع مصفوفة `data` من كائنات النقاط المسجلة.
* **استعراض نقطة محددة:** `GET /webhooks/{id}` (المفتاح السري).
* **تسجيل نقطة جديدة:**
  * **المسار:** `POST /webhooks`
  * **جسم الطلب:**
    ```json
    {
      "url": "https://hospital.com/api/tebiby-events",
      "events": [
        "appointment.confirmed",
        "appointment.checked_in",
        "appointment.completed",
        "appointment.cancelled"
      ]
    }
    ```
  * **استجابة النجاح (201 Created):** تُرجع كائن النقطة متضمناً سر التوقيع `secret` (يبدأ بـ `whsec_...`) **مرة واحدة فقط**.
* **حذف نقطة:** `DELETE /webhooks/{id}` (المفتاح السري) -> `204 No Content`.
* **تدوير سر التوقيع مع فترة سماح 24 ساعة:**
  * **المسار:** `POST /webhooks/{id}/rotate-secret`
  * **استجابة النجاح (200 OK):**
    ```json
    {
      "new_secret": "whsec_live_a1b2c3d4e5f6g7h8i9j0k1l2",
      "grace_period_expires_at": "2026-11-23T01:30:00Z"
    }
    ```
* **استعراض سجلات التدقيق لمحاولات التسليم:**
  * **المسار:** `GET /webhooks/{id}/deliveries?page=1`
  * **استجابة النجاح (200 OK):**
    ```json
    {
      "data": [
        {
          "delivery_id": "del_01HJ8Z8871MN4499XA",
          "event_id": "evt_01HJ8Z7K99M88A123BC",
          "event": "appointment.confirmed",
          "status": "success",
          "attempts": 1,
          "response_code": 200,
          "delivered_at": "2026-11-22T01:30:05Z",
          "created_at": "2026-11-22T01:30:00Z"
        }
      ],
      "meta": {
        "current_page": 1,
        "per_page": 20,
        "total_records": 45,
        "total_pages": 3,
        "next_page": "https://api.tebiby.com/v1/connect/webhooks/1/deliveries?page=2&per_page=20",
        "prev_page": null
      }
    }
    ```
* **إعادة إرسال محاولة فاشلة يدوياً:**
  * **المسار:** `POST /webhooks/deliveries/{delivery_id}/redeliver`
  * **استجابة النجاح (202 Accepted):**
    ```json
    {
      "status": "queued",
      "delivery_id": "del_01HJ8Z8871MN4499XA",
      "queued_at": "2026-11-22T01:35:00Z"
    }
    ```

---

### 4.13 تصفير البيئة التجريبية (Reset Sandbox - Sandbox Only)
* **المسار:** `POST /sandbox/reset` (متاح فقط عندما يكون `APP_ENV=sandbox`).
* **المصادقة:** المفتاح السري التجريبي (`tb_test_sk_...`).
* **استجابة النجاح (200 OK):**
```json
{
  "success": true,
  "message": "Sandbox database purged and re-seeded successfully.",
  "purged_records": {
    "appointments": 24,
    "links": 24,
    "intents": 18,
    "idempotency_keys": 42,
    "outbox": 30,
    "logs": 115
  },
  "reseeded_catalog": {
    "facilities": 2,
    "doctors": 6,
    "schedules": 36,
    "services": 12
  }
}
```

---

## 5. أحداث الإشعارات اللحظية والتحقق الأمني (Webhooks Guide)

### 1. أحداث المرحلة الأولى المعتمدة:
* `appointment.confirmed`: تأكيد الحجز فورياً.
* `appointment.pending_confirmation`: إدراج الموعد في قائمة الانتظار.
* `appointment.checked_in`: تسجيل حضور المريض بالعيادة وحصوله على دور حي.
* `appointment.in_progress`: بدء الكشف الطبي ودخول المريض غرفة الطبيب.
* `appointment.completed`: اكتمال الكشف وصرف التوصيات/الروشتة.
* `appointment.cancelled`: إلغاء الموعد.

### 2. بنية الحمولة المجردة لكل حدث (Thin Payload Schema):
```json
{
  "id": "evt_01HJ8Z7K99M88A123BC",
  "event": "appointment.confirmed",
  "timestamp": "2026-11-22T01:30:00Z",
  "sequence": 1042,
  "data": {
    "booking_reference": "TB-SR8492",
    "external_appointment_id": "HOSP-94821",
    "status": "confirmed",
    "facility_id": 10,
    "doctor_id": 45,
    "appointment_date": "2026-11-25",
    "appointment_time": "17:00",
    "ticket_number": 8
  }
}
```

### 3. الترويسات القياسية المرسلة:
```http
X-Tebiby-Event-Id: evt_01HJ8Z7K99M88A123BC
X-Tebiby-Delivery-Id: del_01HJ8Z8871MN4499XA
X-Tebiby-Timestamp: 1700949000
X-Tebiby-Sequence: 1042
X-Tebiby-Environment: live
X-Tebiby-Signature: t=1700949000,v1=9f8a3c428172bc910a88...
Content-Type: application/json; charset=utf-8
```

### 4. حماية الـ SSRF الصارمة (Extended SSRF Blocklist):
يُحظر استخدام أي عنوان ضمن النطاقات التالية: `0.0.0.0/8`, `127.0.0.0/8`, `::1`, `::ffff:127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `100.64.0.0/10`, `fe80::/10`, `fc00::/7`، وتُفحص الروابط عند التسجيل وتُثبت بـ Socket Pinning عند الإرسال الفعلي.

### 5. كود التحقق المعتمد في Node.js / TypeScript:
```typescript
import crypto from 'crypto';

export function verifyTebibyWebhook(
  rawPayload: string,
  signatureHeader: string,
  secretKey: string
): boolean {
  const parts = signatureHeader.split(',');
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
  const signature = parts.find((p) => p.startsWith('v1='))?.slice(3);

  if (!timestamp || !signature) return false;

  // الحماية من هجمات Replay (رفض الطلبات الأقدم من 5 دقائق)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(signedPayload)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}
```
