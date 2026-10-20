import type { Range } from "@/lib/labPanels";

export type VitalKey = "bp" | "heartRate" | "temperature" | "spo2" | "respiratoryRate" | "bmi" | "weight";
export type VitalFlag = "low" | "normal" | "elevated" | "high";

export interface Vital {
  _id: string;
  recordedAt: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
  notes?: string;
  staffId?: { name?: string } | null;
}

/** Normal ranges for adults. */
export const RANGES: Record<string, Range> = {
  heartRate: [60, 100],
  temperature: [36.1, 37.2],
  spo2: [95, 100],
  respiratoryRate: [12, 20],
  bmi: [18.5, 24.9],
};

export const rangeFlag = (value: number | undefined, range: Range): VitalFlag | null =>
  value === undefined ? null : value < range[0] ? "low" : value > range[1] ? "high" : "normal";

/** Blood pressure bands (ACC/AHA): below 90/60 low, up to 120/80 normal, then elevated and high. */
export const bpFlag = (sys?: number, dia?: number): VitalFlag | null => {
  if (sys === undefined || dia === undefined) return null;
  if (sys < 90 || dia < 60) return "low";
  if (sys >= 130 || dia >= 80) return "high";
  if (sys >= 120) return "elevated";

  return "normal";
};

export const bmi = (weightKg?: number, heightCm?: number): number | undefined =>
  weightKg && heightCm ? Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10 : undefined;

export const FLAG_TONE: Record<VitalFlag, string> = {
  normal: "text-success", elevated: "text-warning", low: "text-warning", high: "text-danger",
};
