/** Ready-made lab panels with typical adult reference ranges (they stay editable when entering results). */

export type Range = [number, number];

export interface Analyte {
  /** English name, stored with the result so trends line up between visits */
  en: string;
  tr: string;
  unit: string;
  range: Range | { male: Range; female: Range };
  decimals?: number;
}

export interface Panel {
  key: string;
  en: string;
  tr: string;
  analytes: Analyte[];
}

export const PANELS: Panel[] = [
  {
    key: "cbc", en: "Complete blood count", tr: "Tam kan sayımı (hemogram)",
    analytes: [
      { en: "Hemoglobin", tr: "Hemoglobin", unit: "g/dL", range: { male: [13.5, 17.5], female: [12, 15.5] }, decimals: 1 },
      { en: "Hematocrit", tr: "Hematokrit", unit: "%", range: { male: [41, 53], female: [36, 46] }, decimals: 1 },
      { en: "Red blood cells", tr: "Eritrosit", unit: "10⁶/µL", range: { male: [4.5, 5.9], female: [4.1, 5.1] }, decimals: 2 },
      { en: "White blood cells", tr: "Lökosit", unit: "10³/µL", range: [4, 11], decimals: 1 },
      { en: "Platelets", tr: "Trombosit", unit: "10³/µL", range: [150, 450] },
      { en: "MCV", tr: "MCV", unit: "fL", range: [80, 100], decimals: 1 },
      { en: "MCH", tr: "MCH", unit: "pg", range: [27, 33], decimals: 1 },
      { en: "MCHC", tr: "MCHC", unit: "g/dL", range: [32, 36], decimals: 1 },
    ],
  },
  {
    key: "lipid", en: "Lipid profile", tr: "Lipid profili",
    analytes: [
      { en: "Total cholesterol", tr: "Total kolesterol", unit: "mg/dL", range: [125, 200] },
      { en: "LDL cholesterol", tr: "LDL kolesterol", unit: "mg/dL", range: [0, 130] },
      { en: "HDL cholesterol", tr: "HDL kolesterol", unit: "mg/dL", range: { male: [40, 60], female: [50, 70] } },
      { en: "Triglycerides", tr: "Trigliserit", unit: "mg/dL", range: [0, 150] },
    ],
  },
  {
    key: "metabolic", en: "Glucose & electrolytes", tr: "Şeker ve elektrolitler",
    analytes: [
      { en: "Glucose (fasting)", tr: "Açlık kan şekeri", unit: "mg/dL", range: [70, 100] },
      { en: "HbA1c", tr: "HbA1c", unit: "%", range: [4, 5.6], decimals: 1 },
      { en: "Sodium", tr: "Sodyum", unit: "mmol/L", range: [135, 145] },
      { en: "Potassium", tr: "Potasyum", unit: "mmol/L", range: [3.5, 5.1], decimals: 1 },
      { en: "Calcium", tr: "Kalsiyum", unit: "mg/dL", range: [8.5, 10.5], decimals: 1 },
    ],
  },
  {
    key: "kidney", en: "Kidney function", tr: "Böbrek fonksiyonu",
    analytes: [
      { en: "Creatinine", tr: "Kreatinin", unit: "mg/dL", range: { male: [0.7, 1.3], female: [0.6, 1.1] }, decimals: 2 },
      { en: "BUN", tr: "Üre azotu (BUN)", unit: "mg/dL", range: [7, 20] },
      { en: "eGFR", tr: "eGFR", unit: "mL/min", range: [90, 120] },
      { en: "Uric acid", tr: "Ürik asit", unit: "mg/dL", range: { male: [3.4, 7], female: [2.4, 6] }, decimals: 1 },
    ],
  },
  {
    key: "liver", en: "Liver function", tr: "Karaciğer fonksiyonu",
    analytes: [
      { en: "ALT", tr: "ALT", unit: "U/L", range: [7, 56] },
      { en: "AST", tr: "AST", unit: "U/L", range: [10, 40] },
      { en: "ALP", tr: "ALP", unit: "U/L", range: [44, 147] },
      { en: "GGT", tr: "GGT", unit: "U/L", range: [8, 61] },
      { en: "Total bilirubin", tr: "Total bilirubin", unit: "mg/dL", range: [0.1, 1.2], decimals: 1 },
      { en: "Albumin", tr: "Albümin", unit: "g/dL", range: [3.5, 5], decimals: 1 },
    ],
  },
  {
    key: "thyroid", en: "Thyroid", tr: "Tiroid",
    analytes: [
      { en: "TSH", tr: "TSH", unit: "µIU/mL", range: [0.4, 4], decimals: 2 },
      { en: "Free T4", tr: "Serbest T4", unit: "ng/dL", range: [0.8, 1.8], decimals: 2 },
      { en: "Free T3", tr: "Serbest T3", unit: "pg/mL", range: [2.3, 4.2], decimals: 1 },
    ],
  },
  {
    key: "vitamins", en: "Iron & vitamins", tr: "Demir ve vitaminler",
    analytes: [
      { en: "Ferritin", tr: "Ferritin", unit: "ng/mL", range: { male: [24, 336], female: [11, 307] } },
      { en: "Iron", tr: "Demir", unit: "µg/dL", range: [60, 170] },
      { en: "Vitamin B12", tr: "Vitamin B12", unit: "pg/mL", range: [200, 900] },
      { en: "Vitamin D", tr: "Vitamin D", unit: "ng/mL", range: [30, 100] },
    ],
  },
  {
    key: "inflammation", en: "Inflammation & clotting", tr: "Enflamasyon ve pıhtılaşma",
    analytes: [
      { en: "CRP", tr: "CRP", unit: "mg/L", range: [0, 5], decimals: 1 },
      { en: "ESR", tr: "Sedimentasyon", unit: "mm/h", range: { male: [0, 15], female: [0, 20] } },
      { en: "INR", tr: "INR", unit: "", range: [0.8, 1.2], decimals: 2 },
    ],
  },
];

export const rangeFor = (a: Analyte, gender?: string): Range => {
  if (Array.isArray(a.range)) return a.range;

  return /^f/i.test(gender ?? "") || /kad/i.test(gender ?? "") ? a.range.female : a.range.male;
};

export const rangeText = (r: Range) => `${r[0]} - ${r[1]}`;

export type Flag = "low" | "normal" | "high";
export const flagOf = (value: number, range: Range | null): Flag =>
  !range ? "normal" : value < range[0] ? "low" : value > range[1] ? "high" : "normal";

const ALL = PANELS.flatMap((p) => p.analytes);

/** Analyte name in the interface language (stored names are English). */
export const labLabel = (name: string, language: string): string => {
  if (language !== "tr") return name;

  return ALL.find((a) => a.en.toLowerCase() === name.toLowerCase())?.tr ?? name;
};

export const COMMON_TESTS = [
  "Complete blood count", "Urinalysis", "Chest X-ray", "ECG", "Echocardiogram", "Abdominal ultrasound", "MRI", "CT scan",
  "COVID-19 PCR", "Stool analysis", "Blood culture", "Pulmonary function test", "Glucose tolerance", "Hormone panel",
];
