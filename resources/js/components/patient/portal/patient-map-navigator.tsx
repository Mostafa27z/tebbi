import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Car, Clock, Compass, AlertCircle, Navigation, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const nLat1 = Number(lat1) || 0;
    const nLon1 = Number(lon1) || 0;
    const nLat2 = Number(lat2) || 0;
    const nLon2 = Number(lon2) || 0;
    const R = 6371;
    const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
    const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((nLat1 * Math.PI) / 180) *
            Math.cos((nLat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    const speedKmH = 35;
    const mins = Math.round((d / speedKmH) * 60) + 4;
    return { km: Number(d.toFixed(1)), minutes: Math.max(5, mins) };
}

interface PatientMapNavigatorProps {
    clinicLoc: {
        name: string;
        phone?: string;
        latitude?: number;
        longitude?: number;
    };
}

export const PatientMapNavigator: React.FC<PatientMapNavigatorProps> = React.memo(({ clinicLoc }) => {
    const cLat = Number(clinicLoc.latitude) || 24.7136;
    const cLng = Number(clinicLoc.longitude) || 46.6753;

    const [mapMode, setMapMode] = useState<'destination' | 'route'>('destination');
    const [userLocation, setUserLocation] = useState(() => ({
        lat: Number((cLat + 0.054).toFixed(4)),
        lng: Number((cLng - 0.032).toFixed(4)),
        isLiveGps: false,
    }));
    const [distanceInfo, setDistanceInfo] = useState(() =>
        calculateHaversineDistance(cLat + 0.054, cLng - 0.032, cLat, cLng)
    );
    const [locating, setLocating] = useState(false);
    const [locError, setLocError] = useState<string | null>(null);

    const handleGetLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocError('المتصفح لا يدعم تحديد الموقع الجغرافي.');
            toast.error('المتصفح لا يدعم خدمة تحديد الموقع.');
            return;
        }
        setLocating(true);
        setLocError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const uLat = pos.coords.latitude;
                const uLng = pos.coords.longitude;
                setUserLocation({
                    lat: uLat,
                    lng: uLng,
                    isLiveGps: true,
                });
                const dist = calculateHaversineDistance(uLat, uLng, cLat, cLng);
                setDistanceInfo(dist);
                setLocating(false);
                toast.success(`تم تحديد موقعك بدقة! المسافة إلى المستشفى: ${dist.km} كم (${dist.minutes} دقيقة).`);
            },
            () => {
                setLocating(false);
                setLocError('تعذر تحديد موقعك الفعلي بدقة. يرجى تفعيل إذن الـ GPS.');
                toast.error('تعذر تحديد الموقع الفعلي، يرجى تفعيل الـ GPS.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [cLat, cLng]);

    const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${cLat},${cLng}`;
    const cleanDestinationEmbedUrl = `https://maps.google.com/maps?q=${cLat},${cLng}&hl=ar&z=15&output=embed`;
    const cleanRouteEmbedUrl = `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${cLat},${cLng}&output=embed&hl=ar`;

    return (
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 font-['Cairo']">
                                المسار الملاحي للمستشفى
                            </h3>
                            <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                                {clinicLoc.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-gray-100 p-0.5 rounded-xl text-[10px] font-bold">
                        <button
                            type="button"
                            onClick={() => setMapMode('destination')}
                            className={cn(
                                'px-2 py-1 rounded-lg transition-all cursor-pointer',
                                mapMode === 'destination' ? 'bg-white text-[#005ab5] shadow-xs' : 'text-gray-500'
                            )}
                        >
                            المستشفى
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapMode('route')}
                            className={cn(
                                'px-2 py-1 rounded-lg transition-all cursor-pointer',
                                mapMode === 'route' ? 'bg-white text-[#005ab5] shadow-xs' : 'text-gray-500'
                            )}
                        >
                            مسار الطريق
                        </button>
                    </div>
                </div>

                <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-100/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Car className="w-3.5 h-3.5 text-[#005ab5]" />
                            <span className="text-gray-600 text-[11px]">المسافة:</span>
                            <span className="font-black text-gray-900 font-mono">{distanceInfo.km} كم</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-gray-600 text-[11px]">المدة:</span>
                            <span className="font-black text-emerald-800 font-mono">~{distanceInfo.minutes} د</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={locating}
                        className="text-[10px] font-bold text-[#005ab5] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="تحديث الموقع المباشر بالـ GPS"
                    >
                        <Compass className={cn('w-3 h-3', locating && 'animate-spin')} />
                        <span>تحديث GPS</span>
                    </button>
                </div>

                {locError && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] mb-3 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>{locError}</span>
                    </div>
                )}

                <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative bg-gray-100">
                    <iframe
                        title="خريطة موقع المستشفى والمسار"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapMode === 'destination' ? cleanDestinationEmbedUrl : cleanRouteEmbedUrl}
                    />
                </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <a
                    href={googleMapsNavUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 w-full py-2.5 px-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>بدء الملاحة عبر Google Maps</span>
                </a>

                {clinicLoc.phone && (
                    <a
                        href={`tel:${clinicLoc.phone}`}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        <span>اتصال</span>
                    </a>
                )}
            </div>
        </div>
    );
});
PatientMapNavigator.displayName = 'PatientMapNavigator';
