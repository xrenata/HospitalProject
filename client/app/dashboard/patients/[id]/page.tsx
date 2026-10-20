"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, Button, Card, CardBody, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Skeleton, Tab, Tabs, Tooltip } from "@heroui/react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Droplet,
  FlaskConical,
  Lock,
  HeartPulse,
  Mail,
  Phone,
  Pill,
  Plus,
  Trash2,
  Activity,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { Chip } from "@/components/Chip";
import { useConfirm } from "@/components/ConfirmDialog";
import RecordDrawer, { type DrawerKind } from "@/components/patient/RecordDrawer";
import VitalsPanel from "@/components/patient/VitalsPanel";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { useRecText } from "@/lib/recordText";
import type { Vital } from "@/lib/vitals";
import { Sparkline } from "@/components/charts";
import { useI18n } from "@/contexts/I18nContext";
import { patientsAPI, recordsAPI, type RecordType } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type Rec = Record<string, any>;
type Tone = "success" | "primary" | "warning" | "danger" | "default";

interface Overview {
  patient: Rec;
  appointments: Rec[];
  treatments: Rec[];
  visits: Rec[];
  prescriptions: Rec[];
  tests: Rec[];
  insurance: Rec[];
  vitals?: Vital[];
  /** sections this person's role may not see (they come back empty) */
  restricted?: string[];
  counts: Record<"appointments" | "treatments" | "visits" | "prescriptions" | "tests", number>;
}

const STATUS_TONE: Record<string, Tone> = {
  completed: "success", resolved: "success", active: "success",
  scheduled: "primary", ongoing: "primary", in_progress: "primary",
  pending: "warning", urgent: "danger", high: "danger",
  cancelled: "default", no_show: "default", expired: "default", suspended: "warning",
};
const tone = (s?: string): Tone => STATUS_TONE[(s ?? "").toLowerCase().replace(/-/g, "_")] ?? "default";

const pick = (rec: Rec | undefined, ...keys: string[]) => {
  for (const key of keys) {
    const v = rec?.[key];

    if (v !== undefined && v !== null && v !== "") return v;
  }

  return undefined;
};

const ageOf = (iso?: string) => {
  if (!iso) return null;
  const b = new Date(iso);
  const n = new Date();
  let y = n.getFullYear() - b.getFullYear();

  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) y--;

  return y;
};

const dayKey = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

/** "12 - 16" -> [12, 16]; "<200" -> [0, 200] */
const parseRange = (text?: string): [number, number] | null => {
  const nums = (text ?? "").match(/-?\d+(?:[.,]\d+)?/g)?.map((n) => parseFloat(n.replace(",", ".")));

  if (!nums?.length) return null;
  if (nums.length === 1) return [0, nums[0]];

  return [nums[0], nums[1]];
};

interface Analyte {
  name: string;
  unit: string;
  range: [number, number] | null;
  rangeText: string;
  values: { day: string; value: number }[]; // oldest -> newest
}

type Flag = "low" | "normal" | "high";
const flagOf = (value: number, range: [number, number] | null): Flag =>
  !range ? "normal" : value < range[0] ? "low" : value > range[1] ? "high" : "normal";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-foreground-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
    </div>
  );
}

function SideCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="w-full">
      <CardBody className="gap-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          {icon && <span className="text-foreground-400">{icon}</span>}
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

interface Column {
  label: string;
  cell: (row: Rec) => React.ReactNode;
}

