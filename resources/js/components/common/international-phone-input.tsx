import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Country {
    code: string;
    dialCode: string;
    nameAr: string;
    placeholder: string;
}

export const COUNTRIES: Country[] = [
    { code: 'SA', dialCode: '+966', nameAr: 'السعودية', placeholder: '50 123 4567' },
    { code: 'EG', dialCode: '+20', nameAr: 'مصر', placeholder: '10 1234 5678' },
    { code: 'AE', dialCode: '+971', nameAr: 'الإمارات', placeholder: '50 123 4567' },
    { code: 'KW', dialCode: '+965', nameAr: 'الكويت', placeholder: '5123 4567' },
    { code: 'QA', dialCode: '+974', nameAr: 'قطر', placeholder: '3312 3456' },
    { code: 'BH', dialCode: '+973', nameAr: 'البحرين', placeholder: '3612 3456' },
    { code: 'OM', dialCode: '+968', nameAr: 'عُمان', placeholder: '9123 4567' },
    { code: 'JO', dialCode: '+962', nameAr: 'الأردن', placeholder: '7 9123 4567' },
    { code: 'IQ', dialCode: '+964', nameAr: 'العراق', placeholder: '770 123 4567' },
    { code: 'US', dialCode: '+1', nameAr: 'الولايات المتحدة', placeholder: '(555) 123-4567' },
    { code: 'GB', dialCode: '+44', nameAr: 'المملكة المتحدة', placeholder: '7123 456789' },
    { code: 'TR', dialCode: '+90', nameAr: 'تركيا', placeholder: '501 234 5678' },
    { code: 'SY', dialCode: '+963', nameAr: 'سوريا', placeholder: '94 123 4567' },
    { code: 'LB', dialCode: '+961', nameAr: 'لبنان', placeholder: '70 123 456' },
    { code: 'SD', dialCode: '+249', nameAr: 'السودان', placeholder: '91 234 5678' },
    { code: 'YE', dialCode: '+967', nameAr: 'اليمن', placeholder: '71 234 5678' },
];

const CountryFlag: React.FC<{ code: string; name: string }> = ({ code, name }) => {
    return (
        <img
            src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
            srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
            width="20"
            height="14"
            alt={name}
            className="w-5 h-3.5 object-cover rounded-[3px] shadow-xs shrink-0 inline-block border border-black/10"
            loading="lazy"
        />
    );
};

interface InternationalPhoneInputProps {
    value: string;
    onChange: (fullPhone: string) => void;
    label?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    defaultCountryCode?: string;
}

