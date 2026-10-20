"use client";

import React from "react";
import { Chip as HeroChip, type ChipProps } from "@heroui/react";

import { useI18n } from "@/contexts/I18nContext";

/**
 * Drop-in replacement for HeroUI's Chip: soft ("flat") by default, and plain
 * status/role words such as "completed" or "Doctor" are shown in the current language.
 */
export function useValueLabel() {
  const { t } = useI18n();

  return (value: string): string => {
    const key = value.trim().toLowerCase().replace(/[\s_]+/g, "-");
    const translated = t(`values.${key}`);

    return translated === `values.${key}` ? value : translated;
  };
}

export function Chip({ children, variant = "flat", ...rest }: ChipProps) {
  const label = useValueLabel();

  return (
    <HeroChip variant={variant} {...rest}>
      {typeof children === "string" ? label(children) : children}
    </HeroChip>
  );
}

export default Chip;
