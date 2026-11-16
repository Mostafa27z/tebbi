import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const LiveClockBadge: React.FC = React.memo(() => {
    const [currentTime, setCurrentTime] = useState<string>('');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
            );
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/70 border border-blue-100/80 rounded-2xl text-xs">
            <Clock className="w-4 h-4 text-[#005ab5]" />
            <span className="text-[11px] text-gray-500 hidden sm:inline">الوقت:</span>
            <span className="font-mono font-bold text-[#005ab5]">{currentTime || '...'}</span>
        </div>
    );
});
LiveClockBadge.displayName = 'LiveClockBadge';
