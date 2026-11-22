import{c as y,r,j as e,b as n,a as g,e as v}from"./app-8AeIlc8x.js";import{S as N}from"./shield-check-C2-T0cOQ.js";import{L as k}from"./lock-BFrlszGV.js";import{C as u}from"./check-CE_QR9JP.js";import{C as h}from"./copy-DX-BBRoV.js";import{K as T}from"./key-round-DgHvVrQc.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["path",{d:"m18 16 4-4-4-4",key:"1inbqp"}],["path",{d:"m6 8-4 4 4 4",key:"15zrgr"}],["path",{d:"m14.5 4-5 16",key:"e7oirm"}]],A=y("CodeXml",w);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=[["polyline",{points:"4 17 10 11 4 5",key:"akl6gq"}],["line",{x1:"12",x2:"20",y1:"19",y2:"19",key:"q2wloq"}]],b=y("Terminal",q),i=[{id:"availability",method:"GET",path:"/connect/v1/facilities/{facility_id}/doctors/{doctor_id}/availability",title:"استعلام المواعيد والأوقات الشاغرة",subtitle:"Doctor Real-time Availability & Slot Capacity",description:"يسترجع هذا المسار جميع فترات ومواعيد الكشف المتاحة للطبيب في المنشأة ليوم محدد بتوقيت الرياض، مع توضيح الطاقة الاستيعابية والأسعار المعتمدة وحالة كل موعد.",requiresAuth:!0,authType:"Bearer sk_live_... أو pk_live_...",headers:[{name:"Authorization",required:!0,value:"Bearer sk_live_9a8b7c6d...",description:"مفتاح الربط البرمجي السري للمنشأة"},{name:"Accept",required:!0,value:"application/json",description:"نوع الاستجابة المطلوبة"}],params:[{name:"facility_id",location:"path",type:"integer",required:!0,description:"المعرّف الرقمي للمنشأة أو المستشفى في نظام طبيبي",example:"1"},{name:"doctor_id",location:"path",type:"integer",required:!0,description:"المعرّف الرقمي للطبيب أو ملف الاستشاري المطلوب",example:"4"},{name:"date",location:"query",type:"string (YYYY-MM-DD)",required:!0,description:"تاريخ اليوم المطلوب الاستعلام عن مواعيده (بتوقيت آسيا/الرياض)",example:"2026-11-23"}],snippets:{curl:`curl -X GET "https://tebiby.com/connect/v1/facilities/1/doctors/4/availability?date=2026-11-23" \\
  -H "Authorization: Bearer sk_live_YOUR_SECRET_KEY" \\
  -H "Accept: application/json"`,js:`const response = await fetch(
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
console.log(data.data.slots);`,php:`$client = new \\GuzzleHttp\\Client();
$response = $client->request('GET', 'https://tebiby.com/connect/v1/facilities/1/doctors/4/availability', [
    'query' => ['date' => '2026-11-23'],
    'headers' => [
        'Authorization' => 'Bearer sk_live_YOUR_SECRET_KEY',
        'Accept' => 'application/json',
    ],
]);
$data = json_decode($response->getBody(), true);`,python:`import requests

url = "https://tebiby.com/connect/v1/facilities/1/doctors/4/availability"
params = {"date": "2026-11-23"}
headers = {
    "Authorization": "Bearer sk_live_YOUR_SECRET_KEY",
    "Accept": "application/json"
}

res = requests.get(url, headers=headers, params=params)
print(res.json())`},successStatus:200,successResponse:JSON.stringify({status:"success",data:{facility:{id:1,name:"مستشفى د. سليمان الحبيب - العليا",timezone:"Asia/Riyadh"},doctor:{id:4,name:"د. عبدالمحسن الشمري",specialty:"طب وجراحة الأسنان",default_fee:"250.00"},date:"2026-11-23",day_name:"Monday",slots:[{start_time:"09:00",end_time:"09:15",status:"available_instant",fee:250,remaining_capacity:1,is_available:!0},{start_time:"09:15",end_time:"09:30",status:"available_instant",fee:250,remaining_capacity:1,is_available:!0},{start_time:"09:30",end_time:"09:45",status:"fully_booked",fee:250,remaining_capacity:0,is_available:!1}]}},null,2),errorResponses:[{status:400,title:"تاريخ غير صالح أو خارج النطاق",json:JSON.stringify({type:"https://tebiby.com/errors/invalid-date",title:"Bad Request",status:400,detail:"The date query parameter must be a valid future or current date in YYYY-MM-DD format."},null,2)},{status:401,title:"مفتاح الربط غير صالح أو منتهي الصلاحية",json:JSON.stringify({type:"https://tebiby.com/errors/unauthorized",title:"Unauthorized",status:401,detail:"Invalid Bearer secret key or credential has expired."},null,2)}]},{id:"booking-intent",method:"POST",path:"/connect/v1/booking-intents",title:"قفل السعر وتوليد رمز الحجز المؤقت (Gate 1B - الخطوة الأولى)",subtitle:"Create Booking Intent & Lock Rate",description:"ينشئ هذا المسار رغبة حجز مؤقتة (Booking Intent) يقفل خلالها سعر الكشف والعيادة لمدة 15 دقيقة، ويصدر رمز مشفر (intent_token) يُستخدم إلزامياً في خطوة تأكيد الحجز.",requiresAuth:!0,authType:"Bearer sk_live_...",headers:[{name:"Authorization",required:!0,value:"Bearer sk_live_YOUR_KEY",description:"مفتاح الربط السري"},{name:"Content-Type",required:!0,value:"application/json",description:"نوع محتوى الطلب"},{name:"Accept",required:!0,value:"application/json",description:"نوع الاستجابة المطلوبة"}],params:[{name:"facility_id",location:"body",type:"integer",required:!0,description:"معرف المنشأة الطبية",example:"1"},{name:"doctor_id",location:"body",type:"integer",required:!0,description:"معرف الطبيب المراد حجز موعد معه",example:"4"},{name:"appointment_date",location:"body",type:"string (YYYY-MM-DD)",required:!0,description:"تاريخ الموعد المطلوب",example:"2026-11-23"},{name:"appointment_time",location:"body",type:"string (HH:MM)",required:!0,description:"وقت بداية الموعد المحجوز بصيغة 24 ساعة",example:"09:00"},{name:"client_mutation_id",location:"body",type:"string (UUID)",required:!1,description:"معرف فريد للعملية من جهة نظامك لمنع تكرار إنشاء الحجز",example:"d3b07384-d113-469b-b09e-049f7e531e34"}],snippets:{curl:`curl -X POST "https://tebiby.com/connect/v1/booking-intents" \\
  -H "Authorization: Bearer sk_live_YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "facility_id": 1,
    "doctor_id": 4,
    "appointment_date": "2026-11-23",
    "appointment_time": "09:00"
  }'`,js:`const response = await fetch("https://tebiby.com/connect/v1/booking-intents", {
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
console.log(result.data.intent_token);`,php:`$response = $client->post('https://tebiby.com/connect/v1/booking-intents', [
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
$data = json_decode($response->getBody(), true);`,python:`import requests

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
intent_token = res.json()["data"]["intent_token"]`},successStatus:201,successResponse:JSON.stringify({status:"success",data:{intent_token:"bit_live_8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b",facility_id:1,doctor_id:4,appointment_date:"2026-11-23",appointment_time:"09:00",locked_fee:"250.00",currency:"SAR",expires_at:"2026-11-23T09:15:00+03:00",lifespan_seconds:900}},null,2),errorResponses:[{status:422,title:"خطأ تحقق في البيانات أو الموعد غير متاح",json:JSON.stringify({type:"https://tebiby.com/errors/validation-error",title:"Unprocessable Entity",status:422,detail:"The selected appointment slot is already fully booked or outside doctor schedule."},null,2)}]},{id:"create-appointment",method:"POST",path:"/connect/v1/facilities/{facility_id}/appointments",title:"تأكيد وحجز الموعد النهائي (Gate 1B - الخطوة الثانية)",subtitle:"Confirm & Book Final Appointment",description:"المسار النهائي لتسجيل الحجز الفعلي في جدول الطبيب ومنظومة الاستقبال، وإصدار رقم التذكرة ورمز الباركود الذكي (QR Code). يتطلب مفتاح منع التكرار X-Idempotency-Key.",requiresAuth:!0,authType:"Bearer <intent_token> أو sk_live_...",headers:[{name:"Authorization",required:!0,value:"Bearer bit_live_...",description:"رمز النية المؤقت أو المفتاح السري"},{name:"X-Idempotency-Key",required:!0,value:"idemp_req_abc12345678",description:"مفتاح فريد للطلب لمنع تكرار الحجز عند انقطاع الاتصال"},{name:"Content-Type",required:!0,value:"application/json",description:"نوع المحتوى"},{name:"Accept",required:!0,value:"application/json",description:"نوع الاستجابة"}],params:[{name:"facility_id",location:"path",type:"integer",required:!0,description:"معرف المنشأة في الرابط",example:"1"},{name:"intent_token",location:"body",type:"string",required:!0,description:"رمز الحجز المؤقت الصادر من مسار booking-intents",example:"bit_live_8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b"},{name:"external_patient_id",location:"body",type:"string (max 64)",required:!0,description:"رقم الملف الطبي للمريض في نظام المستشفى أو الشريك (HIS Patient ID)",example:"HIS-REC-90812"},{name:"patient_name",location:"body",type:"string (max 100)",required:!0,description:"اسم المريض الثلاثي أو الرباعي",example:"عبدالعزيز محمد الخالدي"},{name:"patient_phone",location:"body",type:"string (+9665xxxxxxxx)",required:!0,description:"رقم جوال المريض المعتمد بصيغة دولية صحيحة",example:"+966512345678"},{name:"notes",location:"body",type:"string (max 500)",required:!1,description:"ملاحظات المريض أو شكوى الحجز الأولية",example:"ألم حاد في الضرس العلوي منذ يومين"},{name:"type",location:"body",type:"enum (in_person | video)",required:!1,description:"نوع الزيارة (حضوري بالعيادة أو كشف عن بعد)",example:"in_person"}],snippets:{curl:`curl -X POST "https://tebiby.com/connect/v1/facilities/1/appointments" \\
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
  }'`,js:`const response = await fetch("https://tebiby.com/connect/v1/facilities/1/appointments", {
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
console.log(appointment.data.booking_reference);`,php:`$response = $client->post('https://tebiby.com/connect/v1/facilities/1/appointments', [
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
$data = json_decode($response->getBody(), true);`,python:`import requests, uuid

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
print(res.json()["data"]["booking_reference"])`},successStatus:201,successResponse:JSON.stringify({status:"success",data:{appointment_id:142,booking_reference:"TEB-OLAYA-20261123-K7M2",status:"confirmed",facility:{id:1,name:"مستشفى د. سليمان الحبيب - العليا"},doctor:{id:4,name:"د. عبدالمحسن الشمري"},appointment_date:"2026-11-23",appointment_time:"09:00",queue_number:"A-014",patient:{external_patient_id:"HIS-PAT-90812",name:"عبدالعزيز محمد الخالدي",phone:"+966512345678"},fee_amount:"250.00",currency:"SAR",qr_code_payload:"TEBIBY:APPT:TEB-OLAYA-20261123-K7M2",created_at:"2026-11-22T19:30:00+03:00"}},null,2),errorResponses:[{status:409,title:"تعارض في مفتاح عدم التكرار (Idempotency Mismatch) أو حجز مكرر",json:JSON.stringify({type:"https://tebiby.com/errors/idempotency-mismatch",title:"Conflict",status:409,detail:"The X-Idempotency-Key has already been used with a different request payload."},null,2)},{status:429,title:"تجاوز حد الحجوزات اليومي للرقم (5 حجوزات / يوم)",json:JSON.stringify({type:"https://tebiby.com/errors/rate-limit-exceeded",title:"Too Many Requests",status:429,detail:"Daily booking quota exceeded for this patient phone number (max 5 appointments per day)."},null,2)}]},{id:"cancel-appointment",method:"POST",path:"/connect/v1/facilities/{facility_id}/appointments/{booking_reference}/cancel",title:"إلغاء الموعد واسترداد الحجز",subtitle:"Cancel Appointment & Release Slot",description:"يقوم هذا المسار بإلغاء موعد مؤكد وإعادة إتاحة الوقت والعيادة للمرضى الآخرين، وتحديث حالة التذكرة في شاشات الاستقبال والانتظار.",requiresAuth:!0,authType:"Bearer sk_live_...",headers:[{name:"Authorization",required:!0,value:"Bearer sk_live_YOUR_KEY",description:"مفتاح الربط السري"},{name:"Content-Type",required:!0,value:"application/json",description:"نوع المحتوى"},{name:"Accept",required:!0,value:"application/json",description:"نوع الاستجابة"}],params:[{name:"facility_id",location:"path",type:"integer",required:!0,description:"معرف المنشأة في الرابط",example:"1"},{name:"booking_reference",location:"path",type:"string",required:!0,description:"كود الحجز الطبي الموحد الصادر عند التأكيد",example:"TEB-OLAYA-20261123-K7M2"},{name:"reason",location:"body",type:"string (max 255)",required:!1,description:"سبب الإلغاء المدخل من قبل المريض أو العيادة",example:"طلب المريض تغيير الموعد لظرف عمل"}],snippets:{curl:`curl -X POST "https://tebiby.com/connect/v1/facilities/1/appointments/TEB-OLAYA-20261123-K7M2/cancel" \\
  -H "Authorization: Bearer sk_live_YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "reason": "طلب المريض الإلغاء"
  }'`,js:`const response = await fetch(
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
console.log(result.status);`,php:`$response = $client->post(
    'https://tebiby.com/connect/v1/facilities/1/appointments/TEB-OLAYA-20261123-K7M2/cancel',
    [
        'headers' => [
            'Authorization' => 'Bearer sk_live_YOUR_SECRET_KEY',
            'Content-Type' => 'application/json',
        ],
        'json' => ['reason' => 'طلب المريض الإلغاء'],
    ]
);`,python:`import requests

res = requests.post(
    "https://tebiby.com/connect/v1/facilities/1/appointments/TEB-OLAYA-20261123-K7M2/cancel",
    headers={"Authorization": "Bearer sk_live_YOUR_SECRET_KEY"},
    json={"reason": "طلب المريض الإلغاء"}
)`},successStatus:200,successResponse:JSON.stringify({status:"success",message:"تم إلغاء الموعد وإعادة فتح الموعد بنجاح.",data:{booking_reference:"TEB-OLAYA-20261123-K7M2",status:"cancelled",cancelled_at:"2026-11-22T19:35:12+03:00",cancellation_reason:"طلب المريض الإلغاء"}},null,2),errorResponses:[{status:404,title:"الحجز غير موجود",json:JSON.stringify({type:"https://tebiby.com/errors/not-found",title:"Not Found",status:404,detail:"No appointment found with the provided booking reference."},null,2)}]}],B=()=>{var x,m;const[l,f]=r.useState(i[0].id),[o,_]=r.useState("curl"),[c,d]=r.useState(null),s=i.find(t=>t.id===l)||i[0],p=(t,a)=>{navigator.clipboard.writeText(t),d(a),setTimeout(()=>d(null),2e3)};return e.jsxs("div",{className:"space-y-8 font-['Tajawal']",dir:"rtl",children:[e.jsxs("div",{className:"p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#005ab5] via-blue-700 to-indigo-900 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"}),e.jsxs("div",{className:"relative z-10 max-w-3xl space-y-3",children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-100",children:[e.jsx(b,{className:"w-3.5 h-3.5 text-cyan-300"}),e.jsx("span",{children:"Tebiby Connect API — مواصفات ومعايير الربط البرمجي v1"})]}),e.jsx("h1",{className:"text-2xl sm:text-3xl font-black font-['Cairo'] leading-tight",children:"دليل التكامل والربط المباشر مع منظومة طبيبي"}),e.jsxs("p",{className:"text-sm text-blue-100/90 leading-relaxed",children:["توفر واجهة برمجة تطبيقات ",e.jsx("strong",{className:"text-white",children:"Tebiby Connect"})," لشركاء الرعاية الصحية والمستشفيات تكاملاً آمناً ومباشراً مع أنظمتهم الداخلية (HIS / EMR). يمكنك استعلام المواعيد، قفل الأسعار، وإتمام الحجوزات الطبية في أجزاء من الثانية."]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-4 pt-3 text-xs text-blue-200",children:[e.jsxs("div",{className:"flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 font-mono",children:[e.jsx("span",{className:"text-gray-400",children:"Base URL:"}),e.jsx("span",{className:"text-cyan-300 font-bold",children:"https://tebiby.com/connect/v1"})]}),e.jsxs("div",{className:"flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-400/30 text-emerald-300 font-bold",children:[e.jsx(N,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"معتمد ومطابق لمعايير HIPAA & NDMO"})]})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",children:[e.jsxs("div",{className:"lg:col-span-4 space-y-4 lg:sticky lg:top-6",children:[e.jsxs("div",{className:"p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3",children:[e.jsx("div",{className:"px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider font-['Cairo']",children:"المسارات البرمجية المتاحة"}),e.jsx("div",{className:"space-y-1.5",children:i.map(t=>{const a=t.id===l,j=t.method==="GET";return e.jsxs("button",{type:"button",onClick:()=>f(t.id),className:n("w-full text-right p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer group border",a?"bg-blue-50/80 border-blue-200 shadow-xs":"bg-white border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600"),children:[e.jsx("span",{className:n("px-2 py-0.5 rounded-lg text-[10px] font-black font-mono shrink-0 mt-0.5",j?"bg-emerald-100 text-emerald-800":"bg-blue-100 text-[#005ab5]"),children:t.method}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("div",{className:n("text-xs font-bold truncate leading-snug",a?"text-[#005ab5]":"text-slate-800 group-hover:text-slate-900"),children:t.title}),e.jsx("div",{className:"text-[11px] font-mono text-slate-400 truncate mt-0.5 dir-ltr text-left",children:t.path.replace("/connect/v1","")})]})]},t.id)})})]}),e.jsxs("div",{className:"p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-2 text-cyan-400 text-xs font-bold font-['Cairo']",children:[e.jsx(k,{className:"w-4 h-4"}),e.jsx("span",{children:"المصادقة والتوثيق الأمني"})]}),e.jsx("p",{className:"text-xs text-slate-300 leading-relaxed",children:"جميع الطلبات البرمجية تتطلب إرسال الترويسة التالية في الـ Request Headers:"}),e.jsx("div",{className:"p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-700/60 select-all dir-ltr text-left",children:"Authorization: Bearer sk_live_..."}),e.jsx("p",{className:"text-[11px] text-slate-400",children:"ملاحظة: مفتاح الـ Live يعمل فقط مع بيانات الإنتاج الحقيقية، بينما Sandbox مخصص للاختبار والمحاكاة."})]})]}),e.jsxs("div",{className:"lg:col-span-8 space-y-6",children:[e.jsxs("div",{className:"p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("span",{className:n("px-2.5 py-1 rounded-xl text-xs font-black font-mono shadow-xs",s.method==="GET"?"bg-emerald-500 text-white":"bg-[#005ab5] text-white"),children:s.method}),e.jsx("span",{className:"font-mono text-xs sm:text-sm font-bold text-slate-800 dir-ltr select-all",children:s.path})]}),e.jsx("button",{type:"button",onClick:()=>p(s.path,"path"),className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors",children:c==="path"?e.jsxs(e.Fragment,{children:[e.jsx(u,{className:"w-3.5 h-3.5 text-emerald-600"}),e.jsx("span",{className:"text-emerald-700",children:"تم النسخ"})]}):e.jsxs(e.Fragment,{children:[e.jsx(h,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"نسخ المسار"})]})})]}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-black font-['Cairo'] text-slate-900",children:s.title}),e.jsx("p",{className:"text-xs text-slate-400 font-mono mt-0.5",children:s.subtitle}),e.jsx("p",{className:"text-sm text-slate-600 leading-relaxed mt-2.5",children:s.description})]})]}),s.headers&&s.headers.length>0&&e.jsxs("div",{className:"p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4",children:[e.jsxs("h3",{className:"text-sm font-bold font-['Cairo'] text-slate-900 flex items-center gap-2",children:[e.jsx(T,{className:"w-4 h-4 text-[#005ab5]"}),e.jsx("span",{children:"ترويسات الطلب المطلوبة (Request Headers)"})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-right text-xs",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b border-slate-100 text-slate-400 font-bold font-['Cairo']",children:[e.jsx("th",{className:"pb-2.5 font-bold",children:"الاسم"}),e.jsx("th",{className:"pb-2.5 font-bold",children:"الحالة"}),e.jsx("th",{className:"pb-2.5 font-bold",children:"مثال للقيمة"}),e.jsx("th",{className:"pb-2.5 font-bold",children:"الوصف"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100",children:s.headers.map((t,a)=>e.jsxs("tr",{className:"hover:bg-slate-50/50",children:[e.jsx("td",{className:"py-3 font-mono font-bold text-slate-800",children:t.name}),e.jsx("td",{className:"py-3",children:t.required?e.jsx("span",{className:"px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200",children:"مطلوب Required"}):e.jsx("span",{className:"px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200",children:"اختياري Optional"})}),e.jsx("td",{className:"py-3 font-mono text-slate-600 dir-ltr text-left",children:t.value}),e.jsx("td",{className:"py-3 text-slate-500",children:t.description})]},a))})]})})]}),e.jsxs("div",{className:"p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("h3",{className:"text-sm font-bold font-['Cairo'] text-slate-900 flex items-center gap-2",children:[e.jsx(A,{className:"w-4 h-4 text-[#005ab5]"}),e.jsx("span",{children:"المعاملات والحقول البرمجية (Parameters & Payload)"})]}),e.jsxs("span",{className:"text-[11px] text-slate-400 font-bold",children:[s.params.filter(t=>t.required).length," حقول مطلوبة إلزامياً"]})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-right text-xs",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b border-slate-100 text-slate-400 font-bold font-['Cairo']",children:[e.jsx("th",{className:"pb-3 font-bold",children:"اسم الحقل"}),e.jsx("th",{className:"pb-3 font-bold",children:"الموقع"}),e.jsx("th",{className:"pb-3 font-bold",children:"النوع"}),e.jsx("th",{className:"pb-3 font-bold",children:"الإلزامية"}),e.jsx("th",{className:"pb-3 font-bold",children:"الوصف والتفاصيل"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100",children:s.params.map((t,a)=>e.jsxs("tr",{className:"hover:bg-slate-50/50 transition-colors",children:[e.jsxs("td",{className:"py-3.5 font-mono font-bold text-slate-900",children:[t.name,t.example&&e.jsxs("span",{className:"block text-[10px] font-normal text-slate-400 font-mono mt-0.5",children:["مثال: ",t.example]})]}),e.jsx("td",{className:"py-3.5 font-mono text-[11px] text-slate-500",children:e.jsx("span",{className:"px-2 py-0.5 rounded-md bg-slate-100 font-bold",children:t.location})}),e.jsx("td",{className:"py-3.5 font-mono text-[11px] text-blue-600 font-bold",children:t.type}),e.jsx("td",{className:"py-3.5",children:t.required?e.jsxs("span",{className:"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200",children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"}),"مطلوب Required"]}):e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200",children:"اختياري Optional"})}),e.jsx("td",{className:"py-3.5 text-slate-600 leading-relaxed",children:t.description})]},a))})]})})]}),e.jsxs("div",{className:"p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(b,{className:"w-4 h-4 text-cyan-400"}),e.jsx("span",{className:"text-xs font-bold font-['Cairo'] text-slate-200",children:"نموذج الكود البرمجي للتنفيذ"})]}),e.jsx("div",{className:"flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800",children:["curl","js","php","python"].map(t=>e.jsx("button",{type:"button",onClick:()=>_(t),className:n("px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase font-mono cursor-pointer",o===t?"bg-[#005ab5] text-white shadow-xs":"text-slate-400 hover:text-white"),children:t},t))})]}),e.jsxs("div",{className:"relative",children:[e.jsx("pre",{className:"p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 dir-ltr text-left",children:e.jsx("code",{children:s.snippets[o]})}),e.jsx("button",{type:"button",onClick:()=>p(s.snippets[o],"snippet"),className:"absolute top-3 right-3 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700",title:"نسخ الكود",children:c==="snippet"?e.jsx(u,{className:"w-4 h-4 text-emerald-400"}):e.jsx(h,{className:"w-4 h-4"})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{className:"p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(g,{className:"w-4 h-4 text-emerald-600"}),e.jsxs("span",{className:"text-xs font-bold font-['Cairo'] text-slate-900",children:["استجابة النجاح (",s.successStatus,")"]})]}),e.jsxs("span",{className:"px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 font-mono",children:["HTTP ",s.successStatus," OK"]})]}),e.jsx("pre",{className:"p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed dir-ltr text-left max-h-72",children:e.jsx("code",{children:s.successResponse})})]}),e.jsxs("div",{className:"p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(v,{className:"w-4 h-4 text-amber-500"}),e.jsx("span",{className:"text-xs font-bold font-['Cairo'] text-slate-900",children:"نموذج الخطأ القياسي (RFC 7807)"})]}),e.jsxs("span",{className:"px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 font-mono",children:["HTTP ",(x=s.errorResponses[0])==null?void 0:x.status]})]}),e.jsx("pre",{className:"p-3.5 rounded-2xl bg-slate-900 text-rose-300 font-mono text-[11px] overflow-x-auto leading-relaxed dir-ltr text-left max-h-72",children:e.jsx("code",{children:(m=s.errorResponses[0])==null?void 0:m.json})})]})]})]})]})]})};export{B as A};