function Records({ rows, columns, empty, locked = false, add, actions }: { rows: Rec[]; columns: Column[]; empty: string; locked?: boolean; add?: React.ReactNode; actions?: (row: Rec) => React.ReactNode }) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center text-foreground-400">
        {locked && <Lock size={18} />}
        <p className="text-sm">{empty}</p>
        {!locked && add}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {add && <div className="flex justify-end px-5 pb-1 pt-3">{add}</div>}
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead>
          <tr className="border-b border-divider text-xs text-foreground-500">
            {columns.map((c) => (
              <th key={c.label} className="px-5 py-2.5 font-medium">{c.label}</th>
            ))}
            {actions && <th className="w-24 px-5 py-2.5" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {rows.map((row, i) => (
            <tr key={row._id ?? i} className="hover:bg-default-50">
              {columns.map((c) => (
                <td key={c.label} className="px-5 py-3 align-top">{c.cell(row)}</td>
              ))}
              {actions && <td className="px-5 py-2 text-right align-top">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Reference range bar: the shaded middle is "normal", the dot is this result. */
function RangeBar({ value, range, flag }: { value: number; range: [number, number]; flag: Flag }) {
  const span = range[1] - range[0] || 1;
  const min = range[0] - span * 0.6;
  const max = range[1] + span * 0.6;
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  const color = flag === "normal" ? "bg-success" : flag === "high" ? "bg-danger" : "bg-warning";

  return (
    <div className="relative h-5 w-full min-w-[9rem]">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-default-100" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-success/25"
        style={{ left: `${pos(range[0])}%`, width: `${pos(range[1]) - pos(range[0])}%` }}
      />
      <div
        className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow ${color}`}
        style={{ left: `${pos(value)}%` }}
      />
    </div>
  );
}

export default function PatientDetailPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [drawDay, setDrawDay] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerKind | null>(null);
  const [tab, setTab] = useState("overview");
  const r = useRecText();
  const { can } = useAuth();
  const confirm = useConfirm();

  const load = (quiet = false) => {
    if (!quiet) setLoading(true);

    return patientsAPI
      .getOverview(id)
      .then((res) => setData(res.data))
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const remove = async (type: RecordType, row: Rec) => {
    if (!(await confirm(r("delete_confirm", { type: r(`type_${type}`).toLowerCase() })))) return;
    try {
      await recordsAPI.remove(id, type, row._id);
      toast.success(r("removed"));
      load(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.response?.data?.message || "Error");
    }
  };

  const setStatus = async (type: RecordType, row: Rec, status: string) => {
    try {
      await recordsAPI.update(id, type, row._id, { status });
      load(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.response?.data?.message || "Error");
    }
  };

  const pd = (key: string) => t(`patient_detail.${key}`);
  const dash = pd("not_set");
  const d = (v?: string) => (v ? formatDate(v) : dash);
  const locale = language === "tr" ? "tr-TR" : "en-US";

  // ---- laboratory ---------------------------------------------------------------------
  const lab = useMemo(() => {
    const results = (data?.tests ?? []).filter((x) => pick(x, "resultValue", "result_value") !== undefined && !Number.isNaN(parseFloat(String(pick(x, "resultValue", "result_value")))));
    const map = new Map<string, Analyte>();

    [...results]
      .sort((a, b) => new Date(pick(a, "testDate", "test_date", "createdAt")).getTime() - new Date(pick(b, "testDate", "test_date", "createdAt")).getTime())
      .forEach((x) => {
        const name = pick(x, "testName", "test_name") ?? "?";
        const rangeText = pick(x, "normalRange", "normal_range") ?? "";
        const a: Analyte = map.get(name) ?? { name, unit: x.unit ?? "", range: parseRange(rangeText), rangeText, values: [] };

        a.values.push({ day: dayKey(pick(x, "testDate", "test_date", "createdAt")), value: parseFloat(String(pick(x, "resultValue", "result_value"))) });
        map.set(name, a);
      });

    const analytes = Array.from(map.values());
    const days = Array.from(new Set(analytes.flatMap((a) => a.values.map((v) => v.day)))).sort().reverse(); // newest first
    const others = (data?.tests ?? []).filter((x) => !results.includes(x));

    return { analytes, days, others };
  }, [data]);

  const activeDay = drawDay ?? lab.days[0] ?? null;

  const draw = useMemo(() => {
    if (!activeDay) return [];

    return lab.analytes
      .map((a) => {
        const index = a.values.findIndex((v) => v.day === activeDay);

        if (index < 0) return null;
        const value = a.values[index].value;
        const prev = index > 0 ? a.values[index - 1].value : null;

        return { a, value, prev, flag: flagOf(value, a.range), series: a.values.slice(0, index + 1).map((v) => v.value) };
      })
      .filter(Boolean) as { a: Analyte; value: number; prev: number | null; flag: Flag; series: number[] }[];
  }, [lab, activeDay]);

  const outOfRange = draw.filter((r) => r.flag !== "normal").length;

  // ---- timeline -----------------------------------------------------------------------
  const timeline = useMemo(() => {
    if (!data) return [];
    const staff = (r: Rec) => r.staffId?.name;
    const items: { date: string; type: string; title: string; sub?: string; status?: string }[] = [];

    data.appointments.forEach((r) =>
      items.push({ date: pick(r, "appointmentDate", "appointment_date"), type: "appointment", title: r.reason ?? pd("ev_appointment"), sub: [r.appointmentTime, staff(r)].filter(Boolean).join(" · "), status: r.status }));
    data.treatments.forEach((r) =>
      items.push({ date: pick(r, "startDate", "start_date"), type: "treatment", title: pick(r, "description", "treatmentType") ?? pd("ev_treatment"), sub: [r.diagnosis, staff(r)].filter(Boolean).join(" · "), status: r.status }));
    data.visits.forEach((r) =>
      items.push({ date: pick(r, "visitDate", "visit_date", "createdAt"), type: "visit", title: r.reason ?? pd("ev_visit"), sub: staff(r), status: r.status }));
    data.prescriptions.forEach((r) =>
      items.push({ date: pick(r, "prescriptionDate", "prescription_date", "createdAt"), type: "prescription", title: pick(r, "medicationName", "medication_name") ?? pd("ev_prescription"), sub: [r.dosage, r.frequency].filter(Boolean).join(" · "), status: r.status }));
    lab.others.forEach((r) =>
      items.push({ date: pick(r, "testDate", "test_date", "createdAt"), type: "test", title: pick(r, "testName", "test_name") ?? pd("ev_test"), sub: staff(r), status: r.status }));
    lab.days.forEach((day) => {
      const rows = lab.analytes.map((a) => { const v = a.values.find((x) => x.day === day); return v ? flagOf(v.value, a.range) : null; }).filter(Boolean);
      const bad = rows.filter((f) => f !== "normal").length;

      items.push({ date: `${day}T08:00:00`, type: "lab", title: pd("ev_lab"), sub: `${pd("analytes").replace("{n}", String(rows.length))} · ${bad ? pd("out_of_range").replace("{n}", String(bad)) : pd("all_in_range")}`, status: bad ? "pending" : "completed" });
    });

    return items.filter((i) => i.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lab, language]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (missing || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-foreground-500">{pd("not_found")}</p>
        <Button size="sm" variant="bordered" onPress={() => router.push("/dashboard/patients")}>
          {pd("back")}
        </Button>
      </div>
    );
  }

  const p = data.patient;
  const locked = (section: string) => !!data.restricted?.includes(section);
  const emptyFor = (section: string) => (locked(section) ? pd("restricted_section") : pd("no_records"));
  const fullName = `${pick(p, "firstName", "first_name") ?? ""} ${pick(p, "lastName", "last_name") ?? ""}`.trim();
  const years = ageOf(pick(p, "dateOfBirth", "date_of_birth"));
  const blood = pick(p, "bloodType", "blood_type");
  const allergies = pick(p, "allergies");
  const gender = String(p.gender ?? "");
  const genderLabel = t(`values.${gender.toLowerCase()}`) !== `values.${gender.toLowerCase()}` ? t(`values.${gender.toLowerCase()}`) : gender;
  const now = Date.now();
  const nextAppt = data.appointments
    .filter((a) => a.status === "scheduled" && new Date(pick(a, "appointmentDate", "appointment_date")).getTime() >= now - 86400000)
    .sort((a, b) => new Date(pick(a, "appointmentDate")).getTime() - new Date(pick(b, "appointmentDate")).getTime())[0];
  const lastVisit = [...data.visits, ...data.appointments.filter((a) => a.status === "completed")]
    .map((r) => pick(r, "visitDate", "visit_date", "appointmentDate", "appointment_date", "createdAt"))
    .filter((v) => v && new Date(v).getTime() <= now)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const activeMeds = data.prescriptions.filter((r) => r.status === "active");
  const doctor = (r: Rec) => r.staffId?.name ?? dash;
  const statusCell = (r: Rec) => <Chip color={tone(r.status)} size="sm">{r.status ?? dash}</Chip>;
  const when = (r: Rec, ...keys: string[]) => d(pick(r, ...keys));
  const statusLabel = (st: string) => { const k = `values.${st.replace(/_/g, "-")}`; const v = t(k); return v === k ? st : v; };

  const addBtn = (kind: DrawerKind, perm: string, label?: string) =>
    can(perm) ? (
      <Button size="sm" startContent={<Plus size={14} />} variant="flat" onPress={() => setDrawer(kind)}>{label ?? r("add")}</Button>
    ) : null;

  const rowActions = (type: RecordType, resource: string, statuses: string[] = []) => (row: Rec) => (
    <div className="flex items-center justify-end gap-1">
      {statuses.length > 0 && can(`${resource}.edit`) && (
        <Dropdown>
          <DropdownTrigger>
            <Button size="sm" variant="light">{r("change_status")}</Button>
          </DropdownTrigger>
          <DropdownMenu aria-label={r("change_status")} disabledKeys={[row.status]} onAction={(k) => setStatus(type, row, String(k))}>
            {statuses.map((st) => <DropdownItem key={st}>{statusLabel(st)}</DropdownItem>)}
          </DropdownMenu>
        </Dropdown>
      )}
      {can(`${resource}.delete`) && (
        <Tooltip content={r("delete")}>
          <Button isIconOnly aria-label={r("delete")} size="sm" variant="light" onPress={() => remove(type, row)}><Trash2 size={15} /></Button>
        </Tooltip>
      )}
    </div>
  );

  const addItems = ([
    { kind: "appointments", perm: "appointments.create", icon: <CalendarDays size={16} /> },
    { kind: "visits", perm: "visits.create", icon: <ClipboardList size={16} /> },
    { kind: "vitals", perm: "visits.create", icon: <Activity size={16} /> },
    { kind: "tests", perm: "tests.create", icon: <FlaskConical size={16} /> },
    { kind: "lab", perm: "tests.create", icon: <Droplet size={16} /> },
    { kind: "treatments", perm: "treatments.create", icon: <HeartPulse size={16} /> },
    { kind: "prescriptions", perm: "prescriptions.create", icon: <Pill size={16} /> },
    { kind: "insurance", perm: "insurance.create", icon: <ShieldCheck size={16} /> },
  ] as { kind: DrawerKind; perm: string; icon: React.ReactNode }[]).filter((x) => can(x.perm));
  const vitals = (data.vitals ?? []) as Vital[];

  const kpis = [
    { label: pd("next_appointment"), value: nextAppt ? d(pick(nextAppt, "appointmentDate", "appointment_date")) : pd("none_scheduled"), sub: nextAppt?.appointmentTime, icon: <CalendarDays size={17} /> },
    { label: pd("last_visit"), value: lastVisit ? d(lastVisit) : pd("none"), sub: `${data.counts.visits + data.counts.appointments} ${pd("records")}`, icon: <Stethoscope size={17} /> },
    { label: pd("active_meds"), value: locked("prescriptions") ? "—" : String(activeMeds.length), sub: `${data.counts.prescriptions} ${pd("total")}`, icon: <Pill size={17} /> },
    { label: pd("treatments"), value: locked("treatments") ? "—" : String(data.treatments.filter((r) => r.status === "ongoing").length), sub: `${data.counts.treatments} ${pd("total")}`, icon: <HeartPulse size={17} /> },
    { label: pd("lab_results"), value: lab.days.length ? String(draw.length || lab.analytes.length) : pd("none"), sub: lab.days.length ? (outOfRange ? pd("out_of_range").replace("{n}", String(outOfRange)) : pd("all_in_range")) : undefined, subTone: outOfRange ? "text-warning" : "text-success", icon: <FlaskConical size={17} /> },
  ];

  const evIcon: Record<string, React.ReactNode> = {
    appointment: <CalendarDays size={15} />, treatment: <HeartPulse size={15} />, visit: <ClipboardList size={15} />,
    prescription: <Pill size={15} />, test: <FlaskConical size={15} />, lab: <Droplet size={15} />,
  };
  const evTone: Record<string, string> = {
    appointment: "bg-primary/10 text-primary", treatment: "bg-secondary/10 text-secondary", visit: "bg-default-100 text-foreground-500",
    prescription: "bg-success/10 text-success", test: "bg-warning/10 text-warning", lab: "bg-danger/10 text-danger",
  };

  return (
    <div className="mx-auto max-w-[88rem] space-y-4 sm:space-y-5">
      {/* Header */}
      <Card className="w-full">
        <CardBody className="gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <Button isIconOnly aria-label={pd("back")} className="self-start" size="sm" variant="light" onPress={() => router.back()}>
                <ArrowLeft size={18} />
              </Button>
              <Avatar className="h-16 w-16 shrink-0 text-xl sm:h-20 sm:w-20 sm:text-2xl" name={fullName} />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{fullName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground-500">
                  {years !== null && <span>{pd("years_old").replace("{n}", String(years))}</span>}
                  {genderLabel && <><span className="text-foreground-300">•</span><span>{genderLabel}</span></>}
                  <span className="text-foreground-300">•</span>
                  <span className="tabular-nums">{pd("tc_number")}: {pick(p, "tcNumber", "tc_number") ?? dash}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-1 text-sm font-semibold text-danger">
                    <Droplet size={14} />
                    {blood ?? "—"}
                  </span>
                  {data.insurance[0] && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1 text-sm font-medium text-success">
                      <ShieldCheck size={14} />
                      {pick(data.insurance[0], "insuranceCompany", "insurance_company")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.phone && (
                <Button as="a" href={`tel:${p.phone}`} startContent={<Phone size={15} />} variant="bordered">{pd("call")}</Button>
              )}
              {p.email && (
                <Button as="a" href={`mailto:${p.email}`} startContent={<Mail size={15} />} variant="bordered">{pd("send_email")}</Button>
              )}
              {addItems.length > 0 && (
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button color="primary" startContent={<Plus size={16} />}>{r("add_to_file")}</Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label={r("add_to_file")} onAction={(k) => setDrawer(String(k) as DrawerKind)}>
                    {addItems.map((x) => (
                      <DropdownItem key={x.kind} description={r(`hint_${x.kind}`)} startContent={x.icon}>
                        {r(`type_${x.kind}`)}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
            </div>
          </div>

          {locked("medical") && (
            <div className="flex items-center gap-3 rounded-xl border border-divider bg-default-50 px-4 py-3 text-sm text-foreground-500">
              <Lock className="shrink-0" size={16} />
              {pd("medical_hidden")}
            </div>
          )}
          {allergies && (
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-warning" size={17} />
              <p className="text-sm">
                <span className="font-semibold">{pd("allergy_alert")}: </span>
                <span className="text-foreground-600">{allergies}</span>
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 sm:gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="w-full">
            <CardBody className="gap-1.5 p-4">
              <div className="flex items-center justify-between text-foreground-500">
                <span className="text-xs">{k.label}</span>
                <span className="text-foreground-400">{k.icon}</span>
              </div>
              <p className="truncate text-lg font-semibold tabular-nums">{k.value}</p>
              {k.sub && <p className={`truncate text-xs ${(k as any).subTone ?? "text-foreground-500"}`}>{k.sub}</p>}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="w-full min-w-0 self-start">
          <CardBody className="p-0">
            <Tabs
              aria-label="Patient file"
              selectedKey={tab}
              onSelectionChange={(k) => setTab(String(k))}
              classNames={{ tabList: "gap-6 px-5 pt-2 overflow-x-auto", panel: "p-0", cursor: "w-full bg-primary", tab: "px-0 h-11" }}
              variant="underlined"
            >
              <Tab key="overview" title={pd("tab_overview")}>
                <div className="px-5 pb-5 pt-4">
                  <p className="text-xs text-foreground-500">{pd("timeline_hint")}</p>
                  {timeline.length === 0 ? (
                    <p className="py-14 text-center text-sm text-foreground-400">{pd("no_records")}</p>
                  ) : (
                    <ol className="relative mt-4 space-y-1 before:absolute before:bottom-2 before:left-[1.05rem] before:top-2 before:w-px before:bg-divider">
                      {timeline.map((e, i) => (
                        <li key={i} className="relative flex items-start gap-4 rounded-lg py-2.5 pr-2 hover:bg-default-50">
                          <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-content1 ${evTone[e.type]}`}>
                            {evIcon[e.type]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="truncate text-sm font-medium">{e.title}</p>
                              {e.status && <Chip color={tone(e.status)} size="sm">{e.status}</Chip>}
                            </div>
                            <p className="truncate text-xs text-foreground-500">
                              {pd(`ev_${e.type}`)}
                              {e.sub ? ` · ${e.sub}` : ""}
                            </p>
                          </div>
                          <span className="shrink-0 pt-0.5 text-xs text-foreground-400">{d(e.date)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </Tab>

              <Tab key="lab" title={`${pd("tab_lab")} (${lab.analytes.length})`}>
                {lab.days.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-14 text-center text-foreground-400">
                    {locked("tests") && <Lock size={18} />}
                    <p className="text-sm">{locked("tests") ? pd("restricted_section") : pd("no_lab")}</p>
                    {!locked("tests") && addBtn("lab", "tests.create", r("new_lab"))}
                  </div>
                ) : (
                  <div className="space-y-4 px-5 pb-5 pt-4">
                    <div className="flex justify-end">{addBtn("lab", "tests.create", r("new_lab"))}</div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {lab.days.map((day) => (
                          <button
                            key={day}
                            aria-pressed={day === activeDay}
                            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                              day === activeDay ? "border-primary bg-primary/5 font-medium" : "border-divider text-foreground-500 hover:bg-default-100"
                            }`}
                            type="button"
                            onClick={() => setDrawDay(day)}
                          >
                            {new Date(`${day}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                            {day === lab.days[0] && <span className="ml-2 text-xs text-foreground-400">{pd("latest")}</span>}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-foreground-500">{pd("analytes").replace("{n}", String(draw.length))}</span>
                        <Chip color={outOfRange ? "warning" : "success"} size="sm">
                          {outOfRange ? pd("out_of_range").replace("{n}", String(outOfRange)) : pd("all_in_range")}
                        </Chip>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-divider">
                      <table className="w-full min-w-[40rem] text-left text-sm">
                        <thead>
                          <tr className="border-b border-divider bg-default-50 text-xs text-foreground-500">
                            <th className="px-4 py-2.5 font-medium">{pd("analyte")}</th>
                            <th className="px-4 py-2.5 font-medium">{pd("result")}</th>
                            <th className="px-4 py-2.5 font-medium">{pd("reference")}</th>
                            <th className="px-4 py-2.5 font-medium">{pd("flag")}</th>
                            <th className="px-4 py-2.5 font-medium">{pd("trend")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider">
                          {draw.map(({ a, value, prev, flag, series }) => {
                            const delta = prev !== null && prev !== 0 ? ((value - prev) / prev) * 100 : null;

                            return (
                              <tr key={a.name} className={flag !== "normal" ? "bg-warning/5" : "hover:bg-default-50"}>
                                <td className="px-4 py-3 font-medium">{a.name}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-base font-semibold tabular-nums ${flag === "high" ? "text-danger" : flag === "low" ? "text-warning" : ""}`}>{value}</span>
                                  <span className="ml-1 text-xs text-foreground-500">{a.unit}</span>
                                </td>
                                <td className="px-4 py-3">
                                  {a.range ? (
                                    <div className="space-y-1">
                                      <RangeBar flag={flag} range={a.range} value={value} />
                                      <p className="text-[11px] tabular-nums text-foreground-400">{a.rangeText} {a.unit}</p>
                                    </div>
                                  ) : (
                                    <span className="text-foreground-400">{dash}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <Chip color={flag === "normal" ? "success" : flag === "high" ? "danger" : "warning"} size="sm">{pd(flag)}</Chip>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-16">
                                      {series.length > 1 ? <Sparkline fit className={`!h-7 ${flag === "normal" ? "text-primary" : flag === "high" ? "text-danger" : "text-warning"}`} data={series} /> : null}
                                    </div>
                                    {delta !== null && (
                                      <span className={`text-xs tabular-nums ${Math.abs(delta) < 1 ? "text-foreground-400" : delta > 0 ? "text-foreground-600" : "text-foreground-600"}`}>
                                        {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-foreground-400">% = {pd("since_last")}</p>
                  </div>
                )}
              </Tab>

              <Tab key="vitals" title={`${r("tab_vitals")} (${vitals.length})`}>
                <VitalsPanel add={addBtn("vitals", "visits.create", r("add_vitals"))} locale={locale} r={r} vitals={vitals}
                  onDelete={can("visits.delete") ? (v) => remove("vitals", v) : undefined} />
              </Tab>

              <Tab key="appointments" title={`${pd("appointments")} (${data.counts.appointments})`}>
                <Records
                  columns={[
                    { label: pd("date"), cell: (r) => when(r, "appointmentDate", "appointment_date") },
                    { label: pd("time"), cell: (r) => r.appointmentTime ?? dash },
                    { label: pd("reason"), cell: (r) => r.reason ?? dash },
                    { label: pd("doctor"), cell: doctor },
                    { label: pd("status"), cell: statusCell },
                  ]}
                  empty={emptyFor("appointments")}
                  locked={locked("appointments")}
                  add={addBtn("appointments", "appointments.create")}
                  actions={rowActions("appointments", "appointments", ["scheduled", "completed", "cancelled", "no-show"])}
                  rows={data.appointments}
                />
              </Tab>
              <Tab key="treatments" title={`${pd("treatments")} (${data.counts.treatments})`}>
                <Records
                  columns={[
                    { label: pd("date"), cell: (r) => when(r, "startDate", "start_date") },
                    { label: pd("diagnosis"), cell: (r) => r.diagnosis ?? dash },
                    { label: pd("treatment"), cell: (r) => pick(r, "description", "treatmentType") ?? dash },
                    { label: pd("medication"), cell: (r) => r.medication ?? dash },
                    { label: pd("status"), cell: statusCell },
                  ]}
                  empty={emptyFor("treatments")}
                  locked={locked("treatments")}
                  add={addBtn("treatments", "treatments.create")}
                  actions={rowActions("treatments", "treatments", ["ongoing", "completed", "cancelled"])}
                  rows={data.treatments}
                />
              </Tab>
              <Tab key="prescriptions" title={`${pd("prescriptions")} (${data.counts.prescriptions})`}>
                <Records
                  columns={[
                    { label: pd("date"), cell: (r) => when(r, "prescriptionDate", "prescription_date", "createdAt") },
                    { label: pd("medication"), cell: (r) => pick(r, "medicationName", "medication_name") ?? dash },
                    { label: pd("dosage"), cell: (r) => r.dosage ?? dash },
                    { label: pd("frequency"), cell: (r) => r.frequency ?? dash },
                    { label: pd("duration"), cell: (r) => r.duration ?? dash },
                    { label: pd("status"), cell: statusCell },
                  ]}
                  empty={emptyFor("prescriptions")}
                  locked={locked("prescriptions")}
                  add={addBtn("prescriptions", "prescriptions.create")}
                  actions={rowActions("prescriptions", "prescriptions", ["active", "completed", "cancelled"])}
                  rows={data.prescriptions}
                />
              </Tab>
              <Tab key="visits" title={`${pd("visits")} (${data.counts.visits})`}>
                <Records
                  columns={[
                    { label: pd("date"), cell: (r) => when(r, "visitDate", "visit_date", "createdAt") },
                    { label: pd("type"), cell: (r) => <Chip size="sm">{String(pick(r, "visitType", "visit_type") ?? dash)}</Chip> },
                    { label: pd("reason"), cell: (r) => r.reason ?? dash },
                    { label: pd("doctor"), cell: doctor },
                    { label: pd("status"), cell: statusCell },
                  ]}
                  empty={emptyFor("visits")}
                  locked={locked("visits")}
                  add={addBtn("visits", "visits.create")}
                  actions={rowActions("visits", "visits", ["scheduled", "completed", "cancelled"])}
                  rows={data.visits}
                />
              </Tab>
              <Tab key="tests" title={`${pd("tab_other_tests")} (${lab.others.length})`}>
                <Records
                  columns={[
                    { label: pd("date"), cell: (r) => when(r, "testDate", "test_date", "createdAt") },
                    { label: pd("test"), cell: (r) => pick(r, "testName", "test_name") ?? dash },
                    { label: pd("ordered_by"), cell: doctor },
                    { label: pd("priority"), cell: (r) => <Chip color={tone(r.priority)} size="sm">{r.priority ?? dash}</Chip> },
                    { label: pd("status"), cell: statusCell },
                  ]}
                  empty={emptyFor("tests")}
                  locked={locked("tests")}
                  add={addBtn("tests", "tests.create")}
                  actions={rowActions("tests", "tests", ["pending", "in_progress", "completed", "cancelled"])}
                  rows={lab.others}
                />
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        {/* Side column */}
        <div className="space-y-4 xl:sticky xl:top-2 xl:self-start sm:space-y-5">
          <SideCard title={pd("personal_info")}>
            <dl className="-my-1 divide-y divide-divider">
              <Field label={pd("birth_date")}>{d(pick(p, "dateOfBirth", "date_of_birth"))}</Field>
              <Field label={pd("phone")}>{p.phone ?? dash}</Field>
              <Field label={pd("email")}>{p.email ?? dash}</Field>
              <Field label={pd("address")}>{p.address ?? dash}</Field>
              <Field label={pd("registered")}>{d(pick(p, "createdAt", "created_at"))}</Field>
            </dl>
          </SideCard>

          <SideCard icon={can("prescriptions.create") ? <button aria-label={r("add")} className="rounded-md p-1 hover:bg-default-100" type="button" onClick={() => setDrawer("prescriptions")}><Plus size={16} /></button> : <Pill size={16} />} title={pd("active_medications")}>
            {activeMeds.length === 0 ? (
              <p className="text-sm text-foreground-400">{pd("no_active_meds")}</p>
            ) : (
              <ul className="space-y-2.5">
                {activeMeds.slice(0, 6).map((r, i) => (
                  <li key={r._id ?? i} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{pick(r, "medicationName", "medication_name")}</p>
                      <p className="truncate text-xs text-foreground-500">{[r.dosage, r.frequency, r.duration].filter(Boolean).join(" · ")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SideCard>

          <SideCard icon={can("insurance.create") ? <button aria-label={r("add")} className="rounded-md p-1 hover:bg-default-100" type="button" onClick={() => setDrawer("insurance")}><Plus size={16} /></button> : <ShieldCheck size={16} />} title={pd("insurance_title")}>
            {data.insurance.length === 0 ? (
              <p className="text-sm text-foreground-400">{pd("no_insurance")}</p>
            ) : (
              <div className="space-y-3">
                {data.insurance.slice(0, 2).map((r, i) => (
                  <div key={r._id ?? i} className="rounded-xl border border-divider p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{pick(r, "insuranceCompany", "insurance_company")}</p>
                      <Chip color={tone(r.status)} size="sm">{r.status}</Chip>
                    </div>
                    <dl className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between gap-3"><dt className="text-foreground-500">{pd("policy")}</dt><dd className="font-medium tabular-nums">{pick(r, "policyNumber", "policy_number")}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-foreground-500">{pd("coverage")}</dt><dd className="font-medium">{formatCurrency(Number(pick(r, "coverageAmount", "coverage_amount") ?? 0))}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-foreground-500">{pd("valid_until")}</dt><dd className="font-medium">{d(pick(r, "endDate", "end_date"))}</dd></div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </SideCard>

          <SideCard title={pd("emergency_contact")}>
            <dl className="-my-1 divide-y divide-divider">
              <Field label={pd("contact_name")}>{pick(p, "emergencyContactName", "emergency_contact_name") ?? dash}</Field>
              <Field label={pd("phone")}>{pick(p, "emergencyContactPhone", "emergency_contact_phone") ?? dash}</Field>
            </dl>
          </SideCard>

          <SideCard title={pd("medical_history")}>
            <p className="text-sm text-foreground-600">{pick(p, "medicalHistory", "medical_history") ?? pd("none_recorded")}</p>
          </SideCard>
        </div>
      </div>

      {drawer && (
        <RecordDrawer
          isOpen
          kind={drawer}
          patient={{ id, name: fullName, gender, allergies: allergies ? String(allergies) : undefined }}
          onClose={() => setDrawer(null)}
          onSaved={() => load(true)}
        />
      )}
    </div>
  );
}
