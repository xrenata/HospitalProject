"use client";

import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { useI18n } from "@/contexts/I18nContext";

export type Tone = "primary" | "success" | "warning" | "danger" | "default";

export const TONE: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: "bg-primary", text: "text-primary" },
  success: { bg: "bg-success", text: "text-success" },
  warning: { bg: "bg-warning", text: "text-warning" },
  danger: { bg: "bg-danger", text: "text-danger" },
  default: { bg: "bg-default-400", text: "text-default-400" },
};

/** Small trend line with a soft area fill; colour comes from the text colour class. */
export function Sparkline({
  data,
  className = "text-primary",
  fit = false,
}: {
  data: number[];
  className?: string;
  /** Scale to the data's own min/max instead of starting at zero (good for values like lab results) */
  fit?: boolean;
}) {
  const w = 100;
  const h = 40;
  const pad = 3;
  const max = Math.max(...data, 1);
  const min = fit ? Math.min(...data) : Math.min(...data, 0);
  const span = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length - 1 || 1)) * w,
    h - pad - ((v - min) / span) * (h - pad * 2),
  ]);
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(" ");

  return (
    <svg
      aria-hidden
      className={`h-10 w-full ${className}`}
      preserveAspectRatio="none"
      viewBox={`0 0 ${w} ${h}`}
    >
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="currentColor" opacity="0.12" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Change versus the previous period as a small pill. */
export function Delta({ current, previous }: { current: number; previous: number }) {
  const { t } = useI18n();

  if (!current && !previous) return null;

  const up = current >= previous;
  const pct = previous ? Math.round(((current - previous) / previous) * 100) : null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
        up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
      }`}
    >
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {pct === null ? t("summary.new") : `${up ? "+" : ""}${pct}%`}
    </span>
  );
}

const compact = (n: number, locale: string) => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(n));

const formatDay = (iso: string, locale: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" });

/** Daily bars with grid lines, hover tooltip and the latest day highlighted. */
export function BarChart({
  data,
  labels,
  locale = "en",
  unit = "",
}: {
  data: number[];
  labels: string[];
  locale?: string;
  unit?: string;
}) {
  const max = Math.max(...data, 1);
  const top = Math.ceil(max / 2) * 2 || 2;
  const mid = labels[Math.floor(labels.length / 2)];

  return (
    <div>
      <div className="relative h-44 pl-10">
        {[1, 0.5, 0].map((f) => (
          <div
            key={f}
            className="absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `${f * 100}%`, transform: "translateY(50%)" }}
          >
            <span className="w-8 text-right text-[10px] tabular-nums text-foreground-400">
              {compact(top * f, locale)}
            </span>
            <span className="h-px flex-1 bg-divider" />
          </div>
        ))}
        <div className="relative flex h-full items-end gap-1.5">
          {data.map((value, i) => {
            const last = i === data.length - 1;

            return (
              <div
                key={labels[i]}
                className="group relative flex h-full flex-1 items-end"
              >
                <div
                  className={`w-full rounded-t-md transition-colors ${
                    last ? "bg-primary" : "bg-primary/30 group-hover:bg-primary/60"
                  }`}
                  style={{ height: `${Math.max((value / top) * 100, value ? 2 : 0)}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg group-hover:block">
                  <span className="font-semibold tabular-nums">
                    {value}
                    {unit}
                  </span>
                  <span className="ml-1.5 opacity-70">{formatDay(labels[i], locale)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-7 text-[11px] text-foreground-400">
        <span>{formatDay(labels[0], locale)}</span>
        <span>{formatDay(mid, locale)}</span>
        <span>{formatDay(labels[labels.length - 1], locale)}</span>
      </div>
    </div>
  );
}

export interface Segment {
  label: string;
  value: number;
  tone: Tone;
}

/** Ring chart; children render in the centre. */
export function Donut({
  segments,
  size = 150,
  thickness = 14,
  children,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 3 : 0;
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg height={size} style={{ transform: "rotate(-90deg)" }} width={size}>
        <circle
          className="text-default-100"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={r}
          stroke="currentColor"
          strokeWidth={thickness}
        />
        {total > 0 &&
          segments.map((s) => {
            if (!s.value) return null;
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                className={TONE[s.tone].text}
                cx={size / 2}
                cy={size / 2}
                fill="none"
                r={r}
                stroke="currentColor"
                strokeDasharray={`${Math.max(len - gap, 0.5)} ${c}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                strokeWidth={thickness}
              />
            );

            offset += len;

            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

/** One horizontal bar split into proportional segments. */
export function SegmentBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0);

  return (
    <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-default-100">
      {total > 0 &&
        segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              className={`${TONE[s.tone].bg} first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ))}
    </div>
  );
}

export function Legend({ segments }: { segments: Segment[] }) {
  return (
    <ul className="space-y-2">
      {segments.map((s) => (
        <li key={s.label} className="flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${TONE[s.tone].bg}`} />
          <span className="flex-1 text-foreground-500">{s.label}</span>
          <span className="font-medium tabular-nums">{s.value}</span>
        </li>
      ))}
    </ul>
  );
}
