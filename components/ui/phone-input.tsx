"use client";

import * as React from "react";
import { WORLD_COUNTRY_CODES, CountryCode } from "@/lib/validation/country-codes";
import { Input } from "@/components/ui/input";
import { Phone, ChevronDown } from "lucide-react";

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (countryCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  className?: string;
  id?: string;
  name?: string;
}

export function PhoneInput({
  value,
  onChange,
  countryCode = "+91",
  onCountryCodeChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  className = "",
  id,
  name,
}: PhoneInputProps) {
  const [selectedDialCode, setSelectedDialCode] = React.useState(countryCode);

  React.useEffect(() => {
    if (countryCode && countryCode !== selectedDialCode) {
      setSelectedDialCode(countryCode);
    }
  }, [countryCode]);

  const handleDialCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setSelectedDialCode(newCode);
    if (onCountryCodeChange) {
      onCountryCodeChange(newCode);
    }
  };

  const defaultPlaceholder =
    selectedDialCode === "+91" ? "98765 43210" : "Mobile / Phone number";

  // Find active country item for flag display
  const activeCountry =
    WORLD_COUNTRY_CODES.find((c) => c.dial_code === selectedDialCode) ||
    WORLD_COUNTRY_CODES[0];

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      <div className="flex items-center gap-2 w-full">
        {/* Country Code Selector (Compact 25-30% width) */}
        <div className="relative shrink-0 w-[84px] sm:w-[92px]">
          <select
            value={selectedDialCode}
            onChange={handleDialCodeChange}
            disabled={disabled}
            aria-label="Country Dial Code"
            className="w-full h-10 appearance-none rounded-2xl border border-white/10 bg-black/70 pl-2.5 pr-6 text-xs font-medium text-neutral-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:opacity-50 cursor-pointer shadow-inner truncate"
          >
            {WORLD_COUNTRY_CODES.map((country) => (
              <option
                key={`${country.code}-${country.dial_code}`}
                value={country.dial_code}
                className="bg-[#121212] text-neutral-200 py-1"
              >
                {country.flag} {country.dial_code} ({country.name})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-3 h-3.5 w-3.5 text-neutral-400" />
        </div>

        {/* Number Input Field (Takes remaining full width) */}
        <div className="relative flex-1 min-w-0">
          <Input
            id={id}
            name={name}
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || defaultPlaceholder}
            disabled={disabled}
            required={required}
            className={`h-10 text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-neutral-400 w-full px-3 tracking-normal ${
              error ? "border-rose-500/60 focus-visible:ring-rose-400" : ""
            }`}
          />
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 pl-1">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
