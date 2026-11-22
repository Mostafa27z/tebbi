# تقرير التدقيق الفعلي لقاعدة البيانات والكود (REPO_AUDIT_5)
## التدقيق الحاسم 5: تصحيح دوال الواتساب، بيئة البيانات، الجداول المجزأة، وحجوزات خارج الدوام

> **التاريخ:** نوفمبر 2026  
> **البيئة:** فحص دقيق لقاعدة البيانات الحالية (`tabbi`) وكود التطبيق (`Laravel 12 / PHP 8.4`).  
> **طبيعة الفحص:** قراءة فقط (Read-Only) مع تقديم المخرجات الخام وأرقام الأسطر المباشرة.

---

## 1. المخرجات الخام لدوال الواتساب وتصحيح التناقض (Gupshup Methods Raw Grep)

### أ. المخرجات الخام المباشرة من `app/Services/GupshupWhatsAppService.php`:
```text
164: public function sendTemplateMessage(?string $destinationPhone, string $templateKeyOrId, array $params = []): array
254: public function sendSessionTextMessage(?string $destinationPhone, string $text): array
428: public function notifyBookingReceived(Appointment $appointment): array
454: public function notifyBookingConfirmed(Appointment $appointment): array
480: public function notifyArrivalConfirmed(Appointment $appointment): array
505: public function notifyTurnApproaching(Appointment $appointment): array
529: public function notifyPatientCalled(Appointment $appointment): array
553: public function notifyConsultationCompleted(Appointment $appointment, ?Prescription $prescription = null): array
578: public function notifyAppointmentCancelled(Appointment $appointment): array
603: public function notifyAppointmentDelayed(Appointment $appointment, int $addedMinutes, ?string $newExpectedTime = null): array
```

### ب. فض التناقض والتحقق الحرفي:
1. **الأسماء الحقيقية المعتمدة للـ 8 Methods:**
   - السطر 428: `notifyBookingReceived`
   - السطر 454: `notifyBookingConfirmed`
   - السطر 480: `notifyArrivalConfirmed`
   - السطر 505: `notifyTurnApproaching`
   - السطر 529: `notifyPatientCalled`
   - السطر 553: `notifyConsultationCompleted`
   - السطر 578: `notifyAppointmentCancelled`
   - السطر 603: `notifyAppointmentDelayed`
2. **هل توجد دالة باسم `notifyAppointmentRescheduled`؟**
   * **لا توجد مطلقاً في كامل الكود.** التسميات التي وردت في ملخص REPO_AUDIT_4 كانت صياغة غير دقيقة، وتسميات REPO_AUDIT_3 والأسطر المذكورة أعلاه هي الحقيقة البرمجية المثبتة 100%.
3. **فحص السطر الأول من كل دالة:**
   * الأسطر (430، 456، 482، 507، 531، 555، 580، 605) تبدأ جميعها بـ:
     ```php
     if ($appointment->notify_whatsapp === false) {
         return ['status' => 'skipped', 'reason' => 'patient_opted_out'];
     }
     ```
   * لا يوجد أي استدعاء لـ `sendTemplateMessage` أو `sendSessionTextMessage` خارج هذه الدوال الثمانية.

---

## 2. طبيعة قاعدة البيانات (`tabbi`) ومدى تواريخ المواعيد

### أ. إحصائيات التواريخ والبيئة:
* **اسم قاعدة البيانات الحالية:** `tabbi`.
* **إجمالي المواعيد المسجلة:** **92 موعداً فقط**.
* **نطاق تاريخ الموعد (`appointment_date`):**
  - أقدم موعد: `2026-08-10`
  - أحدث موعد: `2026-11-19`
* **نطاق تاريخ الإنشاء الفعلي (`created_at`):**
  - أول إنشاء: `2026-11-08 13:11:41`
  - آخر إنشاء: `2026-11-19 20:57:51`
  - *(كافة المواعيد الـ 92 أُنشئت خلال فترة 11 يوماً فقط في شهر نوفمبر 2026)*.