export const InternationalPhoneInput: React.FC<InternationalPhoneInputProps> = ({
    value,
    onChange,
    label,
    error,
    required = false,
    disabled = false,
    className,
    defaultCountryCode = 'SA',
}) => {
    const findCountryFromPhone = (phoneStr: string): { country: Country; localNum: string } => {
        if (!phoneStr) {
            const defaultC = COUNTRIES.find((c) => c.code === defaultCountryCode) || COUNTRIES[0];
            return { country: defaultC, localNum: '' };
        }
        const clean = phoneStr.replace(/\s+/g, '');
        for (const c of COUNTRIES) {
            if (clean.startsWith(c.dialCode)) {
                return { country: c, localNum: clean.substring(c.dialCode.length).trim() };
            }
        }
        const defaultC = COUNTRIES.find((c) => c.code === defaultCountryCode) || COUNTRIES[0];
        return { country: defaultC, localNum: clean.replace(/^0+/, '') };
    };

    const initial = findCountryFromPhone(value || '');
    const [selectedCountry, setSelectedCountry] = useState<Country>(initial.country);
    const [localNumber, setLocalNumber] = useState<string>(initial.localNum);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const countryButtonRef = useRef<HTMLButtonElement>(null);
    const dropdownPanelRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{
        top?: number;
        bottom?: number;
        left: number;
    } | null>(null);

    const updateDropdownPosition = () => {
        if (!countryButtonRef.current) return;
        const rect = countryButtonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const menuHeight = 280;
        const openUpwards = spaceBelow < menuHeight && spaceAbove > spaceBelow;

        setDropdownPosition({
            top: openUpwards ? undefined : rect.bottom + 6,
            bottom: openUpwards ? window.innerHeight - rect.top + 6 : undefined,
            left: Math.max(10, Math.min(rect.left, window.innerWidth - 300)),
        });
    };

    useEffect(() => {
        if (!dropdownOpen) return;
        updateDropdownPosition();

        const handleScrollOrResize = () => {
            updateDropdownPosition();
        };

        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);

        return () => {
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [dropdownOpen]);

    // Close on click outside (both button and portaled menu)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                countryButtonRef.current &&
                !countryButtonRef.current.contains(target) &&
                dropdownPanelRef.current &&
                !dropdownPanelRef.current.contains(target)
            ) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    // Focus search on open
    useEffect(() => {
        if (dropdownOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        } else {
            setSearchQuery('');
        }
    }, [dropdownOpen]);

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        setDropdownOpen(false);
        const full = localNumber ? `${country.dialCode}${localNumber.replace(/^0+/, '')}` : '';
        onChange(full);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^\d]/g, '');
        setLocalNumber(raw);
        const cleanLocal = raw.replace(/^0+/, '');
        const full = cleanLocal ? `${selectedCountry.dialCode}${cleanLocal}` : '';
        onChange(full);
    };

    const filteredCountries = COUNTRIES.filter(
        (c) =>
            c.nameAr.includes(searchQuery) ||
            c.dialCode.includes(searchQuery) ||
            c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={cn('w-full text-right space-y-1.5', className)}>
            {label && (
                <label className="block text-xs font-bold text-gray-700 font-['Cairo']">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}

            {/* Input Container - ALWAYS LTR (Left: Flag & Code, Right: Phone Digits) */}
            <div
                dir="ltr"
                className={cn(
                    'relative w-full h-11 bg-white rounded-xl border transition-all flex items-center box-border',
                    error
                        ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-400/20 focus-within:border-red-500'
                        : 'border-gray-200 hover:border-gray-300 focus-within:ring-2 focus-within:ring-[#005ab5]/20 focus-within:border-[#005ab5]',
                    disabled && 'opacity-60 bg-gray-50 pointer-events-none'
                )}
            >
                {/* Country Trigger Button (On the LEFT) */}
                <button
                    ref={countryButtonRef}
                    type="button"
                    disabled={disabled}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="h-full px-3 flex items-center gap-2 border-r border-gray-200 hover:bg-gray-50 transition-colors shrink-0 cursor-pointer rounded-l-xl select-none"
                    title={`الدولة المختارة: ${selectedCountry.nameAr}`}
                >
                    <CountryFlag code={selectedCountry.code} name={selectedCountry.nameAr} />
                    <span className="font-mono text-xs font-bold text-gray-700">
                        {selectedCountry.dialCode}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Local Phone Input (On the RIGHT, typing LTR) */}
                <input
                    type="tel"
                    required={required}
                    disabled={disabled}
                    value={localNumber}
                    onChange={handleNumberChange}
                    placeholder={selectedCountry.placeholder}
                    className="w-full h-full px-3.5 bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-hidden text-left font-mono rounded-r-xl"
                    dir="ltr"
                />

                {/* Country Dropdown Panel via Portal (Never Clipped by Modals) */}
                {dropdownOpen &&
                    dropdownPosition &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        <div
                            ref={dropdownPanelRef}
                            style={{
                                position: 'fixed',
                                top: dropdownPosition.top !== undefined ? `${dropdownPosition.top}px` : undefined,
                                bottom: dropdownPosition.bottom !== undefined ? `${dropdownPosition.bottom}px` : undefined,
                                left: `${dropdownPosition.left}px`,
                                zIndex: 99999,
                            }}
                            className="w-72 bg-white rounded-2xl shadow-2xl shadow-blue-900/20 border border-gray-150 p-2 animate-in fade-in zoom-in-95 duration-100"
                        >
                            {/* Search Input */}
                            <div className="relative mb-2">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="ابحث باسم الدولة أو المفتاح (+966)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-[#005ab5]"
                                    dir="rtl"
                                />
                            </div>

                            {/* Countries List */}
                            <div className="max-h-56 overflow-y-auto space-y-0.5 divide-y divide-gray-50">
                                {filteredCountries.length > 0 ? (
                                    filteredCountries.map((c) => {
                                        const isSelected = selectedCountry.code === c.code;
                                        return (
                                            <button
                                                key={c.code}
                                                type="button"
                                                onClick={() => handleCountrySelect(c)}
                                                className={cn(
                                                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer select-none',
                                                    isSelected
                                                        ? 'bg-blue-50 text-[#005ab5] font-bold'
                                                        : 'hover:bg-gray-50 text-gray-700'
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <CountryFlag code={c.code} name={c.nameAr} />
                                                    <span className="font-['Cairo'] text-xs font-bold text-gray-800">
                                                        {c.nameAr}
                                                    </span>
                                                </div>
                                                <div
                                                    className="flex items-center gap-1.5 font-mono text-xs text-gray-500 font-bold"
                                                    dir="ltr"
                                                >
                                                    <span>{c.dialCode}</span>
                                                    {isSelected && <Check className="w-4 h-4 text-[#005ab5]" />}
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="p-3 text-center text-xs text-gray-400">
                                        لا توجد دولة مطابقة
                                    </div>
                                )}
                            </div>
                        </div>,
                        document.body
                    )}
            </div>

            {error && <p className="text-[11px] text-red-600 font-bold mt-1">{error}</p>}
        </div>
    );
};
