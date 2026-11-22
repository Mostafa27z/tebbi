# دليل تكامل الشركاء التجاريين — واجهة طبيبي كونكت (Tebiby Connect API Partner Integration Guide)

> **الإصدار:** 1.0.0 (Connect API v1)  
> **تاريخ التحديث:** نوفمبر 2026  
> **الجمهور المستهدف:** المطورون ومهندسو التكامل في شركات التأمين، تطبيقات حجز المواعيد، وأنظمة إدارة المستشفيات (HIS / ERP).

---

## 1. نظرة عامة على واجهة طبيبي كونكت (Overview)

واجهة **طبيبي كونكت (Tebiby Connect API)** هي واجهة برمجية سحابية موحدة تربط الشركاء الخارجيين مباشرة بمرافق وشبكة أطباء طبيبي، مما يتيح:
1. **استعراض الدليل الطبي المباشر:** استعلام الفروع، التخصصات، الأطباء، والخدمات المتاحة لكل فرع.
2. **الاستعلام الدقيق عن التوفر:** معرفة الفترات الزمنية المتاحة (Slots) في الوقت الفعلي مع مراعاة جداول الأطباء وسعة الحجز الفوري وقوائم الانتظار.
3. **تنفيذ وإدارة الحجوزات:** إنشاء وتأكيد وإلغاء المواعيد دون تدخل يدوي من موظفي الاستقبال.
4. **تتبع الطابور الحي الذكي (Smart Live Queue Tracking):** تتبع رقم التذكرة، الرقم الحالي قيد الكشف، وقت الانتظار التقديري، وأي تأخيرات طارئة عبر رمز عام آمن (`public_token`).

---

## 2. البيئات وعناوين الاتصال (Environments & Base URLs)

| البيئة | النطاق الأساسي (Base URL) | نوع المفاتيح | الغرض |
| :--- | :--- | :--- | :--- |
| **التجريبية (Sandbox)** | `https://sandbox-api.tebiby.com/connect/v1` | `pk_test_...` / `sk_test_...` | التطوير، الاختبار، ومحاكاة الحجوزات دون إرسال رسائل حقيقية |
| **الإنتاجية (Live / Production)** | `https://api.tebiby.com/connect/v1` | `pk_live_...` / `sk_live_...` | الحجوزات الفعلية لمرضى المنشآت الحقيقية |

> [!IMPORTANT]
> **صمام الأمان للبيئات (Boot Guard):**  
> مفاتيح البيئة التجريبية (`*_test_*`) لا تعمل نهائياً على بيئة الإنتاج، ومفاتيح الإنتاج (`*_live_*`) لا تعمل على البيئة التجريبية؛ سيرفض الخادم الطلب فورياً برمز خطأ `500` إذا حدث تضارب بين المفتاح والبيئة.

---

## 3. التوثيق والمفاتيح (Authentication & Key Architecture)

تعتمد المنصة معمارية المفتاح المزدوج (Dual-Key Architecture) لمنح أقصى درجات الأمان:

```mermaid
graph LR
    A["تطبيق المتصفح / الموبايل للعميل"] -->|"X-Publishable-Key: pk_..."| B["Tebiby Connect API (قراءة فقط)"]
    C["خادم الشريك الخلفي (Backend Server)"] -->|"Authorization: Bearer sk_..."| B
    B -->|"عمليات حجز وتعديل آمنة"| D[قاعدة بيانات طبيبي]
```

### 1. المفتاح السري (Secret Key — `sk_...`)
* **الاستخدام:** يُستخدم **حصراً من خوادمكم الخلفية (Backend)** لتنفيذ عمليات الحجز، الإلغاء، واستعلامات البيانات الحساسة.
* **الترويسة المطلوبة:**
  ```http
  Authorization: Bearer sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```
* [!CAUTION]
  **يُحظر تماماً** تضمين المفتاح السري داخل تطبيقات الموبايل أو كود الـ JavaScript في المتصفحات؛ تسريب المفتاح السري يهدد أمان حسابكم.

