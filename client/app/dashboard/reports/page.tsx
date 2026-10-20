"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, CardBody, Skeleton, Tab, Tabs, Tooltip } from "@heroui/react";
import {
  Activity, Building, Calendar, DollarSign, Download, FlaskConical, History, Package, Play, Printer, Save, Star,
  Stethoscope, Trash2, Users,
} from "lucide-react";
import toast from "react-hot-toast";

import DateField from "@/components/DateField";
import { BarChart, Donut, TONE, type Segment, type Tone } from "@/components/charts";
import { useValueLabel } from "@/components/Chip";
import { useConfirm } from "@/components/ConfirmDialog";
import { useI18n } from "@/contexts/I18nContext";
import api from "@/lib/api";

interface Template { id: string; icon: string; category: string; needs: string; allowed: boolean }
interface Kpi { key: string; label: string; value: number; format?: string }
interface Point { label: string; value: number; raw?: string; [k: string]: any }
interface Column { key: string; label: string; format?: string }
interface Section { key: string; title: string; type: "line" | "bar" | "donut" | "table"; format?: string; data?: Point[]; columns?: Column[]; rows?: any[] }
interface Report { id?: string | null; meta: { id: string; from: string; to: string; generatedAt: string }; kpis: Kpi[]; sections: Section[] }
interface HistoryRow { _id: string; template: string; from: string; to: string; generatedByName?: string; createdAt: string }

const ICONS: Record<string, React.ElementType> = {
  users: Users, calendar: Calendar, flask: FlaskConical, dollar: DollarSign, stethoscope: Stethoscope,
  building: Building, package: Package, star: Star,
};
const TONES: Tone[] = ["primary", "success", "warning", "danger", "default"];

const TEXT = {
  en: {
    title: "Reports", subtitle: "Pick a report, choose a period and read the numbers. Results can be saved, exported or printed.",
    templates: "Report types", history: "Saved reports", run: "Create report", save: "Save to history", saved: "Saved", period: "Period",
    from: "From", to: "To", d7: "7 days", d30: "30 days", d90: "90 days", ytd: "This year", d365: "12 months",
    csv: "Download CSV", print: "Print", none: "No saved reports yet", open: "Open", failed: "Could not create the report",
    pick: "Pick a report type to begin", locked: "You don't have access to this report", generated: "Generated", by: "by",
    empty: "No data for this period", delete: "Delete", delete_q: "Delete this saved report?", deleted: "Deleted", loading: "Loading…",
    total: "Total",
    t: {
      patients: ["Patients", "Who is being treated: new registrations, age, gender, blood type, insurance."],
      appointments: ["Appointments", "Volume, completion and no-shows, busiest doctors and hours."],
      clinical: ["Clinical activity", "Lab tests, abnormal results, prescriptions and vital readings."],
      financial: ["Financial", "Treatment revenue by day and type, visit charges and insurance cover."],
      staff: ["Staff", "Headcount by job and department, doctor workload, hiring."],
      departments: ["Departments", "Staff, rooms, capacity and recent activity per department."],
      inventory: ["Inventory & equipment", "Stock value, low stock, expiring medication and equipment status."],
      quality: ["Quality", "Complaints, how fast they are resolved, and patient ratings."],
    } as Record<string, string[]>,
    cat: { clinical: "Clinical", finance: "Finance", operations: "Operations", quality: "Quality" } as Record<string, string>,
  },
  tr: {
    title: "Raporlar", subtitle: "Bir rapor seçin, dönemi belirleyin ve sayıları okuyun. Sonuçlar kaydedilebilir, dışa aktarılabilir veya yazdırılabilir.",
    templates: "Rapor türleri", history: "Kayıtlı raporlar", run: "Raporu oluştur", save: "Geçmişe kaydet", saved: "Kaydedildi", period: "Dönem",
    from: "Başlangıç", to: "Bitiş", d7: "7 gün", d30: "30 gün", d90: "90 gün", ytd: "Bu yıl", d365: "12 ay",
    csv: "CSV indir", print: "Yazdır", none: "Henüz kayıtlı rapor yok", open: "Aç", failed: "Rapor oluşturulamadı",
    pick: "Başlamak için bir rapor türü seçin", locked: "Bu rapora erişiminiz yok", generated: "Oluşturuldu", by: "—",
    empty: "Bu dönem için veri yok", delete: "Sil", delete_q: "Bu kayıtlı rapor silinsin mi?", deleted: "Silindi", loading: "Yükleniyor…",
    total: "Toplam",
    t: {
      patients: ["Hastalar", "Kimler tedavi görüyor: yeni kayıtlar, yaş, cinsiyet, kan grubu, sigorta."],
      appointments: ["Randevular", "Yoğunluk, tamamlanma ve gelmeme, en yoğun hekim ve saatler."],
      clinical: ["Klinik faaliyet", "Laboratuvar testleri, referans dışı sonuçlar, reçeteler ve vital ölçümler."],
      financial: ["Mali durum", "Güne ve türe göre tedavi geliri, ziyaret ücretleri ve sigorta teminatı."],
      staff: ["Personel", "Unvan ve departmana göre kadro, hekim iş yükü, işe alım."],
      departments: ["Departmanlar", "Departman başına personel, oda, kapasite ve son dönem faaliyeti."],
      inventory: ["Stok ve ekipman", "Stok değeri, azalan stok, süresi yaklaşan ilaçlar ve ekipman durumu."],
      quality: ["Kalite", "Şikayetler, çözülme hızı ve hasta puanları."],
    } as Record<string, string[]>,
    cat: { clinical: "Klinik", finance: "Mali", operations: "Operasyon", quality: "Kalite" } as Record<string, string>,
  },
};

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86400000));

