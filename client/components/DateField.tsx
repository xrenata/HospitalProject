"use client";

import React, { useMemo } from "react";
import { DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";

interface DateFieldProps {
  label?: string;
  /** "YYYY-MM-DD" (or an ISO timestamp, the time part is ignored) */
  value?: string;
  onValueChange?: (value: string) => void;
  /** event-shaped callback, so it can replace a native <input type="date"> without touching the handler */
  onChange?: (event: { target: { value: string } }) => void;
  min?: string;
  max?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  description?: string;
  errorMessage?: string;
  className?: string;
  [key: string]: any;
}

const safe = (v?: string) => {
  try {
    return v ? parseDate(v.slice(0, 10)) : null;
  } catch {
    return null;
  }
};

/**
 * The app's one date input: a proper calendar popover (localised) instead of the browser's own date box.
 * Works with plain "YYYY-MM-DD" strings so it drops into existing forms.
 */
export default function DateField({
  label, value, onValueChange, onChange, min, max, isRequired, isDisabled, isReadOnly, isInvalid, description, errorMessage, className,
}: DateFieldProps) {
  const parsed = useMemo(() => safe(value), [value]);

  return (
    <DatePicker
      className={className}
      description={description}
      errorMessage={errorMessage}
      isDisabled={isDisabled}
      isInvalid={isInvalid || !!errorMessage}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      label={label}
      labelPlacement="outside"
      maxValue={safe(max) as any}
      minValue={safe(min) as any}
      showMonthAndYearPickers
      value={parsed as any}
      variant="bordered"
      onChange={(d: any) => {
        const next = d ? d.toString() : "";

        onValueChange?.(next);
        onChange?.({ target: { value: next } });
      }}
    />
  );
}