### 2. المفتاح العام (Publishable Key — `pk_...`)
* **الاستخدام:** يُمكن تضمينه بأمان في تطبيقات الويب أو تطبيقات الموبايل لعرض قائمة الأطباء والتخصصات والمواعيد المتاحة للجمهور (قراءة فقط).
* **الترويسة المطلوبة:**
  ```http
  X-Publishable-Key: pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```
* أي محاولة لإجراء حجز أو تعديل باستخدام المفتاح العام ستُرفض برمز `403 ERR_FORBIDDEN`.

---

## 4. نموذج الصلاحيات المخصصة لكل شركة (Per-Company Scoped Permissions)

عند تزويدكم بحساب شريك، يتم تخصيص صلاحيات المفتاح بدقة لكل فرع مصرح لكم به داخل المجموعة الطبية:

* `read`: استعلام الدليل الطبي، قائمة الأطباء، والمواعيد المتاحة.
* `book`: إنشاء وتأكيد حجز جديد.
* `cancel`: إلغاء موعد تم حجزه مسبقاً.
* `facility_wide`: (صلاحية خاصة جداً تتطلب موافقة خطية) مخصصة فقط لأنظمة الـ HIS المركزية لإدارة كافة طوابير المشفى، ولا تُمنح لتطبيقات الحجز التجارية.

> [!NOTE]
> إذا حاول مفتاحكم الوصول إلى فرع طبي يتبع مجموعة أخرى، سيرجع الخادم رمز **`404 Not Found`** بدلاً من `403` لمنع تسريب أسماء أو أرقام الفروع غير المصرح بها (Anti-Enumeration Defense).

---

## 5. الترويسات الإلزامية والموصى بها في كافة الطلبات (HTTP Headers)

| الترويسة (Header) | الإلزامية | مثال | الوصف |
| :--- | :---: | :--- | :--- |
| `Authorization` | إلزامي (للخوادم) | `Bearer sk_test_...` | مفتاح التوثيق السري الخاص بشركتكم |
| `Content-Type` | إلزامي مع POST/PUT | `application/json` | نوع بيانات جسم الطلب |
| `Accept` | إلزامي | `application/json` | لتلقي الاستجابة بصيغة JSON أو Problem+JSON |
| `X-Request-Id` | موصى به جداً | `9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d` | معرف فريد يُولده نظامكم لتتبع الطلب مع الدعم الفني |
| `Idempotency-Key` | إلزامي مع الحجز والإلغاء | `e6f54c9a-b44c-473d-bc68-d05ec0adcfcb` | يضمن عدم تكرار الخصم أو حجز موعدين عند انقطاع الشبكة |

---

## 6. رحلة التكامل الكاملة خطوة بخطوة (Step-by-Step Integration Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Patient as المريض
    participant Partner as نظام الشريك (Partner Server)
    participant Connect as طبيبي كونكت (Tebiby Connect API)

    Partner->>Connect: GET /facilities/{id}/doctors (استعلام الأطباء المتاحين)
    Connect-->>Partner: 200 OK (قائمة الأطباء والأسعار ومدة الكشف)

    Partner->>Connect: GET /facilities/{id}/doctors/{doc_id}/availability?date=YYYY-MM-DD
    Connect-->>Partner: 200 OK (الفترات المتاحة وحالة السعة)

    Patient->>Partner: اختيار الموعد وتأكيد الدفع/الحجز
    Partner->>Connect: POST /facilities/{id}/appointments (مع Idempotency-Key)
    Connect-->>Partner: 201 Created (رقم الحجز، التذكرة، و public_token)

    loop تتبع الانتظار في العيادة
        Partner->>Connect: GET /queue/{public_token}
        Connect-->>Partner: 200 OK (رقم التذكرة، الرقم الحالي، وقت الانتظار التقديري)
    end
