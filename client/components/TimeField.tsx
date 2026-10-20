"use client";

import React from "react";

import TimeWheelPicker from "@/components/TimeWheelPicker";

interface TimeFieldProps {
  label?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  /** event-shaped callback, so it can replace a native <input type="time"> without touching the handler */
  onChange?: (event: { target: { value: string } }) => void;
  min?: string;
  max?: string;
  isRequired?: boolean;
  description?: string;
  errorMessage?: string;
  className?: string;
  [key: string]: any;
}

/** The app's one time input: the wheel picker, with the same string-based API as DateField. */
export default function TimeField({ label, value, onValueChange, onChange, min, max, isRequired, description, errorMessage, className }: TimeFieldProps) {
  return (
    <TimeWheelPicker
      className={className}
      description={description}
      errorMessage={errorMessage}
      isRequired={isRequired}
      label={label}
      max={max}
      min={min}
      value={value}
      onChange={(next: string) => {
        onValueChange?.(next);
        onChange?.({ target: { value: next } });
      }}
    />
  );
}
