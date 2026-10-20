"use client";

import React from "react";
import { Button } from "@heroui/react";
import { Trash2 } from "lucide-react";

import { Sparkline } from "@/components/charts";
import type { useRecText } from "@/lib/recordText";
import { FLAG_TONE, RANGES, bmi as calcBmi, bpFlag, rangeFlag, type Vital, type VitalFlag } from "@/lib/vitals";

interface Props {
  vitals: Vital[];
  r: ReturnType<typeof useRecText>;
  locale: string;
  add: React.ReactNode;
  onDelete?: (v: Vital) => void;
}

export default function VitalsPanel({ vitals, r, locale, add, onDelete }: Props) {
  if (!vitals.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center text-foreground-400">
        <p className="text-sm">{r("no_vitals")}</p>
        {add}
      </div>
    );
  }

  const latest = vitals[0];
  const series = (pick: (v: Vital) => number | undefined) => [...vitals].reverse().map(pick).filter((x): x is number => x !== undefined);
  const cards: { label: string; value?: string; unit?: string; flag: VitalFlag | null; data: number[] }[] = [
    { label: r("bp"), value: latest.systolic !== undefined ? `${latest.systolic}/${latest.diastolic}` : undefined, unit: r("mmhg"), flag: bpFlag(latest.systolic, latest.diastolic), data: series((v) => v.systolic) },
    { label: r("heart_rate"), value: latest.heartRate?.toString(), unit: r("per_min"), flag: rangeFlag(latest.heartRate, RANGES.heartRate), data: series((v) => v.heartRate) },
    { label: r("temperature"), value: latest.temperature?.toString(), unit: "°C", flag: rangeFlag(latest.temperature, RANGES.temperature), data: series((v) => v.temperature) },
    { label: r("spo2"), value: latest.spo2?.toString(), unit: "%", flag: rangeFlag(latest.spo2, RANGES.spo2), data: series((v) => v.spo2) },
    { label: r("resp_rate"), value: latest.respiratoryRate?.toString(), unit: r("per_min"), flag: rangeFlag(latest.respiratoryRate, RANGES.respiratoryRate), data: series((v) => v.respiratoryRate) },
    { label: r("weight"), value: latest.weight?.toString(), unit: "kg", flag: null, data: series((v) => v.weight) },
  ].filter((c) => c.value !== undefined);
  const bmiNow = calcBmi(vitals.find((v) => v.weight)?.weight, vitals.find((v) => v.height)?.height);
  const when = (iso: string) => new Date(iso).toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const tone = (f: VitalFlag | null) => FLAG_TONE[f ?? "normal"];

  return (
    <div className="space-y-5 px-5 pb-5 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-foreground-500">
          {r("latest_reading")} · {when(latest.recordedAt)}{latest.staffId?.name ? ` · ${latest.staffId.name}` : ""}
        </p>
        {add}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-divider p-3">
            <p className="text-xs text-foreground-500">{c.label}</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${c.flag ? FLAG_TONE[c.flag] : ""}`}>
              {c.value}
              <span className="ml-1 text-xs font-normal text-foreground-500">{c.unit}</span>
            </p>
            <div className="mt-2 h-7">
              {c.data.length > 1 ? <Sparkline fit className={`!h-7 ${c.flag && c.flag !== "normal" ? "text-warning" : "text-primary"}`} data={c.data} /> : null}
            </div>
          </div>
        ))}
        {bmiNow !== undefined && (
          <div className="rounded-xl border border-divider p-3">
            <p className="text-xs text-foreground-500">{r("bmi")}</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${tone(rangeFlag(bmiNow, RANGES.bmi))}`}>{bmiNow}</p>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">{r("history")}</p>
        <div className="overflow-x-auto rounded-xl border border-divider">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-divider bg-default-50 text-xs text-foreground-500">
                {[r("measured_at"), r("bp"), r("heart_rate"), r("temperature"), r("spo2"), r("weight"), r("recorded_by")].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
                {onDelete && <th className="w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {vitals.slice(0, 30).map((v) => (
                <tr key={v._id} className="hover:bg-default-50">
                  <td className="px-3 py-2 text-xs">{when(v.recordedAt)}</td>
                  <td className={`px-3 py-2 tabular-nums ${tone(bpFlag(v.systolic, v.diastolic))}`}>{v.systolic !== undefined ? `${v.systolic}/${v.diastolic}` : "—"}</td>
                  <td className={`px-3 py-2 tabular-nums ${tone(rangeFlag(v.heartRate, RANGES.heartRate))}`}>{v.heartRate ?? "—"}</td>
                  <td className={`px-3 py-2 tabular-nums ${tone(rangeFlag(v.temperature, RANGES.temperature))}`}>{v.temperature ?? "—"}</td>
                  <td className={`px-3 py-2 tabular-nums ${tone(rangeFlag(v.spo2, RANGES.spo2))}`}>{v.spo2 ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{v.weight ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-foreground-500">{v.staffId?.name ?? "—"}</td>
                  {onDelete && (
                    <td className="px-2 text-right">
                      <Button isIconOnly aria-label={r("delete")} size="sm" variant="light" onPress={() => onDelete(v)}><Trash2 size={14} /></Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