```

### الخطوة 1: استعلام قائمة الأطباء وتفاصيل الكشف
```http
GET /connect/v1/facilities/1/doctors HTTP/1.1
Host: sandbox-api.tebiby.com
Authorization: Bearer sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
Accept: application/json
```

**استجابة الخادم:**
```json
{
  "data": [
    {
      "id": 14,
      "name": "د. عبدالله السالم",
      "title": "استشاري أمراض القلب وقسطرة الشرايين",
      "specialty": "أمراض القلب",
      "consultation_fee": 250.00,
      "slot_duration_minutes": 20,
      "rating": 4.9
    }
  ]
}
```

---

### الخطوة 2: فحص التوفر والمواعيد الشاغرة (Availability)
```http
GET /connect/v1/facilities/1/doctors/14/availability?date=2026-11-25 HTTP/1.1
Host: sandbox-api.tebiby.com
Authorization: Bearer sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**استجابة الخادم:**
```json
{
  "date": "2026-11-25",
  "facility_id": 1,
  "doctor_id": 14,
  "slots": [
    {
      "start_time": "09:00",
      "end_time": "09:20",
      "status": "available",
      "booking_tier": "instant_confirmed"
    },
    {
      "start_time": "09:20",
      "end_time": "09:40",
      "status": "waitlist_available",
      "booking_tier": "waitlist"
    }
  ]
}
```

---

### الخطوة 3: إرسال طلب الحجز (Book Appointment)
> [!IMPORTANT]
> **قاعدة تفادي التكرار (Idempotency):**  
> أرسل دائماً ترويسة `Idempotency-Key: <UUID>` فريدة لكل محاولة حجز. إذا انقطعت الشبكة وأعدت إرسال نفس الطلب، سيُرجع الخادم نفس نتيجة الحجز السابق دون حجز مقعدين أو تكرار الخصم.

```http
POST /connect/v1/facilities/1/appointments HTTP/1.1
Host: sandbox-api.tebiby.com
Authorization: Bearer sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
Idempotency-Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Content-Type: application/json

{
  "doctor_id": 14,
  "appointment_date": "2026-11-25",
  "appointment_time": "09:00",
  "patient_name": "سعد محمد العتيبي",
  "patient_phone": "+966501234567",
  "patient_national_id": "1098765432",
  "payment_method": "at_clinic",
  "notify_whatsapp": false
}
```

**استجابة الخادم (201 Created):**
```json
{
  "booking_reference": "TB-KR4821",
  "status": "confirmed",
  "appointment_date": "2026-11-25",
  "appointment_time": "09:00",
  "ticket": {
    "ticket_number": 3,
    "current_serving_number": 1,
    "estimated_wait_minutes": 30,
    "public_token": "qtok_live_7f8a9b0c1d2e3f4a5b6c"
  },
  "financials": {
    "consultation_fee": 200.00,
    "tax": 30.00,
    "total_amount": 230.00,
    "currency": "SAR"
  }
}
```

---

### الخطوة 4: تتبع الطابور المباشر للعيادة (Live Queue Tracking)
يمكن للمريض أو لتطبيق الشريك استدعاء هذا الرابط لتحديث حالة الدور في شاشات الانتظار دون الحاجة لمفتاح سري:

```http
GET /connect/v1/queue/qtok_live_7f8a9b0c1d2e3f4a5b6c HTTP/1.1
Host: sandbox-api.tebiby.com
```

**الاستجابة:**
```json
{
  "ticket_number": 3,
  "current_serving_number": 2,
  "patients_ahead": 1,
  "estimated_wait_minutes": 15,
  "delay_minutes": 0,
  "status": "waiting"
}
```

---

### الخطوة 5: إلغاء الموعد (Cancel Appointment)
```http
POST /connect/v1/facilities/1/appointments/TB-KR4821/cancel HTTP/1.1
Host: sandbox-api.tebiby.com
Authorization: Bearer sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
Idempotency-Key: c9d8e7f6-a5b4-3210-fedc-ba9876543210
Content-Type: application/json

{
  "reason": "طلب المريض تغيير موعد السفر"
}
```

---

## 7. أمثلة برمجية بلغات التطوير الشائعة (Code Examples)

### 1. PHP (باستخدام Guzzle / Laravel HTTP)

