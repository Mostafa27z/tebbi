import React, { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Camera, Trash2, Upload, User, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { LoadingButton } from '@/components/common/loading-button';
import { SurfaceCard } from '@/components/common/surface-card';
import { notify } from '@/components/common/toast';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
    currentAvatar?: string | null;
    userName: string;
    userRole?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = React.memo(({
    currentAvatar,
    userName,
    userRole,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Get initials for fallback avatar
    const getInitials = (name: string) => {
        if (!name) return 'ط';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]} ${parts[1][0]}`;
        }
        return name.slice(0, 2);
    };

    const handleFileChange = (file: File | undefined) => {
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            notify.error('خطأ في الملف', 'يرجى اختيار ملف صورة صالح (JPG, PNG, WebP).');
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            notify.error('حجم الملف كبير', 'الحد الأقصى لحجم الصورة هو 3 ميجابايت.');
            return;
        }

        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleSaveAvatar = () => {
        if (!selectedFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('avatar', selectedFile);

        router.post('/settings/avatar', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsUploading(false);
                setSelectedFile(null);
                setPreviewUrl(null);
            },
            onError: () => {
                setIsUploading(false);
            },
        });
    };

    const handleCancelPreview = () => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleDeleteAvatar = () => {
        if (!currentAvatar) return;

        if (!confirm('هل أنت متأكد من رغبتك في إزالة صورتك الشخصية والعودة للصورة الافتراضية؟')) {
            return;
        }

        setIsDeleting(true);
        router.delete('/settings/avatar', {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setSelectedFile(null);
                setPreviewUrl(null);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const displayAvatar = previewUrl || currentAvatar;

    return (
        <SurfaceCard padding="lg" rounded="3xl" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar Display */}
                <div
                    className={cn(
                        'relative group shrink-0 cursor-pointer',
                        dragActive && 'ring-4 ring-[#005ab5] rounded-3xl'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    title="انقر لتغيير الصورة الشخصية"
                >
                    {displayAvatar ? (
                        <img
                            src={displayAvatar}
                            alt={userName}
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-[#005ab5]/20 shadow-md group-hover:opacity-90 transition-all"
                        />
                    ) : (
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-[#005ab5] to-blue-400 flex flex-col items-center justify-center text-white font-black text-2xl font-['Cairo'] shadow-md ring-4 ring-[#005ab5]/15">
                            <span>{getInitials(userName)}</span>
                            <span className="text-[10px] font-semibold text-blue-100 mt-1">
                                {userRole || 'طبيبي'}
                            </span>
                        </div>
                    )}

                    {/* Camera Overlay Icon */}
                    <div className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera className="w-7 h-7" />
                    </div>

                    <button
                        type="button"
                        className="absolute -bottom-2 -left-2 w-9 h-9 rounded-2xl bg-[#005ab5] text-white flex items-center justify-center shadow-md hover:bg-[#00458e] transition-colors border-2 border-white"
                        title="اختيار صورة"
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                </div>

                {/* Info & Action Controls */}
                <div className="flex-1 text-center sm:text-right space-y-3">
                    <div>
                        <h3 className="text-base font-black text-gray-900 font-['Cairo']">
                            الصورة الشخصية
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                            اختر صورة شخصية واضحة بصيغة JPG أو PNG أو WebP بحجم لا يتجاوز 3 ميجابايت.
                            تظهر صورتك في ملفك الطبي ولوحة التحكم وللمرضى والمراجعين.
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0])}
                    />

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                        {selectedFile ? (
                            <>
                                <LoadingButton
                                    variant="primary"
                                    size="sm"
                                    loading={isUploading}
                                    loadingText="جارٍ الرفع..."
                                    icon={<Check className="w-4 h-4" />}
                                    onClick={handleSaveAvatar}
                                >
                                    تأكيد وحفظ الصورة
                                </LoadingButton>

                                <LoadingButton
                                    variant="outline"
                                    size="sm"
                                    disabled={isUploading}
                                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                                    onClick={handleCancelPreview}
                                >
                                    إلغاء المعاينة
                                </LoadingButton>
                            </>
                        ) : (
                            <>
                                <LoadingButton
                                    variant="primary"
                                    size="sm"
                                    icon={<Upload className="w-4 h-4" />}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    رفع صورة جديدة
                                </LoadingButton>

                                {currentAvatar && (
                                    <LoadingButton
                                        variant="danger-soft"
                                        size="sm"
                                        loading={isDeleting}
                                        loadingText="جارٍ الإزالة..."
                                        icon={<Trash2 className="w-3.5 h-3.5" />}
                                        onClick={handleDeleteAvatar}
                                    >
                                        إزالة الصورة
                                    </LoadingButton>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all',
                    dragActive
                        ? 'border-[#005ab5] bg-blue-50/50'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50'
                )}
            >
                <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1.5" />
                <p className="text-xs font-bold text-gray-700">
                    اسحب وأفلت صورتك هنا، أو انقر للاختيار من جهازك
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                    الحد الأقصى: 3MB (PNG, JPG, WebP)
                </p>
            </div>
        </SurfaceCard>
    );
});

AvatarUpload.displayName = 'AvatarUpload';