* **إجمالي المستخدمين:** **37 مستخدماً** (1 مسؤول، 12 طبيباً، 24 مريضاً).
* **نطاقات البريد الإلكتروني:** **35 من أصل 37 مستخدماً (95%)** ينتهون بـ `@example.com` أو `@tebiby.com`.

### ب. الاستنتاج:
* قاعدة البيانات `tabbi` هي **بيئة بيانات تجريبية/تطويرية محلية (Seeded Local Dev / Staging Data)** وليست قاعدة بيانات إنتاجية حقيقية لمرضى فعليين.

---

## 3. جداول الأطباء: الفترات المقسمة، الطاقة القصوى، والمدد المتمايزة

### أ. هل يمكن لمنشأة واحدة أن تمتلك أكثر من فترة لنفس اليوم (Split Shifts)؟
* **النتيجة الميدانية:** **صفر (0)**.
* لكل طبيب في المنشأة الواحدة (`doctor_facility_id`) **سجل واحد فقط لكل يوم عمل**. لا توجد أي فترات دوام مقسمة (Split Shifts) في قاعدة البيانات الحالية.

### ب. حقل الطاقة اليومية القصوى (`max_daily_patients`):
* **في قاعدة البيانات:**
  - عدد السجلات غير الفارغة: **72 من 72 (100% Not-Null)**.
  - القيم المخزنة: 12 سجلاً بقيمة `15`، و 60 سجلاً بقيمة `20`.
* **في الكود المصدري:**
  - لا يُستخدم إطلاقاً في أي Controller أو Service أو استعلام حجز. وجوده الوحيد هو في `$fillable` بموديل `DoctorSchedule.php#L20`.
  - **هو عمود غير مستغل برمجياً (Dead Column) في كود المنصة القائم.**

### ج. مدد الفترات المتمايزة لكل طبيب (`slot_duration_minutes`):
* الطبيب #1: 15 دقيقة.
* الطبيب #2: 10 و 15 دقيقة (تختلف بحسب الفرع).
* الطبيب #3: 20 دقيقة.
* الطبيب #4: 15 و 20 دقيقة (تختلف بحسب الفرع).
* الطبيب #5: 12 دقيقة.
* الطبيب #6: 15 و 25 دقيقة (تختلف بحسب الفرع).
* الطبيب #7: 15 دقيقة.
* الطبيب #8: 20 دقيقة.
* الطبيب #9: 15 دقيقة.
* الطبيب #10: 10 دقيقة.
* الطبيب #11: 15 دقيقة.
* الطبيب #12: 15 دقيقة.

---

## 4. المواعيد القائمة المحجوزة خارج أوقات دوام الأطباء

تم فحص ومقارنة كافة المواعيد الـ 92 المسجلة في جدول `appointments` مقابل جداول دوام الأطباء في `doctor_schedules` في نفس اليوم:

* **مواعيد داخل وقت الدوام المعتمد للطبيب:** **61 موعداً (66%)**.
* **مواعيد خارج وقت الدوام المعتمد للطبيب:** **31 موعداً (34%)**!
  - من بينها **28 موعداً** تم حجزها في أيام أسبوع **ليس للطبيب أي جدول دوام نشط فيها على الإطلاق**!
  - و **3 مواعيد** حُجزت في ساعات تسبق أو تلي أوقات دوام الطبيب.

### الأثر الفني والتشغيلي:
* هذا يثبت قطعيّاً أن حجز الويب الحالي يتجاهل تماماً جدول الطبيب (`DoctorSchedule`) ويقبل حجوزات في أيام وساعات لا يعمل فيها الطبيب.
* تفعيل `ERR_SLOT_OUTSIDE_SCHEDULE` في Connect سيجعل API أكثر صرامة ومطابقة للواقع الطبي من نظام الويب القائم، ولكنه سيؤدي لاختلاف واضح في السلوك بين الاثنين.