```php
<?php

use GuzzleHttp\Client;
use Ramsey\Uuid\Uuid;

$client = new Client([
    'base_uri' => 'https://sandbox-api.tebiby.com/connect/v1/',
    'timeout'  => 10.0,
]);

$response = $client->post('facilities/1/appointments', [
    'headers' => [
        'Authorization'   => 'Bearer sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        'Idempotency-Key' => Uuid::uuid4()->toString(),
        'X-Request-Id'    => Uuid::uuid4()->toString(),
        'Accept'          => 'application/json',
    ],
    'json' => [
        'doctor_id'        => 14,
        'appointment_date' => '2026-11-25',
        'appointment_time' => '09:00',
        'patient_name'     => 'سعد محمد العتيبي',
        'patient_phone'    => '+966501234567',
        'payment_method'   => 'at_clinic',
        'notify_whatsapp'  => false,
    ],
]);

$data = json_decode($response->getBody(), true);
echo "تم الحجز بنجاح! رقم المرجع: " . $data['booking_reference'];
echo " رقم التذكرة: " . $data['ticket']['ticket_number'];
```

---

### 2. JavaScript / Node.js (باستخدام Axios)

```javascript
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const client = axios.create({
  baseURL: 'https://sandbox-api.tebiby.com/connect/v1',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

async function bookAppointment() {
  try {
    const response = await client.post('/facilities/1/appointments', {
      doctor_id: 14,
      appointment_date: '2026-11-25',
      appointment_time: '09:00',
      patient_name: 'سعد محمد العتيبي',
      patient_phone: '+966501234567',
      payment_method: 'at_clinic',
      notify_whatsapp: false
    }, {
      headers: {
        'Idempotency-Key': uuidv4(),
        'X-Request-Id': uuidv4()
      }
    });

    console.log('نجح الحجز:', response.data.booking_reference);
    console.log('بيانات التذكرة:', response.data.ticket);
  } catch (error) {
    if (error.response) {
      // استجابة خطأ قياسية بصيغة RFC 7807 Problem Details
      console.error('كود الخطأ:', error.response.data.code);
      console.error('التفاصيل:', error.response.data.detail);
      console.error('الحقول غير الصحيحة:', error.response.data.invalid_params);
    } else {
      console.error('خطأ اتصال بالشبكة:', error.message);
    }
  }
}

bookAppointment();
```

---

### 3. Python (باستخدام Requests)

```python
import uuid
import requests

BASE_URL = "https://sandbox-api.tebiby.com/connect/v1"
SECRET_KEY = "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

payload = {
    "doctor_id": 14,
    "appointment_date": "2026-11-25",
    "appointment_time": "09:00",
    "patient_name": "سعد محمد العتيبي",
    "patient_phone": "+966501234567",
    "payment_method": "at_clinic",
    "notify_whatsapp": False
}

headers = {
    "Authorization": f"Bearer {SECRET_KEY}",
    "Idempotency-Key": str(uuid.uuid4()),
    "X-Request-Id": str(uuid.uuid4()),
    "Accept": "application/json",
    "Content-Type": "application/json"
}

response = requests.post(f"{BASE_URL}/facilities/1/appointments", json=payload, headers=headers)

if response.status_code == 201:
    res_data = response.json()
    print(f"تم الحجز بنجاح! كود الحجز: {res_data['booking_reference']}")
    print(f"رقم التذكرة في العيادة: {res_data['ticket']['ticket_number']}")
else:
    error_data = response.json()
    print(f"فشل الطلب ({error_data.get('code')}): {error_data.get('detail')}")
```

---

## 8. معالجة الأخطاء القياسية (RFC 7807 Problem Details Standard)

تلتزم المنصة بمعيار **RFC 7807 (`application/problem+json`)** لتقديم أخطاء واضحة، معقمة، وموحدة عبر كافة مسارات النظام:

```json
{
  "type": "https://api.tebiby.com/errors/ERR_VALIDATION_FAILED",
  "title": "Validation Failed",
  "status": 422,
  "code": "ERR_VALIDATION_FAILED",
  "detail": "بيانات الطلب غير صالحة، يرجى مراجعة المدخلات والتصحيح.",
  "request_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timestamp": "2026-11-22T03:30:00Z",
  "invalid_params": [
    {
      "name": "appointment_date",
      "reason": "Date must not be in the past"
    },
    {
      "name": "patient_phone",
      "reason": "Invalid format"
    }
  ]
}
```

