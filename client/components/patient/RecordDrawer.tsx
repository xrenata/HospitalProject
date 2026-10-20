"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete, AutocompleteItem, Button, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { AlertTriangle, Check } from "lucide-react";
import toast from "react-hot-toast";

import DateField from "@/components/DateField";
import TimeField from "@/components/TimeField";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { medicationsAPI, recordsAPI, staffAPI } from "@/lib/api";
import api from "@/lib/api";
import { COMMON_TESTS, PANELS, flagOf, labLabel, rangeFor, rangeText, type Panel } from "@/lib/labPanels";
import { useRecText } from "@/lib/recordText";
import { RANGES, bmi as calcBmi, bpFlag, rangeFlag, type VitalFlag } from "@/lib/vitals";

export type DrawerKind = "appointments" | "visits" | "treatments" | "prescriptions" | "tests" | "lab" | "insurance" | "vitals";

export interface DrawerPatient { id: string; name: string; gender?: string; allergies?: string }

interface Props {
  isOpen: boolean;
  kind: DrawerKind;
  patient: DrawerPatient;
  onClose: () => void;
  onSaved: () => void;
}

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const SLOTS = Array.from({ length: 20 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

const FLAG_CLASS: Record<string, string> = {
  normal: "text-success", elevated: "text-warning", low: "text-warning", high: "text-danger",
};

const field = { variant: "bordered", labelPlacement: "outside", placeholder: " " } as const;

function Flag({ flag, r }: { flag: VitalFlag | "low" | "high" | "normal" | null; r: (k: string) => string }) {
  if (!flag) return null;

  return <span className={`text-xs font-medium ${FLAG_CLASS[flag]}`}>{r(flag)}</span>;
}

export default function RecordDrawer({ isOpen, kind, patient, onClose, onSaved }: Props) {
  const r = useRecText();
  const { language } = useI18n();
  const { user } = useAuth();
  const me = user?.id !== undefined ? String(user.id) : "";

  const [form, setForm] = useState<Record<string, any>>({});
  const [staff, setStaff] = useState<{ _id: string; name: string; role?: string }[]>([]);
  const [meds, setMeds] = useState<{ _id: string; name: string; stockQuantity?: number }[]>([]);
  const [booked, setBooked] = useState<string[]>([]);
  const [panels, setPanels] = useState<string[]>(["cbc"]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, value: any) => { setForm((f) => ({ ...f, [key]: value })); setError(null); };

  const reset = () => {
    setValues({});
    setError(null);
    setBooked([]);
    setForm({
      staffId: me, date: today(), time: kind === "appointments" ? "" : nowTime(), testDate: today(), testTime: nowTime(),
      startDate: today(), endDate: "", validFrom: today(), recordedAt: today(), visitType: "consultation", priority: "normal",
      testType: "blood", coverageType: "basic", status: "", sampleType: "blood",
    });
  };

  useEffect(() => { if (isOpen) reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [isOpen, kind]);

  useEffect(() => {
    if (!isOpen) return;
    staffAPI.getAll({ status: "active", limit: 1000 }).then((res) => setStaff(res.data?.staff || [])).catch(() => setStaff([]));
    if (kind === "prescriptions") medicationsAPI.getAll({ limit: 500 }).then((res) => setMeds(res.data?.medications || [])).catch(() => setMeds([]));
  }, [isOpen, kind]);

  // greyed-out slots for the chosen doctor and day
  useEffect(() => {
    if (kind !== "appointments" || !form.staffId || !form.date) return;
    api.get("/patient-records/availability", { params: { staffId: form.staffId, date: form.date } })
      .then((res) => setBooked(res.data?.booked || [])).catch(() => setBooked([]));
  }, [kind, form.staffId, form.date]);

  const staffOptions = useMemo(() => {
    const list = staff.length ? staff : me ? [{ _id: me, name: user?.username || "…", role: "" }] : [];

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [staff, me, user]);

  const title = kind === "lab" ? r("type_lab") : r(`type_${kind}`);
  const gender = patient.gender;

  // ---- lab panels ---------------------------------------------------------------------
  const activePanels: Panel[] = PANELS.filter((p) => panels.includes(p.key));
  const labRows = activePanels.flatMap((p) => p.analytes.map((a) => ({ a, panel: p })));
  const labFilled = labRows.filter(({ a }) => values[a.en] !== undefined && values[a.en] !== "" && !Number.isNaN(Number(values[a.en])));
  const labOut = labFilled.filter(({ a }) => flagOf(Number(values[a.en]), rangeFor(a, gender)) !== "normal").length;

  // ---- vitals -------------------------------------------------------------------------
  const n = (k: string) => (form[k] === "" || form[k] === undefined ? undefined : Number(form[k]));
  const bmiValue = calcBmi(n("weight"), n("height"));

  // ---- prescriptions ------------------------------------------------------------------
  const chosenMed = meds.find((m) => m.name.toLowerCase() === String(form.medicationName || "").toLowerCase());
  const allergyHit = useMemo(() => {
    const name = String(form.medicationName || "").toLowerCase();
    if (!name || !patient.allergies) return null;
    const hit = patient.allergies.split(/[,;\n]/).map((a) => a.trim()).find((a) => a.length > 2 && (name.includes(a.toLowerCase()) || a.toLowerCase().includes(name)));

    return hit || null;
  }, [form.medicationName, patient.allergies]);

  const REQUIRED: Partial<Record<DrawerKind, string[]>> = {
    appointments: ["time", "reason"], visits: ["reason"], treatments: ["description"], prescriptions: ["medicationName", "dosage", "frequency", "duration"],
    tests: ["testName"], insurance: ["insuranceCompany", "policyNumber", "startDate", "endDate"],
  };

  const submit = async (another: boolean) => {
    if ((REQUIRED[kind] || []).some((k) => !String(form[k] ?? "").trim())) { setError(r("required")); return; }
    if (kind === "lab" && !labFilled.length) { setError(r("fill_hint")); return; }
    setSaving(true);
    setError(null);
    try {
      if (kind === "lab") {
        await recordsAPI.addLabPanel(patient.id, {
          staffId: form.staffId, testDate: form.testDate, testTime: form.testTime, sampleType: form.sampleType, priority: form.priority, notes: form.notes,
          panel: activePanels.map((p) => p.en).join(", "),
          results: labFilled.map(({ a }) => ({ testName: a.en, resultValue: values[a.en], unit: a.unit, normalRange: rangeText(rangeFor(a, gender)) })),
        });
        toast.success(r("result_added", { n: labFilled.length }));
      } else {
        const body: Record<string, any> = { ...form };
        Object.keys(body).forEach((k) => { if (body[k] === "") delete body[k]; });
        if (kind === "vitals") body.recordedAt = `${form.recordedAt}T${form.time || nowTime()}:00`;
        if (kind === "tests" && form.resultValue === undefined) delete body.resultValue;
        await recordsAPI.add(patient.id, kind, body);
        toast.success(r("saved"));
      }
      onSaved();
      if (another) reset(); else onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || r("required"));
    } finally { setSaving(false); }
  };

  const staffField = (
    <Autocomplete
      {...field}
      allowsCustomValue={false}
      defaultItems={staffOptions}
      description={r("staff_hint")}
      label={r("staff")}
      selectedKey={form.staffId || null}
      onSelectionChange={(k) => set("staffId", k ? String(k) : "")}
    >
      {(s) => <AutocompleteItem key={s._id} textValue={s.name}>{s.name}{s.role ? <span className="ml-2 text-xs text-foreground-400">{s.role}</span> : null}</AutocompleteItem>}
    </Autocomplete>
  );

  const picker = (label: string, key: string, options: [string, string][]) => (
    <Select {...field} label={label} selectedKeys={form[key] ? [form[key]] : []} onSelectionChange={(k) => set(key, Array.from(k)[0] ?? "")}>
      {options.map(([v, l]) => <SelectItem key={v}>{l}</SelectItem>)}
    </Select>
  );

  const chips = (key: string, list: string[]) => (
    <div className="flex flex-wrap gap-1.5">
      {list.map((x) => (
        <button
          key={x}
          className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${form[key] === x ? "border-primary bg-primary/10 text-primary" : "border-divider text-foreground-600 hover:bg-content2"}`}
          type="button"
          onClick={() => set(key, form[key] === x ? "" : x)}
        >
          {x}
        </button>
      ))}
    </div>
  );

  const num = (key: string, label: string, props: Record<string, any> = {}) => (
    <Input {...field} endContent={props.unit ? <span className="text-xs text-foreground-400">{props.unit}</span> : undefined}
      inputMode="decimal" label={label} type="number" value={form[key] ?? ""} onValueChange={(v) => set(key, v)} />
  );

  const text = (key: string, label: string, extra: Record<string, any> = {}) => (
    <Input {...field} label={label} value={form[key] ?? ""} onValueChange={(v) => set(key, v)} {...extra} />
  );

  const notes = <Textarea {...field} label={r("notes")} minRows={2} value={form.notes ?? ""} onValueChange={(v) => set("notes", v)} />;

  const body = () => {
    switch (kind) {
      case "appointments":
        return (
          <>
            {staffField}
            <DateField isRequired label={r("date")} min={today()} value={form.date} onValueChange={(v) => { set("date", v); set("time", ""); }} />
            <div>
              <p className="mb-2 text-sm">{r("pick_time")} <span className="text-danger">*</span></p>
              <div className="grid grid-cols-5 gap-1.5">
                {SLOTS.map((s) => {
                  const taken = booked.includes(s);
                  const past = form.date === today() && s <= nowTime();

                  return (
                    <button
                      key={s}
                      className={`rounded-lg border py-1.5 text-xs tabular-nums transition-colors ${form.time === s ? "border-primary bg-primary text-primary-foreground" : taken || past ? "cursor-not-allowed border-divider text-foreground-300 line-through" : "border-divider hover:bg-content2"}`}
                      disabled={taken || past}
                      title={taken ? r("slot_taken") : undefined}
                      type="button"
                      onClick={() => set("time", s)}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-foreground-500">{r("slot_hint")}</p>
            </div>
            <div className="space-y-2">
              {text("reason", r("reason"), { isRequired: true })}
              {chips("reason", r.list("reasons"))}
            </div>
            {notes}
          </>
        );
      case "visits":
        return (
          <>
            {staffField}
            <div className="grid grid-cols-2 gap-3">
              <DateField label={r("date")} value={form.date} onValueChange={(v) => set("date", v)} />
              <TimeField label={r("time")} value={form.time} onValueChange={(v) => set("time", v)} />
            </div>
            {picker(r("visit_type"), "visitType", [["consultation", r("vt_consultation")], ["follow_up", r("vt_follow_up")], ["emergency", r("vt_emergency")], ["routine_check", r("vt_routine_check")]])}
            <div className="space-y-2">
              {text("reason", r("reason"), { isRequired: true })}
              {chips("reason", r.list("reasons"))}
            </div>
            {text("diagnosis", r("diagnosis"))}
            {text("treatment", r("treatment_plan"))}
            <div className="grid grid-cols-2 gap-3">
              <DateField label={r("next_visit")} min={today()} value={form.nextVisit} onValueChange={(v) => set("nextVisit", v)} />
              {num("cost", r("cost"))}
            </div>
            {notes}
          </>
        );
      case "treatments":
        return (
          <>
            {staffField}
            <div className="space-y-2">
              {text("treatmentType", r("treatment_type"))}
              {chips("treatmentType", r.list("treatment_types"))}
            </div>
            {text("diagnosis", r("diagnosis"))}
            <Textarea {...field} isRequired label={r("description")} minRows={2} value={form.description ?? ""} onValueChange={(v) => set("description", v)} />
            {text("medication", r("medication"))}
            <div className="grid grid-cols-2 gap-3">
              <DateField label={r("start_date")} value={form.startDate} onValueChange={(v) => set("startDate", v)} />
              <DateField label={r("end_date")} min={form.startDate} value={form.endDate} onValueChange={(v) => set("endDate", v)} />
            </div>
            {num("cost", r("cost"))}
            {notes}
          </>
        );
      case "prescriptions":
        return (
          <>
            {staffField}
            <Autocomplete
              {...field}
              allowsCustomValue
              defaultItems={meds}
              inputValue={form.medicationName ?? ""}
              isRequired
              label={r("medication")}
              placeholder={r("search_medication")}
              onInputChange={(v) => { set("medicationName", v); set("medicationId", meds.find((m) => m.name === v)?._id ?? ""); }}
              onSelectionChange={(k) => { const m = meds.find((x) => x._id === k); if (m) { set("medicationName", m.name); set("medicationId", m._id); } }}
            >
              {(m) => <AutocompleteItem key={m._id} textValue={m.name}>{m.name}<span className="ml-2 text-xs text-foreground-400">{r("in_stock", { n: m.stockQuantity ?? 0 })}</span></AutocompleteItem>}
            </Autocomplete>
            {chosenMed && (
              <p className={`-mt-2 text-xs ${(chosenMed.stockQuantity ?? 0) > 0 ? "text-foreground-500" : "text-danger"}`}>
                {(chosenMed.stockQuantity ?? 0) > 0 ? r("in_stock", { n: chosenMed.stockQuantity ?? 0 }) : r("out_of_stock")}
              </p>
            )}
            {allergyHit && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 shrink-0 text-warning" size={16} />
                {r("allergy_warning", { a: allergyHit })}
              </div>
            )}
            {text("dosage", r("dosage"), { isRequired: true, placeholder: "500 mg" })}
            <div className="space-y-2">
              {text("frequency", r("frequency"), { isRequired: true })}
              {chips("frequency", r.list("frequencies"))}
            </div>
            <div className="space-y-2">
              {text("duration", r("duration"), { isRequired: true })}
              {chips("duration", r.list("durations"))}
            </div>
            {num("quantity", r("quantity"))}
            {text("instructions", r("instructions"))}
          </>
        );
      case "tests":
        return (
          <>
            {staffField}
            <div className="space-y-2">
              {text("testName", r("test_name"), { isRequired: true })}
              {chips("testName", COMMON_TESTS)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {picker(r("test_kind"), "testType", [["blood", r("kind_blood")], ["urine", r("kind_urine")], ["imaging", r("kind_imaging")], ["ecg", r("kind_ecg")], ["other", r("kind_other")]])}
              {picker(r("priority"), "priority", [["low", r("pr_low")], ["normal", r("pr_normal")], ["high", r("pr_high")], ["urgent", r("pr_urgent")]])}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DateField label={r("date")} value={form.testDate} onValueChange={(v) => set("testDate", v)} />
              <TimeField label={r("time")} value={form.testTime} onValueChange={(v) => set("testTime", v)} />
            </div>
            <p className="text-sm font-medium">{r("result_optional")}</p>
            <div className="grid grid-cols-3 gap-3">
              {text("resultValue", r("result"))}
              {text("unit", r("unit"))}
              {text("normalRange", r("reference"), { placeholder: "10 - 20" })}
            </div>
            {notes}
          </>
        );
      case "lab":
        return (
          <>
            {staffField}
            <div className="grid grid-cols-2 gap-3">
              <DateField label={r("date_taken")} value={form.testDate} onValueChange={(v) => set("testDate", v)} />
              <TimeField label={r("draw_time")} value={form.testTime} onValueChange={(v) => set("testTime", v)} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{r("choose_panels")}</p>
              <div className="flex flex-wrap gap-1.5">
                {PANELS.map((p) => {
                  const on = panels.includes(p.key);

                  return (
                    <button
                      key={p.key}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-divider text-foreground-600 hover:bg-content2"}`}
                      type="button"
                      onClick={() => setPanels((l) => (on ? l.filter((x) => x !== p.key) : [...l, p.key]))}
                    >
                      {on && <Check size={12} />}
                      {language === "tr" ? p.tr : p.en}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-foreground-500">
                {r("ranges_for", { sex: /^f|kad/i.test(gender ?? "") ? r("sex_female") : r("sex_male") })} · {r("fill_hint")}
              </p>
            </div>
            {activePanels.map((p) => (
              <div key={p.key} className="overflow-hidden rounded-xl border border-divider">
                <p className="bg-content2 px-3 py-2 text-xs font-medium">{language === "tr" ? p.tr : p.en}</p>
                <ul className="divide-y divide-divider">
                  {p.analytes.map((a) => {
                    const range = rangeFor(a, gender);
                    const raw = values[a.en] ?? "";
                    const ok = raw !== "" && !Number.isNaN(Number(raw));
                    const flag = ok ? flagOf(Number(raw), range) : null;

                    return (
                      <li key={a.en} className="grid grid-cols-[1fr_6.5rem_5rem] items-center gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm">{labLabel(a.en, language)}</p>
                          <p className="text-[11px] tabular-nums text-foreground-400">{rangeText(range)} {a.unit}</p>
                        </div>
                        <Input
                          aria-label={a.en}
                          inputMode="decimal"
                          size="sm"
                          variant="bordered"
                          value={raw}
                          onValueChange={(v) => setValues((x) => ({ ...x, [a.en]: v.replace(",", ".") }))}
                        />
                        <Flag flag={flag} r={r} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {notes}
            <p className="text-xs text-foreground-500">
              {r("entered", { n: labFilled.length })}{labOut ? ` · ${r("out_of_range", { n: labOut })}` : ""}
            </p>
          </>
        );
      case "insurance":
        return (
          <>
            {text("insuranceCompany", r("company"), { isRequired: true })}
            {text("policyNumber", r("policy"), { isRequired: true })}
            {picker(r("coverage_type"), "coverageType", [["basic", r("ct_basic")], ["premium", r("ct_premium")], ["comprehensive", r("ct_comprehensive")]])}
            <div className="grid grid-cols-2 gap-3">
              {num("coverageAmount", r("coverage_amount"))}
              {num("deductible", r("deductible"))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DateField isRequired label={r("valid_from")} value={form.startDate} onValueChange={(v) => set("startDate", v)} />
              <DateField isRequired label={r("valid_until")} min={form.startDate} value={form.endDate} onValueChange={(v) => set("endDate", v)} />
            </div>
            {notes}
          </>
        );
      case "vitals": {
        const bp = bpFlag(n("systolic"), n("diastolic"));

        return (
          <>
            {staffField}
            <div className="grid grid-cols-2 gap-3">
              <DateField label={r("measured_at")} value={form.recordedAt} onValueChange={(v) => set("recordedAt", v)} />
              <TimeField label={r("time")} value={form.time} onValueChange={(v) => set("time", v)} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between"><p className="text-sm">{r("bp")}</p><Flag flag={bp} r={r} /></div>
              <div className="grid grid-cols-2 gap-3">
                {num("systolic", r("systolic"), { unit: r("mmhg") })}
                {num("diastolic", r("diastolic"), { unit: r("mmhg") })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-5">
              <div>{num("heartRate", r("heart_rate"), { unit: r("per_min") })}<div className="mt-1 h-4"><Flag flag={rangeFlag(n("heartRate"), RANGES.heartRate)} r={r} /></div></div>
              <div>{num("temperature", r("temperature"), { unit: "°C" })}<div className="mt-1 h-4"><Flag flag={rangeFlag(n("temperature"), RANGES.temperature)} r={r} /></div></div>
              <div>{num("spo2", r("spo2"), { unit: "%" })}<div className="mt-1 h-4"><Flag flag={rangeFlag(n("spo2"), RANGES.spo2)} r={r} /></div></div>
              <div>{num("respiratoryRate", r("resp_rate"), { unit: r("per_min") })}<div className="mt-1 h-4"><Flag flag={rangeFlag(n("respiratoryRate"), RANGES.respiratoryRate)} r={r} /></div></div>
              {num("weight", r("weight"), { unit: "kg" })}
              {num("height", r("height"), { unit: "cm" })}
            </div>
            {bmiValue !== undefined && (
              <p className="text-sm">{r("bmi")}: <span className="font-semibold tabular-nums">{bmiValue}</span> <Flag flag={rangeFlag(bmiValue, RANGES.bmi)} r={r} /></p>
            )}
            {notes}
          </>
        );
      }
    }
  };

  return (
    <Drawer hideCloseButton={false} isOpen={isOpen} placement="right" size="lg" onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader className="flex flex-col gap-0.5 border-b border-divider">
              <span className="text-base font-semibold">{r("new_title", { type: title.toLowerCase() })}</span>
              <span className="text-xs font-normal text-foreground-500">{r("for_patient", { name: patient.name })}</span>
            </DrawerHeader>
            <DrawerBody className="gap-5 py-5 [&>*]:shrink-0">
              {body()}
              {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            </DrawerBody>
            <DrawerFooter className="border-t border-divider">
              <Button variant="light" onPress={onClose}>{r("cancel")}</Button>
              <Button isLoading={saving} variant="flat" onPress={() => submit(true)}>{r("save_another")}</Button>
              <Button color="primary" isLoading={saving} onPress={() => submit(false)}>{r("save")}</Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
