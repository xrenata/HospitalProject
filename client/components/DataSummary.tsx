"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody, Skeleton } from "@heroui/react";

import { Delta, Donut, Legend, Sparkline, type Segment, type Tone } from "@/components/charts";
import { useValueLabel } from "@/components/Chip";
import { useI18n } from "@/contexts/I18nContext";
import { dashboardAPI } from "@/lib/api";

const FALLBACK_TONES: Tone[] = ["primary", "success", "warning", "danger", "default"];

/** Pick a colour from what the value means, so "completed" is green and "cancelled" is not. */
export function toneFor(value: string, index: number): Tone {
  const v = value.toLowerCase();

  if (/^(complete(d)?|resolved|active|available|operational|approved|paid|delivered|normal|low)$/.test(v)) return "success";
  if (/^(urgent|critical|high|no-show|no_show|out-of-order|failed|rejected|emergency)$/.test(v)) return "danger";
  if (/(cancel|closed|inactive|retired|expired|other|unknown)/.test(v)) return "default";
  if (/(pending|maintenance|reserved|medium|in-progress|in_progress|ongoing|warning)/.test(v)) return "warning";
  if (/(scheduled|open|occupied|operation|primary)/.test(v)) return "primary";

  return FALLBACK_TONES[index % FALLBACK_TONES.length];
}

const humanize = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

/** Translation key for the heading of a breakdown, based on the field it groups by. */
const titleKey = (field: string) => {
  if (field === "bloodType") return "blood_type";
  if (/Type$/.test(field)) return "type";

  return field;
};

interface Summary {
  total: number;
  series: number[];
  recent: number;
  previous: number;
  groups: Record<string, { value: string; count: number }[]>;
}

interface DataSummaryProps {
  /** Which collection to summarise, e.g. "appointments" (see /api/dashboard/summary/:entity) */
  entity: string;
  icon?: React.ReactNode;
  /** The page's own loading flag; the summary refreshes whenever the page finishes (re)loading */
  loading?: boolean;
}

export default function DataSummary({ entity, icon, loading = false }: DataSummaryProps) {
  const { t } = useI18n();
  const valueLabel = useValueLabel();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    dashboardAPI
      .getSummary(entity)
      .then((res) => {
        if (!cancelled) {
          setSummary(res.data);
          setFailed(false);
        }
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [entity, loading]);

  if (failed && !summary) return null;

  const ready = summary !== null;
  const withData = Object.entries(summary?.groups ?? {}).filter(([, rows]) => rows.length > 0);
  const firstEmpty = Object.keys(summary?.groups ?? {})[0];
  const visible = (withData.length ? withData : firstEmpty ? [[firstEmpty, []] as [string, never[]]] : []).slice(0, 3);
  const columns = visible.length + 1;
  const hasTrend = (summary?.recent ?? 0) > 0;

  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 ${
        columns === 4 ? "xl:grid-cols-4" : columns === 3 ? "xl:grid-cols-3" : ""
      }`}
    >
      <Card className="w-full">
        <CardBody className="gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground-500">{t("summary.total")}</span>
            {icon && <span className="text-foreground-400">{icon}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-semibold tabular-nums">
              {ready ? summary.total : <Skeleton className="h-8 w-16 rounded-md" />}
            </div>
            {ready && hasTrend && <Delta current={summary.recent} previous={summary.previous} />}
          </div>
          {ready && hasTrend ? (
            <Sparkline className="text-primary" data={summary.series} />
          ) : (
            <p className="text-xs text-foreground-400">{ready ? t("summary.no_recent") : " "}</p>
          )}
        </CardBody>
      </Card>

      {visible.map(([field, rows], index) => {
        const segments: Segment[] = rows.map((r, i) => ({
          label: valueLabel(r.value) !== r.value ? valueLabel(r.value) : humanize(r.value),
          value: r.count,
          tone: toneFor(r.value, i),
        }));
        const total = segments.reduce((a, s) => a + s.value, 0);

        return (
          <Card
            key={field}
            className={`w-full ${columns === 3 && index === 1 ? "sm:col-span-2 xl:col-span-1" : ""}`}
          >
            <CardBody className="gap-3 p-5">
              <span className="text-sm text-foreground-500">{t(`summary.${titleKey(field)}`)}</span>
              {!ready ? (
                <Skeleton className="h-[88px] w-full rounded-xl" />
              ) : total > 0 ? (
                <div className="flex items-center gap-5">
                  <Donut segments={segments} size={88} thickness={10}>
                    <span className="text-lg font-semibold tabular-nums">{total}</span>
                  </Donut>
                  <div className="min-w-0 flex-1">
                    <Legend segments={segments.slice(0, 4)} />
                  </div>
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-foreground-400">{t("summary.no_data")}</p>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
