import React, { useMemo } from 'react';
import { generateQRMatrix } from '@/lib/qr-generator';
import { cn } from '@/lib/utils';

interface QRCodeProps {
    value: string;
    size?: number;
    fgColor?: string;
    bgColor?: string;
    className?: string;
    includeMargin?: boolean;
    title?: string;
}

export const QRCode: React.FC<QRCodeProps> = ({
    value,
    size = 200,
    fgColor = '#003875',
    bgColor = '#FFFFFF',
    className,
    includeMargin = true,
    title,
}) => {
    const matrix = useMemo(() => {
        try {
            return generateQRMatrix(value || 'TEBBY');
        } catch (e) {
            console.error('Failed to generate QR matrix', e);
            return null;
        }
    }, [value]);

    if (!matrix) {
        return (
            <div
                style={{ width: size, height: size }}
                className={cn('flex items-center justify-center bg-gray-100 text-gray-400 text-xs rounded-2xl', className)}
            >
                خطأ في إنشاء الـ QR
            </div>
        );
    }

    const { size: matrixSize, modules } = matrix;
    const margin = includeMargin ? 2 : 0;
    const totalSize = matrixSize + margin * 2;

    return (
        <div className={cn('inline-flex flex-col items-center justify-center', className)}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${totalSize} ${totalSize}`}
                shapeRendering="crispEdges"
                className="rounded-xl shadow-2xs"
                role="img"
                aria-label={title || value}
            >
                {/* Background */}
                <rect width={totalSize} height={totalSize} fill={bgColor} />

                {/* Modules */}
                {modules.map((row, r) =>
                    row.map((cell, c) => {
                        if (!cell) return null;
                        return (
                            <rect
                                key={`${r}-${c}`}
                                x={c + margin}
                                y={r + margin}
                                width={1}
                                height={1}
                                fill={fgColor}
                            />
                        );
                    })
                )}
            </svg>
            {title && (
                <span className="text-[11px] font-bold text-gray-500 mt-2 font-mono">
                    {title}
                </span>
            )}
        </div>
    );
};

export default QRCode;
