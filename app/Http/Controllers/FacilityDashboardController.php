<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\QueueTicket;
use App\Models\Specialty;
use App\Models\User;
use App\Services\ScopeResolver;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FacilityDashboardController extends Controller
{
    private function getFacilityData(Request $request): array
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->isGroupAdmin() && !$user->isFacilityAdmin() && !$user->isReceptionist()) {
            abort(403, 'غير مصرح لك بالوصول إلى لوحة إدارة المنشأة والاستقبال.');
        }

        $resolver = new ScopeResolver();
        $facilityIds = $resolver->accessibleFacilityIds($user);
        $facilities = Facility::whereIn('id', $facilityIds)->with('group')->get();

        $primaryFacility = $facilities->first();
        if (!$primaryFacility) {
            abort(404, 'لا توجد منشأة طبية مرتبطة بحسابك.');
        }

        $today = Carbon::today();

        // Doctors practicing at this facility
        $doctors = DoctorProfile::where('clinic_id', $primaryFacility->id)
            ->orWhereHas('doctorFacilities', function ($q) use ($primaryFacility) {
                $q->where('facility_id', $primaryFacility->id)->where('is_active', true);
            })
            ->with(['user', 'specialty', 'doctorFacilities' => function ($q) use ($primaryFacility) {
                $q->where('facility_id', $primaryFacility->id);
            }])
            ->get();

        // Today's appointments at this facility
        $todayAppointments = Appointment::where('facility_id', $primaryFacility->id)
            ->whereDate('appointment_date', $today)
            ->with(['patient', 'doctor.user', 'queueTicket'])
            ->orderBy('appointment_time')
            ->get();

        // All appointments for this facility (last 100)
        $allAppointments = Appointment::where('facility_id', $primaryFacility->id)
            ->with(['patient', 'doctor.user', 'queueTicket'])
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->take(100)
            ->get();

        $specialties = $doctors->pluck('specialty')->filter()->unique('id')->values();

        $totalToday = $todayAppointments->count();
        $waitingCount = $todayAppointments->where('status', 'waiting')->count();
        $inConsultationCount = $todayAppointments->where('status', 'in_consultation')->count();
        $completedCount = $todayAppointments->where('status', 'completed')->count();
        $notArrivedCount = $todayAppointments->whereIn('status', ['confirmed', 'booked'])->count();
        $insuranceCount = $todayAppointments->where('payment_method', 'insurance')->count();

        $metrics = [
            'doctorsCount' => $doctors->count(),
            'activeDoctorsCount' => $doctors->where('is_available_today', true)->count(),
            'specialtiesCount' => $specialties->count(),
            'totalToday' => $totalToday,
            'waitingCount' => $waitingCount,
            'inConsultationCount' => $inConsultationCount,
            'completedCount' => $completedCount,
            'notArrivedCount' => $notArrivedCount,
            'insuranceCount' => $insuranceCount,
        ];

        return [
            'facility' => $primaryFacility,
            'facilities' => $facilities,
            'metrics' => $metrics,
            'doctors' => $doctors,
            'specialties' => $specialties,
            'todayAppointments' => $todayAppointments,
            'allAppointments' => $allAppointments,
        ];
    }

    public function index(Request $request): Response
    {
        $data = $this->getFacilityData($request);
        return Inertia::render('facility/dashboard', $data);
    }

    public function doctors(Request $request): Response
    {
        $data = $this->getFacilityData($request);
        return Inertia::render('facility/doctors', $data);
    }

    public function specialties(Request $request): Response
    {
        $data = $this->getFacilityData($request);
        return Inertia::render('facility/specialties', $data);
    }

    public function appointments(Request $request): Response
    {
        $data = $this->getFacilityData($request);
        return Inertia::render('facility/appointments', $data);
    }

    public function toggleDoctorPresence(Request $request, DoctorProfile $doctor): RedirectResponse
    {
        $doctor->update([
            'is_available_today' => ! $doctor->is_available_today,
        ]);

        $statusText = $doctor->is_available_today ? 'حاضر ومتاح لاستقبال الحالات' : 'معلّق وغير حاضر اليوم';
        return back()->with('success', "تم تحديث حالة الطبيب ({$doctor->user->name}) إلى: {$statusText}");
    }

    public function updateStatus(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:confirmed,waiting,in_consultation,completed,cancelled',
        ]);

        $status = $validated['status'];
        $appointment->update(['status' => $status]);

        $ticket = $appointment->queueTicket;
        if ($status === 'waiting') {
            if ($ticket) {
                $ticket->update(['status' => 'waiting']);
            } else {
                $nextNum = QueueTicket::whereDate('queue_date', $appointment->appointment_date)
                    ->whereHas('appointment', fn($q) => $q->where('doctor_id', $appointment->doctor_id))
                    ->max('ticket_number') ?? 0;

                QueueTicket::create([
                    'appointment_id' => $appointment->id,
                    'ticket_number' => $nextNum + 1,
                    'status' => 'waiting',
                    'queue_date' => $appointment->appointment_date,
                    'estimated_wait_minutes' => 15,
                ]);
            }
        } elseif ($status === 'in_consultation' && $ticket) {
            $ticket->update(['status' => 'examining', 'started_at' => Carbon::now()]);
        } elseif ($status === 'completed' && $ticket) {
            $ticket->update(['status' => 'completed', 'completed_at' => Carbon::now()]);
        } elseif ($status === 'cancelled' && $ticket) {
            $ticket->update(['status' => 'cancelled']);
        }

        $statusLabels = [
            'confirmed' => 'لم يحضر بعد (مؤكد)',
            'waiting' => 'حضر بالاستقبال (في الانتظار)',
            'in_consultation' => 'داخل العيادة مع الطبيب',
            'completed' => 'مكتمل (أنهى وغادر)',
            'cancelled' => 'غائب / ملغي',
        ];

        return back()->with('success', "تم تحديث حالة المريض ({$appointment->patient->name}) إلى: " . ($statusLabels[$status] ?? $status));
    }

    public function updatePayment(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'payment_status' => 'required|in:paid,pending,refunded',
            'payment_method' => 'required|in:cash,pos,card,insurance',
            'total_amount' => 'nullable|numeric',
        ]);

        $updateData = [
            'payment_status' => $validated['payment_status'],
            'payment_method' => $validated['payment_method'],
        ];

        if ($request->filled('total_amount')) {
            $updateData['total_amount'] = $validated['total_amount'];
        }

        $appointment->update($updateData);

        $methodLabels = [
            'cash' => 'نقداً (Cash)',
            'pos' => 'شبكة / مدى (POS)',
            'card' => 'بطاقة ائتمانية',
            'insurance' => 'تأمين طبي معتمد',
        ];

        return back()->with('success', "تم تسجيل تحصيل الرسوم للمريض ({$appointment->patient->name}) بنجاح عبر: " . ($methodLabels[$validated['payment_method']] ?? $validated['payment_method']));
    }

    public function markArrived(Request $request, Appointment $appointment): RedirectResponse
    {
        $appointment->update([
            'status' => 'waiting',
        ]);

        $ticket = $appointment->queueTicket;
        if ($ticket) {
            $ticket->update(['status' => 'waiting']);
        } else {
            $nextNum = QueueTicket::whereDate('queue_date', $appointment->appointment_date)
                ->whereHas('appointment', fn($q) => $q->where('doctor_id', $appointment->doctor_id))
                ->max('ticket_number') ?? 0;

            QueueTicket::create([
                'appointment_id' => $appointment->id,
                'ticket_number' => $nextNum + 1,
                'status' => 'waiting',
                'queue_date' => $appointment->appointment_date,
                'estimated_wait_minutes' => 15,
            ]);
        }

        return back()->with('success', "تم تسجيل وصول المريض ({$appointment->patient->name}) بالاستقبال وإشعار العيادة.");
    }

    public function markNoShow(Request $request, Appointment $appointment): RedirectResponse
    {
        $appointment->update(['status' => 'cancelled']);
        if ($appointment->queueTicket) {
            $appointment->queueTicket->update(['status' => 'cancelled']);
        }
        return back()->with('success', "تم تسجيل عدم حضور الحالة ({$appointment->patient->name}).");
    }

    public function issueWalkInTicket(Request $request, Facility $facility): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        if (!$resolver->canManageFacility($user, $facility->id) && !$user->isReceptionist($facility->id)) {
            abort(403, 'غير مصرح لك بقطع تذاكر لهذه المنشأة.');
        }

        $validated = $request->validate([
            'doctor_profile_id' => 'required|exists:doctor_profiles,id',
            'patient_name' => 'required|string|max:255',
            'patient_phone' => 'required|string|max:30',
            'patient_national_id' => 'nullable|string|max:20',
        ]);

        $doctor = DoctorProfile::findOrFail($validated['doctor_profile_id']);

        // Find or create patient user
        $patient = User::firstOrCreate(
            ['phone' => $validated['patient_phone']],
            [
                'name' => $validated['patient_name'],
                'email' => 'walkin_' . Str::random(8) . '@tebiby.com',
                'password' => Hash::make(Str::random(12)),
                'role' => 'patient',
                'national_id' => $validated['patient_national_id'] ?? null,
            ]
        );

        $today = Carbon::today();
        $now = Carbon::now();

        // Calculate next ticket number for doctor today
        $nextTicketNumber = QueueTicket::whereDate('queue_date', $today)
            ->whereHas('appointment', fn($q) => $q->where('doctor_id', $doctor->id))
            ->max('ticket_number') ?? 0;

        $newTicketNumber = $nextTicketNumber + 1;

        $bookingRef = 'WLK-' . strtoupper(Str::random(6));

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'booking_reference' => $bookingRef,
            'appointment_date' => $today->toDateString(),
            'appointment_time' => $now->format('H:i:s'),
            'status' => 'waiting',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'total_amount' => $doctor->consultation_fee ?? 200,
        ]);

        QueueTicket::create([
            'appointment_id' => $appointment->id,
            'ticket_number' => $newTicketNumber,
            'status' => 'waiting',
            'queue_date' => $today->toDateString(),
            'estimated_wait_minutes' => 15,
        ]);

        return back()->with('success', "تم قطع التذكرة الفورية بنجاح برقم #{$newTicketNumber} للمريض ({$patient->name}).");
    }
}
