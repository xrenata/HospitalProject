"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete, AutocompleteItem, Button, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, Input, Pagination, Select, SelectItem, Textarea, Tooltip,
} from "@heroui/react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { Chip } from "@/components/Chip";
import { useConfirm } from "@/components/ConfirmDialog";
import DataSummary from "@/components/DataSummary";
import DateField from "@/components/DateField";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import api, { patientsAPI, staffAPI } from "@/lib/api";

type L = { en: string; tr: string };
/** [value, English, Turkish] */
export type Opt = [string, string, string];

export interface FieldDef {
  key: string;
  label: L;
  type: "text" | "number" | "select" | "date" | "textarea" | "patient" | "staff" | "items";
  options?: Opt[];
  required?: boolean;
  half?: boolean;
  default?: any;
}

export interface ColumnDef {
  key: string;
  label: L;
  kind?: "text" | "date" | "money" | "chip" | "number" | "name";
  options?: Opt[];
  /** read a nested value, e.g. patient name */
  get?: (row: any) => any;
}

export interface ModuleConfig {
  resource: string; // permission resource, also the summary entity
  path: string; // api path
  title: L;
  subtitle: L;
  addLabel: L;
  columns: ColumnDef[];
  fields: FieldDef[];
  filters?: { key: string; label: L; options: Opt[] }[];
  searchHint: L;
  statusTone?: Record<string, "success" | "warning" | "danger" | "primary" | "default">;
}

const field = { variant: "bordered", labelPlacement: "outside", placeholder: " " } as const;
const personName = (p: any) => (p ? `${p.firstName ?? p.first_name ?? ""} ${p.lastName ?? p.last_name ?? ""}`.trim() : "");