### كتالوج الأكواد الشائعة (Error Catalog):

| رمز الخطأ (`code`) | كود HTTP | سبب الحدوث والإجراء المقترح |
| :--- | :---: | :--- |
| `ERR_UNAUTHORIZED` | 401 | المفتاح مفقود أو غير صالح أو منتهي الصلاحية؛ تأكد من ترويسة `Authorization`. |
| `ERR_FORBIDDEN` | 403 | استخدام مفتاح عام `pk_*` لمحاولة تعديل، أو انتهاك قواعد الوصول العامة. |
| `ERR_FORBIDDEN_SCOPE` | 403 | المفتاح مصرح له بالفرع لكن يفتقر لنوع العملية (مثلاً: مصرح بالقراءة فقط ويحاول الحجز). |
| `ERR_RESOURCE_NOT_FOUND` | 404 | الطبيب، الفرع، أو الموعد غير موجود، أو يتبع لمجموعة طبية خارج نطاق مفتاحكم. |
| `ERR_VALIDATION_FAILED` | 422 | عدم اكتمال الحقول أو صياغة غير صحيحة للتاريخ/الوقت؛ راجع `invalid_params`. |
| `ERR_SLOT_UNAVAILABLE` | 422 | اكتملت سعة الحجز الفوري وقائمة الانتظار في هذا الموعد؛ اختر موعداً آخر. |
| `ERR_IDEMPOTENCY_CONFLICT` | 409 | هناك طلب بنفس الـ `Idempotency-Key` قيد المعالجة حالياً؛ انتظر ثوانٍ وأعد المحاولة. |
| `ERR_RATE_LIMIT_EXCEEDED` | 429 | تجاوز الحد المسموح به من الطلبات في الدقيقة (120 طلب/دقيقة افتراضياً). |
| `ERR_INTERNAL_SERVER` | 500 | خطأ داخلي في الخادم؛ زود فريق الدعم الفني بـ `request_id` للتحقيق الفوري. |

---

## 9. الامتثال للائحة حماية البيانات الشخصية (PDPL Compliance)

لضمان التوافق التام مع النظام السعودي لحماية البيانات الشخصية (PDPL):
1. **عنونة الشبكة المشفرة (No Raw IP Logging):** لا يتم حفظ عناوين الـ IP الخاصة بكم أو بمرضاكم كنصوص صريحة نهائياً، بل تُشفر عبر تجزئة `SHA-256` مع ملح متغير دورياً.
2. **عزل الحسابات التقنية (Isolated Technical Accounts):** تنشئ واجهة Connect حسابات تقنية منفصلة لمرضى الحجوزات السريعة دون تداخل أو دمج قسري مع الحسابات الشخصية القديمة للمرضى.
3. **حجب الـ SQL والبيانات الحساسة:** سجلات الاستثناءات العامة لا تحتوي على أي استعلامات أو مدخلات للمرضى، وتُسجل بنص `[REDACTED_SQL]` لحظر أي تسريب محتمل.

---

## 10. قائمة التحقق قبل الإطلاق للإنتاج (Go-Live Checklist)

- [ ] استكمال اختبار كافة السيناريوهات على بيئة **Sandbox**.
- [ ] التأكد من تمرير ترويسة `Idempotency-Key` في كافة طلبات الحجز والإلغاء.
- [ ] حفظ وتوثيق الـ `X-Request-Id` في سجلات خادمكم للمطابقة السريعة عند طلب الدعم.
- [ ] حماية المفتاح السري `sk_live_...` وحفظه في متغيرات البيئة المشفرة (Vault / Secret Manager).
- [ ] التحقق من جاهزية نظامكم للتعامل مع استجابات الأخطاء `application/problem+json`.
- [ ] طلب اعتماد وتفعيل مفاتيح الإنتاج `sk_live_...` من إدارة طبيبي.

---

**لطلب الدعم الفني أو الاستفسارات المعمارية:**  
فريق تكامل طبيبي كونكت: `api-support@tebiby.com`
