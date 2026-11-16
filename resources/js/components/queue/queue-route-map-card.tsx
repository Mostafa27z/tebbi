import React, { useState, memo } from 'react';
import { MapPin, Car, Clock, Compass, Navigation, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueRouteMapCardProps {
    clinicLocation: {
        name: string;
        branch: string;
        district: string;
        city: string;
        address: string;
        phone: string;
        latitude?: number;
        longitude?: number;
    };
    userLocation: {
        lat: number;
        lng: number;
        label: string;
        isLiveGps: boolean;
    };
    distanceInfo: {
        km: number;
        minutes: number;
    };
    locating: boolean;
    onRefreshGps: () => void;
    googleMapsNavUrl: string;
}

export const QueueRouteMapCard = memo(function QueueRouteMapCard({
    clinicLocation,
    userLocation,
    distanceInfo,
    locating,
    onRefreshGps,
    googleMapsNavUrl,
}: QueueRouteMapCardProps) {
    const [mapMode, setMapMode] = useState<'route' | 'destination'>('route');

    const cLat = Number(clinicLocation.latitude) || 24.6978;
    const cLng = Number(clinicLocation.longitude) || 46.6841;

    const routeEmbedUrl = `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${cLat},${cLng}&output=embed&hl=ar`;
    const destinationEmbedUrl = `https://maps.google.com/maps?q=${cLat},${cLng}&hl=ar&z=15&output=embed`;

    return (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5 h-full">
            <div className="space-y-4">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#005ab5] flex items-center justify-center shrink-0 border border-blue-100">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 font-['Cairo']">
                                الخريطة المباشرة ومسار الوصول للعيادة
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {clinicLocation.name} — {clinicLocation.address || `${clinicLocation.district}، ${clinicLocation.city}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setMapMode('route')}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                    mapMode === 'route'
                                        ? 'bg-white text-[#005ab5] shadow-xs'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                مسار الملاحة
                            </button>
                            <button
                                type="button"
                                onClick={() => setMapMode('destination')}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                                    mapMode === 'destination'
                                        ? 'bg-white text-[#005ab5] shadow-xs'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                موقع المستشفى
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onRefreshGps}
                            disabled={locating}
                            className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#005ab5] border border-blue-200/70 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Compass className={cn('w-3.5 h-3.5', locating && 'animate-spin')} />
                            <span>{locating ? 'جارٍ التحديد...' : 'تحديث GPS'}</span>
                        </button>
                    </div>
                </div>

                {/* Route Summary Strip (Origin A -> Destination B + Distance & Time) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-[#005ab5] text-white font-black text-xs flex items-center justify-center shrink-0 font-['Cairo']">
                                أ
                            </span>
                            <div className="min-w-0">
                                <span className="text-[11px] font-bold text-[#005ab5] block">
                                    نقطة انطلاقك (موقعك)
                                </span>
                                <span className="text-xs font-black text-slate-900 truncate block">
                                    {userLocation.label}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 font-['Cairo']">
                                ب
                            </span>
                            <div className="min-w-0">
                                <span className="text-[11px] font-bold text-emerald-700 block">
                                    الوجهة (المستشفى)
                                </span>
                                <span className="text-xs font-black text-slate-900 truncate block">
                                    {clinicLocation.name} ({clinicLocation.district || clinicLocation.city})
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 text-slate-700">
                                <Car className="w-4 h-4 text-[#005ab5]" />
                                <span>المسافة بينكما:</span>
                                <strong className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                    {distanceInfo.km} كم
                                </strong>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-700">
                                <Clock className="w-4 h-4 text-emerald-600" />
                                <span>الوقت المقدر:</span>
                                <strong className="font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                    ~{distanceInfo.minutes} دقيقة بالسيارة
                                </strong>
                            </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#005ab5] border border-blue-200/60 text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-[#005ab5] animate-pulse" />
                            <span>في الطريق إلى العيادة</span>
                        </span>
                    </div>
                </div>

                {/* Live Interactive Google Maps Iframe */}
                <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                    <iframe
                        title="الخريطة المباشرة ومسار الوصول للمستشفى"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapMode === 'route' ? routeEmbedUrl : destinationEmbedUrl}
                    />
                </div>
            </div>

            {/* Bottom Navigation & Call Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <a
                    href={googleMapsNavUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 w-full py-3.5 px-5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                    <Navigation className="w-4 h-4" />
                    <span>بدء الملاحة المباشرة خطوة بخطوة على Google Maps</span>
                </a>

                {clinicLocation.phone && (
                    <a
                        href={`tel:${clinicLocation.phone}`}
                        className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        <Phone className="w-4 h-4 text-slate-600" />
                        <span>اتصال بالاستقبال</span>
                    </a>
                )}
            </div>
        </div>
    );
});
