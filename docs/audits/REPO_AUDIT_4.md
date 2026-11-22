# تقرير التدقيق الفعلي لقاعدة البيانات والكود (REPO_AUDIT_4)
## التدقيق الميداني الشامل 4: جداول الدكاترة، الفترات الزمنية، خدمات الأطباء، ومحرك الطابور الحي

> **التاريخ:** نوفمبر 2026  
> **البيئة:** فحص ميداني لقاعدة بيانات MySQL الحقيقية (`tabbi`) وكود التطبيق (`Laravel 12 / PHP 8.4`).  
> **طبيعة الفحص:** قراءة فقط (Read-Only) بنسبة 100%، دون أي تعديل على الكود أو البيانات، ومجرد تماماً من أي بيانات شخصية (Zero PII).

---

## 1. إحصائيات الأطباء والجداول النشطة (`doctor_profiles` & `doctor_schedules`)

### الحقائق المستخرجة من قاعدة البيانات:
* **إجمالي ملفات الأطباء (`doctor_profiles`):** **12 طبيباً**.
* **جدول جداول الدوام (`doctor_schedules`):** موجود في قاعدة البيانات.
* **إجمالي سجلات الدوام في `doctor_schedules`:** **72 سجلاً**، وجميعها نشطة بنسبة **100% (`is_active = 1`)**.
* **عدد الأطباء الذين يمتلكون جدول دوام نشط واحد على الأقل:** **12 من 12 طبيباً (100%)**.
* **حقل الربط بالمنشأة:** لا يحتوي جدول `doctor_schedules` على عمود `facility_id` مباشر، بل يرتبط بالمنشأة عبر المفتاح الأجنبي `doctor_facility_id` (يشير إلى جدول `doctor_facility`).
* **سلامة الربط:** جميع سجلات الجداول الـ 72 تحتوي على `doctor_facility_id` غير فارغ (**0 NULL**) وترتبط بمنشآت صالحة.

### توزيع الأطباء وجداول الدوام النشطة لكل منشأة:

| معرف المنشأة (`facility_id`) | اسم المنشأة | المجموعة (`group_id`) | عدد الأطباء المرتبطين | عدد الجداول النشطة |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | مستشفى د. سليمان الحبيب - العليا | Group #1 | 4 أطباء | 17 جدولاً نشطاً |
| **#2** | عيادات د. سليمان الحبيب التخصصية - الصحافة | Group #1 | 3 أطباء | 12 جدولاً نشطاً |
| **#3** | مستشفى المواساة الحديث - قرطبة | Group #2 | 2 أطباء | 10 جداول نشطة |
| **#4** | عيادات المواساة اليومية - السليمانية | Group #2 | 2 أطباء | 4 جداول نشطة |
| **#5** | مستشفى د. سليمان الحبيب - الفيحاء | Group #1 | 2 أطباء | 10 جداول نشطة |
| **#6** | المستشفى السعودي الألماني - الزهراء | Group #3 | 2 أطباء | 7 جداول نشطة |
| **#7** | مستشفى المواساة التخصصي - الفيصلية | Group #2 | 2 أطباء | 10 جداول نشطة |
| **#8** | عيادات السعودي الألماني التخصصية - الشاطئ | Group #3 | طبيب واحد | جدولان نشطان |

---

## 2. أنماط جداول الدوام ومقارنتها بفترات الويب الثابتة الـ 19 (Schedule Patterns vs Web Hardcoded Slots)

### أنماط الجداول الفعلية في قاعدة البيانات (`doctor_schedules`):
أظهر الفحص وجود **26 نمطاً متمايزاً** لجداول الدوام، وجاءت خصائصها كالتالي:
* **أيام الأسبوع (`day_of_week`):** من الأحد (0) إلى الخميس (4) — تمثل أسبوع العمل المعتاد في العيادات السعودية.
* **ساعات العمل الفعلية المخزنة:**
  - النمط الرئيسي: من `16:00:00` إلى `22:00:00` (فترة مسائية من 4:00 عصراً إلى 10:00 مساءً).
  - النمط الثانوي: من `17:00:00` إلى `21:00:00` (فترة مسائية من 5:00 عصراً إلى 9:00 مساءً).
* **مدة الفترة الزمنية (`slot_duration_minutes`):** تتنوع بين **10، 12، 15، 20، و 25 دقيقة** (حسب تخصص وخطة كل طبيب).
* **الفترات الصباحية:** **صفر (0)**. لا يوجد في قاعدة البيانات أي جدول دوام صباحي على الإطلاق.