export default function ReportsPage() {
  const { language } = useI18n();
  const tx = TEXT[language === "tr" ? "tr" : "en"];
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const label = useValueLabel();
  const confirm = useConfirm();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [tab, setTab] = useState("new");
  const [selected, setSelected] = useState<string | null>(null);
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(iso(new Date()));
  const [preset, setPreset] = useState("d30");
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => { document.title = `${tx.title} · Hospital`; }, [tx.title]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get("/reports/history");
      setHistory(res.data?.data || []);
    } catch { /* the history is optional */ }
  }, []);

  useEffect(() => {
    api.get("/reports/templates").then((res) => setTemplates(res.data?.data || [])).catch(() => {});
    loadHistory();
  }, [loadHistory]);

  const money = useCallback((n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n), [locale]);
  const fmt = useCallback((v: any, format?: string) => {
    if (v === null || v === undefined || v === "") return "—";
    if (format === "money") return money(Number(v));
    if (format === "percent") return `${Number(v).toLocaleString(locale)}%`;
    if (format === "date") return new Date(v).toLocaleDateString(locale);
    if (typeof v === "number") return v.toLocaleString(locale, { maximumFractionDigits: 2 });

    return String(v);
  }, [locale, money]);

  const applyPreset = (id: string) => {
    setPreset(id);
    const n = { d7: 6, d30: 29, d90: 89, d365: 364 }[id];
    setTo(iso(new Date()));
    if (n !== undefined) setFrom(daysAgo(n));
    if (id === "ytd") setFrom(`${new Date().getFullYear()}-01-01`);
  };

  const run = async (save = false) => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await api.post("/reports/run", { template: selected, startDate: from, endDate: to, lang: language, save });
      setReport(res.data.data);
      setSavedId(res.data.data.id || null);
      if (!save) setTimeout(() => document.getElementById("report-view")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      if (save) { toast.success(tx.saved); loadHistory(); }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || tx.failed);
    } finally { setBusy(false); }
  };

  const openSaved = async (row: HistoryRow) => {
    setBusy(true);
    try {
      const res = await api.get(`/reports/history/${row._id}`);
      setReport(res.data.data);
      setSavedId(row._id);
      setSelected(row.template);
      setTab("new");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || tx.failed);
    } finally { setBusy(false); }
  };

  const removeSaved = async (row: HistoryRow) => {
    if (!(await confirm(tx.delete_q))) return;
    try {
      await api.delete(`/reports/history/${row._id}`);
      toast.success(tx.deleted);
      setHistory((h) => h.filter((x) => x._id !== row._id));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || tx.failed);
    }
  };

  const exportCsv = () => {
    if (!report) return;
    const rows: string[][] = [[tx.t[report.meta.id]?.[0] || report.meta.id, `${report.meta.from.slice(0, 10)} – ${report.meta.to.slice(0, 10)}`], []];
    report.kpis.forEach((k) => rows.push([k.label, String(k.value)]));
    report.sections.forEach((s) => {
      rows.push([], [s.title]);
      if (s.type === "table") {
        rows.push((s.columns || []).map((c) => c.label));
        (s.rows || []).forEach((r) => rows.push((s.columns || []).map((c) => String(r[c.key] ?? ""))));
      } else {
        (s.data || []).forEach((d) => rows.push([label(d.label), String(d.value)]));
      }
    });
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${report.meta.id}-${iso(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nameOf = (id: string) => tx.t[id]?.[0] || id;

  return (
    <div className="mx-auto max-w-6xl space-y-6 print:max-w-none">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">{tx.title}</h1>
        <p className="mt-1 text-sm text-foreground-500">{tx.subtitle}</p>
      </div>

      <Tabs aria-label={tx.title} className="print:hidden" selectedKey={tab} variant="underlined" onSelectionChange={(k) => { setTab(String(k)); if (k === "history") loadHistory(); }}>
        <Tab key="new" title={<span className="flex items-center gap-2"><Activity size={15} />{tx.templates}</span>} />
        <Tab key="history" title={<span className="flex items-center gap-2"><History size={15} />{tx.history}{history.length ? ` (${history.length})` : ""}</span>} />
      </Tabs>

      {tab === "history" ? (
        <Card shadow="none" className="border border-divider">
          <CardBody className="p-0">
            {history.length === 0 ? (
              <p className="p-10 text-center text-sm text-foreground-500">{tx.none}</p>
            ) : (
              <ul className="divide-y divide-divider">
                {history.map((h) => (
                  <li key={h._id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{nameOf(h.template)}</p>
                      <p className="text-xs text-foreground-500">
                        {new Date(h.from).toLocaleDateString(locale)} – {new Date(h.to).toLocaleDateString(locale)} · {new Date(h.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}{h.generatedByName ? ` · ${h.generatedByName}` : ""}
                      </p>
                    </div>
                    <Button size="sm" variant="flat" onPress={() => openSaved(h)}>{tx.open}</Button>
                    <Tooltip content={tx.delete}>
                      <Button isIconOnly aria-label={tx.delete} size="sm" variant="light" onPress={() => removeSaved(h)}><Trash2 size={15} /></Button>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="space-y-5 print:hidden">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {templates.map((t) => {
                const Icon = ICONS[t.icon] || Activity;
                const on = selected === t.id;

                return (
                  <button
                    key={t.id}
                    className={`rounded-large border p-4 text-left transition-colors ${on ? "border-primary bg-primary/5" : "border-divider hover:bg-content2"} ${t.allowed ? "" : "cursor-not-allowed opacity-50"}`}
                    disabled={!t.allowed}
                    title={t.allowed ? undefined : tx.locked}
                    type="button"
                    onClick={() => { setSelected(t.id); setReport(null); setSavedId(null); }}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={on ? "text-primary" : "text-foreground-500"} size={18} />
                      <span className="text-[11px] text-foreground-400">{tx.cat[t.category] || t.category}</span>
                    </div>
                    <p className="mt-3 text-sm font-medium">{tx.t[t.id]?.[0] || t.id}</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground-500">{tx.t[t.id]?.[1]}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {selected ? (
            <Card shadow="none" className="border border-divider print:hidden">
              <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex-1">
                  <p className="mb-2 text-sm font-medium">{tx.period}</p>
                  <div className="flex flex-wrap gap-2">
                    {(["d7", "d30", "d90", "ytd", "d365"] as const).map((p) => (
                      <button
                        key={p}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${preset === p ? "border-primary bg-primary/10 text-primary" : "border-divider text-foreground-600 hover:bg-content2"}`}
                        type="button"
                        onClick={() => applyPreset(p)}
                      >
                        {tx[p]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:w-96">
                  <DateField label={tx.from} max={to} value={from} onValueChange={(v) => { setFrom(v); setPreset(""); }} />
                  <DateField label={tx.to} min={from} value={to} onValueChange={(v) => { setTo(v); setPreset(""); }} />
                </div>
                <Button color="primary" isLoading={busy} startContent={!busy && <Play size={15} />} onPress={() => run(false)}>{tx.run}</Button>
              </CardBody>
            </Card>
          ) : (
            !report && <p className="rounded-large border border-dashed border-divider p-8 text-center text-sm text-foreground-500">{tx.pick}</p>
          )}

          {busy && !report && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-large" />)}
            </div>
          )}

          {report && (
            <ReportView
              fmt={fmt}
              label={label}
              locale={locale}
              report={report}
              savedId={savedId}
              title={nameOf(report.meta.id)}
              tx={tx}
              onCsv={exportCsv}
              onPrint={() => window.print()}
              onSave={() => run(true)}
            />
          )}
        </>
      )}
    </div>
  );
}

function ReportView({ report, title, tx, locale, fmt, label, savedId, onSave, onCsv, onPrint }: {
  report: Report; title: string; tx: typeof TEXT.en; locale: string; fmt: (v: any, f?: string) => string; label: (v: string) => string;
  savedId: string | null; onSave: () => void; onCsv: () => void; onPrint: () => void;
}) {
  const range = `${new Date(report.meta.from).toLocaleDateString(locale)} – ${new Date(report.meta.to).toLocaleDateString(locale)}`;

  return (
    <div className="space-y-4" id="report-view">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-foreground-500">{range} · {tx.generated} {new Date(report.meta.generatedAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          {!savedId && <Button size="sm" startContent={<Save size={14} />} variant="flat" onPress={onSave}>{tx.save}</Button>}
          <Button size="sm" startContent={<Download size={14} />} variant="flat" onPress={onCsv}>{tx.csv}</Button>
          <Button size="sm" startContent={<Printer size={14} />} variant="flat" onPress={onPrint}>{tx.print}</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {report.kpis.map((k) => (
          <Card key={k.key} shadow="none" className="border border-divider">
            <CardBody className="gap-1 p-4">
              <p className="text-xs text-foreground-500">{k.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{fmt(k.value, k.format)}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {report.sections.map((s) => (
          <Card key={s.key} shadow="none" className={`border border-divider print:break-inside-avoid ${s.type === "table" || s.type === "line" ? "lg:col-span-2" : ""}`}>
            <CardBody className="gap-4 p-5">
              <p className="text-sm font-medium">{s.title}</p>
              <SectionBody fmt={fmt} label={label} locale={locale} section={s} tx={tx} />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SectionBody({ section: s, fmt, label, locale, tx }: { section: Section; fmt: (v: any, f?: string) => string; label: (v: string) => string; locale: string; tx: typeof TEXT.en }) {
  const data = s.data || [];

  if (s.type === "table") {
    if (!s.rows?.length) return <p className="py-6 text-center text-sm text-foreground-500">{tx.empty}</p>;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-divider text-left text-xs text-foreground-500">
              {s.columns!.map((c) => <th key={c.key} className={`py-2 pr-4 font-medium ${c.format ? "text-right" : ""}`}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {s.rows.map((r, i) => (
              <tr key={i} className="border-b border-divider/60 last:border-0">
                {s.columns!.map((c) => <td key={c.key} className={`py-2 pr-4 ${c.format ? "text-right tabular-nums" : ""}`}>{c.format ? fmt(r[c.key], c.format) : label(String(r[c.key] ?? "—"))}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length || data.every((d) => !d.value)) return <p className="py-6 text-center text-sm text-foreground-500">{tx.empty}</p>;

  if (s.type === "line") {
    return (
      <div>
        <BarChart data={data.map((d) => d.value)} labels={data.map((d) => d.label)} locale={locale} />
        <p className="mt-2 text-xs text-foreground-500">{tx.total}: <span className="font-medium text-foreground tabular-nums">{fmt(data.reduce((a, d) => a + d.value, 0), s.format)}</span></p>
      </div>
    );
  }

  if (s.type === "donut") {
    const segments: Segment[] = data.map((d, i) => ({ label: label(d.label), value: d.value, tone: TONES[i % TONES.length] }));
    const total = data.reduce((a, d) => a + d.value, 0);

    return (
      <div className="flex flex-wrap items-center gap-6">
        <Donut segments={segments} size={140}>
          <span className="text-lg font-semibold tabular-nums">{fmt(total, s.format)}</span>
        </Donut>
        <ul className="min-w-[12rem] flex-1 space-y-2">
          {segments.map((x) => (
            <li key={x.label} className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 shrink-0 rounded-full ${TONE[x.tone].bg}`} />
              <span className="flex-1 truncate">{x.label}</span>
              <span className="tabular-nums text-foreground-600">{fmt(x.value, s.format)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => (
        <li key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{label(d.label)}</span>
            <span className="tabular-nums text-foreground-600">{fmt(d.value, s.format)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-content2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((d.value / max) * 100, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