export default function ResourceModule({ cfg }: { cfg: ModuleConfig }) {
  const { language } = useI18n();
  const tr = language === "tr";
  const loc = tr ? "tr-TR" : "en-US";
  const pick = (l: L) => (tr ? l.tr : l.en);
  const opt = (o: Opt[] | undefined, v: string) => { const f = o?.find((x) => x[0] === v); return f ? (tr ? f[2] : f[1]) : v; };
  const { can } = useAuth();
  const confirm = useConfirm();

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<any | "new" | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<{ _id: string; name: string }[]>([]);
  const [staff, setStaff] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => { document.title = `${pick(cfg.title)} · Hospital`; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [language]);
  useEffect(() => { const id = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(id); }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(cfg.path, { params: { page, limit: 10, search: q || undefined, ...filters } });

      setRows(res.data?.data || []);
      setPages(res.data?.pagination?.totalPages || 1);
    } catch {
      toast.error(tr ? "Liste yüklenemedi" : "Could not load the list");
    } finally { setLoading(false); }
  }, [cfg.path, page, q, filters, tr]);

  useEffect(() => { load(); }, [load]);

  const needs = (t: string) => cfg.fields.some((f) => f.type === t);

  useEffect(() => {
    if (editing === null) return;
    if (needs("patient") && !patients.length) {
      patientsAPI.getAll({ limit: 1000 }).then((r) => setPatients((r.data?.patients || []).map((p: any) => ({ _id: p.patient_id || p._id || p.id, name: p.fullName || personName(p) })))).catch(() => {});
    }
    if (needs("staff") && !staff.length) staffAPI.getAll({ status: "active" }).then((r) => setStaff(r.data?.staff || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const open = (row: any | "new") => {
    setError(null);
    setEditing(row);
    const base: Record<string, any> = {};

    cfg.fields.forEach((f) => {
      const raw = row === "new" ? f.default : row[f.key];

      if (f.type === "date") base[f.key] = raw ? String(raw).slice(0, 10) : "";
      else if (f.type === "patient" || f.type === "staff") base[f.key] = raw?._id ?? raw ?? "";
      else if (f.type === "items") base[f.key] = raw?.length ? raw : [{ description: "", quantity: 1, unitPrice: 0 }];
      else base[f.key] = raw ?? (f.type === "select" ? f.options?.[0]?.[0] ?? "" : "");
    });
    setForm(base);
  };

  const set = (k: string, v: any) => { setForm((f) => ({ ...f, [k]: v })); setError(null); };

  const save = async () => {
    const missing = cfg.fields.find((f) => f.required && !String(form[f.key] ?? "").trim());

    if (missing) { setError(tr ? "Zorunlu alanları doldurun" : "Fill in the required fields"); return; }
    setSaving(true);
    try {
      const body: Record<string, any> = {};

      cfg.fields.forEach((f) => {
        const v = form[f.key];

        if (f.type === "number") body[f.key] = v === "" ? undefined : Number(v);
        else if (v !== "") body[f.key] = v;
      });
      if (editing === "new") await api.post(cfg.path, body);
      else await api.put(`${cfg.path}/${editing._id}`, body);
      toast.success(tr ? "Kaydedildi" : "Saved");
      setEditing(null);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || "Error");
    } finally { setSaving(false); }
  };

  const remove = async (row: any) => {
    if (!(await confirm(tr ? "Bu kayıt silinsin mi? Bu işlem geri alınamaz." : "Delete this record? This cannot be undone."))) return;
    try {
      await api.delete(`${cfg.path}/${row._id}`);
      toast.success(tr ? "Silindi" : "Removed");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Error");
    }
  };

  const cell = (c: ColumnDef, row: any) => {
    const v = c.get ? c.get(row) : row[c.key];

    if (v === undefined || v === null || v === "") return <span className="text-foreground-300">—</span>;
    if (c.kind === "date") return new Date(v).toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });
    if (c.kind === "money") return new Intl.NumberFormat(loc, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(v));
    if (c.kind === "number") return Number(v).toLocaleString(loc);
    if (c.kind === "chip") return <Chip color={cfg.statusTone?.[v] ?? "default"} size="sm">{opt(c.options, String(v))}</Chip>;
    if (c.kind === "name") return <span className="font-medium">{String(v)}</span>;

    return String(v);
  };

  const total = useMemo(() => {
    const items: any[] = form.items || [];
    const sub = items.reduce((a, i) => a + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
    const cover = Math.min(Number(form.insuranceCovered) || 0, sub);

    return { sub, owed: Math.max(sub - cover, 0) };
  }, [form.items, form.insuranceCovered]);

  const render = (f: FieldDef) => {
    const label = pick(f.label);
    const common = { ...field, label, isRequired: f.required, className: f.half ? "" : "col-span-2" };

    switch (f.type) {
      case "select":
        return <Select key={f.key} {...common} selectedKeys={form[f.key] ? [form[f.key]] : []} onSelectionChange={(k) => set(f.key, Array.from(k)[0] ?? "")}>{(f.options || []).map((o) => <SelectItem key={o[0]}>{tr ? o[2] : o[1]}</SelectItem>)}</Select>;
      case "date":
        return <DateField key={f.key} className={common.className} isRequired={f.required} label={label} value={form[f.key]} onValueChange={(v) => set(f.key, v)} />;
      case "textarea":
        return <Textarea key={f.key} {...common} minRows={2} value={form[f.key] ?? ""} onValueChange={(v) => set(f.key, v)} />;
      case "number":
        return <Input key={f.key} {...common} inputMode="decimal" type="number" value={String(form[f.key] ?? "")} onValueChange={(v) => set(f.key, v)} />;
      case "patient":
      case "staff": {
        const list = f.type === "patient" ? patients : staff.map((s) => ({ _id: s._id, name: s.name }));

        return (
          <Autocomplete key={f.key} {...common} defaultItems={list} selectedKey={form[f.key] || null} onSelectionChange={(k) => set(f.key, k ? String(k) : "")}>
            {(p) => <AutocompleteItem key={p._id} textValue={p.name}>{p.name}</AutocompleteItem>}
          </Autocomplete>
        );
      }
      case "items":
        return (
          <div key={f.key} className="col-span-2 space-y-2">
            <p className="text-sm">{label}</p>
            {(form.items || []).map((it: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_4rem_6rem_2rem] items-center gap-2">
                <Input aria-label="description" placeholder={tr ? "Açıklama" : "Description"} size="sm" variant="bordered" value={it.description} onValueChange={(v) => set("items", form.items.map((x: any, j: number) => (j === i ? { ...x, description: v } : x)))} />
                <Input aria-label="quantity" size="sm" type="number" variant="bordered" value={String(it.quantity)} onValueChange={(v) => set("items", form.items.map((x: any, j: number) => (j === i ? { ...x, quantity: v } : x)))} />
                <Input aria-label="price" size="sm" type="number" variant="bordered" value={String(it.unitPrice)} onValueChange={(v) => set("items", form.items.map((x: any, j: number) => (j === i ? { ...x, unitPrice: v } : x)))} />
                <Button isIconOnly aria-label="remove" isDisabled={form.items.length < 2} size="sm" variant="light" onPress={() => set("items", form.items.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></Button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button size="sm" startContent={<Plus size={14} />} variant="flat" onPress={() => set("items", [...form.items, { description: "", quantity: 1, unitPrice: 0 }])}>{tr ? "Kalem ekle" : "Add line"}</Button>
              <p className="text-sm text-foreground-600">
                {tr ? "Ara toplam" : "Subtotal"}: <span className="tabular-nums">{total.sub.toLocaleString(loc)}</span> · {tr ? "Hastanın ödeyeceği" : "Patient owes"}: <span className="font-semibold tabular-nums">{total.owed.toLocaleString(loc)}</span>
              </p>
            </div>
          </div>
        );
      default:
        return <Input key={f.key} {...common} value={String(form[f.key] ?? "")} onValueChange={(v) => set(f.key, v)} />;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{pick(cfg.title)}</h1>
          <p className="mt-1 text-sm text-foreground-500">{pick(cfg.subtitle)}</p>
        </div>
        {can(`${cfg.resource}.create`) && <Button color="primary" startContent={<Plus size={16} />} onPress={() => open("new")}>{pick(cfg.addLabel)}</Button>}
      </div>

      <DataSummary entity={cfg.resource} loading={loading} />

      <div className="flex flex-wrap gap-3">
        <Input {...field} aria-label={pick(cfg.searchHint)} className="min-w-64 flex-1" placeholder={pick(cfg.searchHint)} startContent={<Search className="text-foreground-400" size={16} />} value={search} onValueChange={setSearch} />
        {cfg.filters?.map((f) => (
          <Select key={f.key} {...field} aria-label={pick(f.label)} className="w-48" placeholder={pick(f.label)} selectedKeys={[filters[f.key] || "all"]} onSelectionChange={(k) => { const v = String(Array.from(k)[0] ?? "all"); setFilters((x) => ({ ...x, [f.key]: v === "all" ? "" : v })); setPage(1); }}>
            {[<SelectItem key="all">{pick(f.label)}</SelectItem>, ...f.options.map((o) => <SelectItem key={o[0]}>{tr ? o[2] : o[1]}</SelectItem>)]}
          </Select>
        ))}
      </div>

      <div className="overflow-x-auto rounded-large border border-divider">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-divider bg-content2 text-xs text-foreground-500">
              {cfg.columns.map((c) => <th key={c.key} className="px-4 py-2.5 font-medium">{pick(c.label)}</th>)}
              <th className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {rows.length === 0 && (
              <tr><td className="px-4 py-12 text-center text-foreground-500" colSpan={cfg.columns.length + 1}>{loading ? (tr ? "Yükleniyor…" : "Loading…") : tr ? "Kayıt yok" : "Nothing here yet"}</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row._id} className="hover:bg-default-50">
                {cfg.columns.map((c) => <td key={c.key} className="px-4 py-3 align-top">{cell(c, row)}</td>)}
                <td className="px-2 py-2 text-right">
                  {can(`${cfg.resource}.edit`) && <Tooltip content={tr ? "Düzenle" : "Edit"}><Button isIconOnly aria-label="edit" size="sm" variant="light" onPress={() => open(row)}><Pencil size={15} /></Button></Tooltip>}
                  {can(`${cfg.resource}.delete`) && <Tooltip content={tr ? "Sil" : "Delete"}><Button isIconOnly aria-label="delete" size="sm" variant="light" onPress={() => remove(row)}><Trash2 size={15} /></Button></Tooltip>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && <div className="flex justify-center"><Pagination isCompact showControls page={page} total={pages} onChange={setPage} /></div>}

      <Drawer isOpen={editing !== null} placement="right" size="lg" onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DrawerContent>
          {() => (
            <>
              <DrawerHeader className="border-b border-divider text-base font-semibold">{editing === "new" ? pick(cfg.addLabel) : tr ? "Kaydı düzenle" : "Edit record"}</DrawerHeader>
              <DrawerBody className="py-5">
                <div className="grid grid-cols-2 gap-x-3 gap-y-5">{cfg.fields.map(render)}</div>
                {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
              </DrawerBody>
              <DrawerFooter className="border-t border-divider">
                <Button variant="light" onPress={() => setEditing(null)}>{tr ? "Vazgeç" : "Cancel"}</Button>
                <Button color="primary" isLoading={saving} onPress={save}>{tr ? "Kaydet" : "Save"}</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