### المقارنة الصادمة مع فترات الويب الثابتة (React Frontend Hardcoded Slots):
كما ثبت في [REPO_AUDIT_3.md](file:///g:/Web/Projects/freelancer/tebbi/REPO_AUDIT_3.md) (القسم 1)، فإن واجهة الويب (`resources/js/components/tebiby/booking/types.ts#L97-L120`) تثبت **19 فترة ثابتة بمدة 30 دقيقة**:
* **8 فترات صباحية:** `09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30`.
* **11 فترة مسائية:** `16:00, 16:30, 17:00, 17:30, 18:00, 18:30, 19:00, 19:30, 20:00, 20:30, 21:00`.

### الاستنتاج المعماري الحاسم:
1. **عدم التطابق الجذري:**
   - الويب يتيح 8 فترات صباحية (من 09:00 إلى 12:30) **غير موجودة إطلاقاً في جداول الدكاترة في قاعدة البيانات**.
   - فترات الويب مدتها **30 دقيقة ثابتة**، بينما جداول قاعدة البيانات تعتمد فترات **10، 12، 15، 20، 25 دقيقة**.
   - فترات قاعدة البيانات تمتد حتى `22:00`، بينما الويب يتوقف عند `21:00`.
2. **أثر تطبيق `ERR_SLOT_OUTSIDE_SCHEDULE` في Connect:**
   - إذا تم تفعيل التحقق الصارم من `DoctorSchedule` في Connect API:
     - سيرفض Connect أي حجز صباحي يطلبه الشريك (بين 09:00 و 12:30) لأن الطبيب ليس لديه جدول صباحي في قاعدة البيانات، في حين أن مريض الويب يستطيع حجز نفس الموعد الصباحي بنجاح!
     - إذا ولد Connect فترات بناءً على `DoctorSchedule` (مثلاً كل 15 دقيقة: 16:00، 16:15، 16:30...)، فإن الشريك سيتمكن من حجز `16:15`، وهي فترة لا يمكن لمريض الويب رؤيتها أو حجزها.

---

## 3. إحصائيات خدمات الأطباء (`doctor_services`)

### الحقائق المستخرجة من قاعدة البيانات:
* **جدول الخدمات (`doctor_services`):** موجود ونشط.
* **إجمالي الخدمات المسجلة:** **38 خدمة**.
* **الخدمات النشطة (`is_active = 1`):** **38 خدمة (100%)**.
* **الأطباء الذين يمتلكون خدمة نشطة واحدة على الأقل:** **12 من 12 طبيباً (100%)**.
* **الأطباء الذين ليس لديهم أي خدمة نشطة:** **صفر (0)**.
* **الأثر المعماري:** تسعير المواعيد في Connect يعتمد دائماً على `DoctorService.price` لتوفر الخدمات النشطة لكافة الأطباء بنسبة 100% دون الحاجة للجوء إلى Fallback تسعير كشفية الملف.

---

## 4. كود دالة بناء حمولة الطابور كاملاً (`LiveQueueController::buildQueuePayload`)

تم استخراج الدالة بالكامل من [app/Http/Controllers/LiveQueueController.php](file:///g:/Web/Projects/freelancer/tebbi/app/Http/Controllers/LiveQueueController.php#L47-L120):

```php
    private function buildQueuePayload(Appointment $appointment, QueueTicket $ticket): array
    {
        $doctor = $appointment->doctor;

        $currentExamining = QueueTicket::whereHas('appointment', function ($q) use ($doctor, $appointment) {
            $q->where('doctor_id', $doctor->id)
              ->whereDate('appointment_date', $appointment->appointment_date);
        })->whereIn('status', ['called', 'examining'])->orderByDesc('called_at')->first();

        if (! $currentExamining) {
            $inConsultAppt = Appointment::with('queueTicket')
                ->where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', $appointment->appointment_date)
                ->where('status', 'in_consultation')
                ->first();
            $currentExamining = $inConsultAppt?->queueTicket;
        }

        $currentServing = $currentExamining ? $currentExamining->ticket_number : 1;
        $isCalled = $appointment->status === 'in_consultation'
            || in_array($ticket->status, ['called', 'examining'], true);

        $patientsAhead = $isCalled ? 0 : max(0, $ticket->ticket_number - $currentServing);

        $delayMinutes = (int) ($appointment->delay_minutes ?? 0);
        $delayReason = $appointment->delay_reason;
        $slotMinutes = (int) ($doctor->waiting_time_minutes ?: 15);
        $queueWaitMinutes = $isCalled ? 0 : (($patientsAhead * $slotMinutes) + $delayMinutes);

        $apptDateStr = is_string($appointment->appointment_date)
            ? substr($appointment->appointment_date, 0, 10)
            : $appointment->appointment_date->toDateString();

        $scheduledTimeCarbon = Carbon::parse($apptDateStr . ' ' . $appointment->appointment_time);
        $expectedTimeCarbon = $scheduledTimeCarbon->copy()->addMinutes($delayMinutes);

        $now = Carbon::now();

        if ($isCalled) {
            $minutesRemaining = 0;
            $targetCarbon = $now;
        } elseif ($expectedTimeCarbon->gt($now)) {
            $minutesRemaining = (int) max(1, ceil($now->diffInSeconds($expectedTimeCarbon, false) / 60));
            $targetCarbon = $expectedTimeCarbon;
        } else {
            // When testing with an appointment time earlier in the day, compute live remaining wait from queue + delay
            $fallbackWait = max($patientsAhead > 0 ? ($patientsAhead * $slotMinutes) : $slotMinutes, 0) + $delayMinutes;
            $minutesRemaining = $fallbackWait;
            $targetCarbon = $now->copy()->addMinutes($fallbackWait);
        }

        return [
            'ticketNumber' => $ticket->ticket_number,
            'currentServingNumber' => $currentServing,
            'patientsAhead' => $patientsAhead,
            'estimatedWaitMinutes' => $isCalled ? 0 : max($queueWaitMinutes, $minutesRemaining),
            'queueStatus' => $ticket->status,
            'status' => $ticket->status,
            'appointmentStatus' => $appointment->status,
            'isYourTurn' => $isCalled,
            'isCalled' => $isCalled,
            'isNextInLine' => ! $isCalled && $patientsAhead === 0 && $appointment->status !== 'completed',
            'calledAt' => $ticket->called_at?->toIso8601String(),
            'callCount' => (int) ($ticket->call_count ?? 0),
            'delayMinutes' => $delayMinutes,
            'delayReason' => $delayReason,
            'scheduledTime' => $this->formatArabicTime($scheduledTimeCarbon),
            'expectedTime' => $this->formatArabicTime($expectedTimeCarbon->gt($now) || $delayMinutes > 0 ? $expectedTimeCarbon : $targetCarbon),
            'minutesRemaining' => $minutesRemaining,
            'targetTimestampMs' => $targetCarbon->getTimestampMs(),
            'doctorName' => $doctor?->user?->name ?? 'الطبيب',
            'doctorTitle' => $doctor?->title_ar ?? 'استشاري',
        ];
    }
```

### الملاحظات المعمارية على `buildQueuePayload`:
1. **صيغ التسمية:** تعتمد الحقول صيغة `camelCase` (مثل `ticketNumber`، `currentServingNumber`، `isYourTurn`) بدلاً من `snake_case` المعتمدة في Connect API.
2. **الانحراف الزمني (`Timezone Drift`):** السطر 83 يستدعي `$now = Carbon::now();` الذي يعتمد على توقيت الخادم الافتراضي `UTC`، بينما المواعيد وتأخير العيادات في المملكة تعمل بتوقيت الرياض (`Asia/Riyadh`).
3. **اعتماد `waiting_time_minutes`:** السطر 73 يحسب وقت الانتظار بضرب عدد المرضى السابقين في `$doctor->waiting_time_minutes` (أو 15 دقيقة كقيمة افتراضية).

---

## 5. فحص استدعاءات `sendTemplateMessage` و `sendSessionTextMessage` في خدمة الواتساب

### نتائج البحث الميداني عبر كامل المستودع:
تم البحث في كافة مسارات التطبيق (`app/**/*.php`, `routes/**/*.php`, `resources/**/*.php`, `tests/**/*.php`, `database/**/*.php`):
* **تعريف الدوال:**
  - `sendTemplateMessage`: مُعرفة في [app/Services/GupshupWhatsAppService.php#L164](file:///g:/Web/Projects/freelancer/tebbi/app/Services/GupshupWhatsAppService.php#L164).
  - `sendSessionTextMessage`: مُعرفة في [app/Services/GupshupWhatsAppService.php#L254](file:///g:/Web/Projects/freelancer/tebbi/app/Services/GupshupWhatsAppService.php#L254).
* **كافة الاستدعاءات عبر كامل الكود:**
  - السطر 443 داخل `notifyAppointmentCreated()`
  - السطر 469 داخل `notifyAppointmentConfirmed()`
  - السطر 494 داخل `notifyAppointmentCancelled()`
  - السطر 518 داخل `notifyAppointmentRescheduled()`
  - السطر 542 داخل `notifyQueueProgress()`
  - السطر 567 داخل `notifyTurnApproaching()`
  - السطر 592 داخل `notifyNowServing()`
  - السطر 627 داخل `notifyAppointmentCompleted()`
* **الاستدعاءات خارج الميثودات الثمانية:** **صفر (0) مطلقا**. لا يوجد أي Controller أو Job أو Listener أو Command في التطبيق يستدعي دوال إرسال الواتساب مباشرة.
* **النتيجة:** حماية `notify_whatsapp === false` المتوفرة في أول سطر تنفيذي من كل ميثود من الميثودات الثمانية تغطي إرسال الواتساب في المنصة بنسبة 100% دون أي ثغرة تسريب.

### تنبيه أمني منفصل (PII Logging in Gupshup):
* تبين أن خدمة `GupshupWhatsAppService` تقوم بتسجيل رقم الجوال (`'destination' => $destination`) في سجلات لارافيل (`Log::info`, `Log::warning`, `Log::error`) وكذلك نص الاستجابة الكامل في الأسطر 227، 237، 245، 305، 315، 323.
* **الأثر على Connect:** بما أن Connect يضبط `notify_whatsapp: false` افتراضياً، فإن التنفيذ يعود من السطر الأول للميثود قبل الوصول لأي استدعاء إرسال أو تسجيل. ولكن في حال رغب العميل مستقبلاً في تفعيل الواتساب لـ Connect، يجب تنقيح هذا التسجيل لمنع تسريب أرقام الهواتف.

---

## 6. فحص ارتباط الأطباء بالمنشآت وتعدد الفروع (`doctor_facility`)

### الحقائق المستخرجة من جدول `doctor_facility`:
* **إجمالي العلاقات المسجلة في `doctor_facility`:** **18 علاقة**.
* **إجمالي الأطباء:** **12 طبيباً**.
* **أطباء مرتبطون بمنشأة واحدة فقط:** **6 أطباء (50%)** (الأطباء #3، #5، #8، #9، #10، #12).
* **أطباء مرتبطون بأكثر من منشأة (Multi-Facility Doctors):** **6 أطباء (50%)**:
  - الطبيب #1: مرتبط بمنشأتين (#1 و #2).
  - الطبيب #2: مرتبط بمنشأتين (#1 و #5).
  - الطبيب #4: مرتبط بمنشأتين (#2 و #5).
  - الطبيب #6: مرتبط بمنشأتين (#6 و #8).
  - الطبيب #7: مرتبط بمنشأتين (#3 و #7).
  - الطبيب #11: مرتبط بمنشأتين (#3 و #4).
* **أطباء غير مرتبطين بأي منشأة:** **صفر (0)**.

### الأثر المعماري الحاسم:
* **نصف أطباء المنصة (50%) يعملون في أكثر من منشأة تابعة لنفس المجموعة الطبية.**
* يثبت هذا الفحص ضرورة:
  1. التحقق الصارم من `facilities.group_id == credential.owner_id`.
  2. إلزام تمرير أو استنتاج `doctor_facility_id` الصحيح المرتبط بالمنشأة المحددة لضمان عدم اختلاط جداول الطبيب وأسعاره بين فرع وآخر لنفس المجموعة.

---

## الخلاصة وجدول القرارات المعمارية المستخلصة:

| البند المفحوص | النتيجة الميدانية | الأثر المباشر على معمارية Connect |
| :--- | :--- | :--- |
| **جداول الدكاترة (`doctor_schedules`)** | 100% من الأطباء لديهم جداول مسائية فقط (16:00 - 22:00) | **تعارض مع فترات الويب الصباحية:** يتطلب قرار العميل: إما توليد الفترات من الجداول وإسقاط فترات الصباح، أو العمل بفترات الويب الـ 19 الثابتة. |
| **خدمات الأطباء (`doctor_services`)** | 38 خدمة نشطة، 100% من الأطباء لديهم خدمات نشطة | الاعتماد الكامل على `DoctorService.price` للتسعير الضريبي الصارم دون Fallback. |
| **استدعاءات الواتساب (`Gupshup`)** | صفر استدعاء خارج الميثودات الثمانية | كبح الواتساب بـ `notify_whatsapp: false` مضمون بنسبة 100% دون أي تجاوز. |
| **تعدد المنشآت للأطباء** | 50% من الأطباء يعملون في منشأتين | إثبات صوابية نموذج `doctor_facility` وربطه بالمنشأة المصرح بها للمفتاح. |
| **حمولة الطابور (`buildQueuePayload`)** | تعتمد `camelCase` وتستخدم `Carbon::now()` بـ UTC | بناء Endpoint مستقل لـ Connect بـ `snake_case` وتوقيت `Asia/Riyadh` الصريح. |
