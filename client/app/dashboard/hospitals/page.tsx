"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete, AutocompleteItem, Button, Card, CardBody, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, Input, Select, SelectItem, Skeleton, Tooltip,
} from "@heroui/react";
import { Building2, Check, LogIn, Pencil, Plus, Power, Search, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { Chip } from "@/components/Chip";
import { useConfirm } from "@/components/ConfirmDialog";
import DateField from "@/components/DateField";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useI18n } from "@/contexts/I18nContext";
import { hospitalAPI } from "@/lib/api";

interface Hospital {
  _id: string;
  name: string;
  group?: string;
  code?: string;
  city?: string;
  type?: string;
  capacity?: number;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  licenseNumber?: string;
  establishedDate?: string;
  ambulanceCount?: number;
  status: "active" | "inactive" | "under_maintenance";
  isDefault?: boolean;
  counts?: { patients: number; staff: number; departments: number; rooms: number; equipment: number; medications: number; upcoming: number };
}

const TEXT = {
  en: {
    title: "Hospitals", subtitle: "Every hospital and the group it belongs to. Open one to work in it; each keeps its own patients, staff and records.",
    add: "Add hospital", edit: "Edit hospital", search: "Search by name, city, group or code", all_groups: "All groups", independent: "Independent",
    hospitals: "Hospitals", groups: "Groups", patients: "Patients", staff: "Staff", departments: "Departments", rooms: "Rooms", upcoming: "Upcoming appointments",
    open: "Open", current: "You are here", default: "Default", make_default: "Make default", deactivate: "Deactivate", activate: "Activate", delete: "Delete",
    delete_q: "Delete {name}? This cannot be undone.", deactivate_q: "Deactivate {name}? People can no longer switch to it.", saved: "Saved", removed: "Removed",
    name: "Name", group: "Group / network", group_hint: "Hospitals of the same group are listed together", code: "Short code", city: "City", type: "Type", capacity: "Bed capacity",
    address: "Address", phone: "Phone", email: "Email", website: "Website", license: "License number", established: "Established", ambulances: "Ambulances", status: "Status",
    types: { general: "General hospital", specialty: "Specialty hospital", teaching: "Teaching hospital", clinic: "Clinic / polyclinic", rehabilitation: "Rehabilitation centre", emergency: "Emergency centre" } as Record<string, string>,
    states: { active: "Active", inactive: "Inactive", under_maintenance: "Under maintenance" } as Record<string, string>,
    save: "Save", cancel: "Cancel", name_required: "Enter a name", none: "No hospitals match", loading_failed: "Could not load hospitals",
  },
  tr: {
    title: "Hastaneler", subtitle: "Tüm hastaneler ve bağlı oldukları grup. Birini açıp onun içinde çalışın; her hastanenin kendi hastaları, personeli ve kayıtları vardır.",
    add: "Hastane ekle", edit: "Hastaneyi düzenle", search: "Ad, şehir, grup veya koda göre ara", all_groups: "Tüm gruplar", independent: "Bağımsız",
    hospitals: "Hastane", groups: "Grup", patients: "Hasta", staff: "Personel", departments: "Bölüm", rooms: "Oda", upcoming: "Yaklaşan randevu",
    open: "Aç", current: "Şu an buradasınız", default: "Varsayılan", make_default: "Varsayılan yap", deactivate: "Pasifleştir", activate: "Aktifleştir", delete: "Sil",
    delete_q: "{name} silinsin mi? Bu işlem geri alınamaz.", deactivate_q: "{name} pasifleştirilsin mi? İnsanlar artık buna geçemez.", saved: "Kaydedildi", removed: "Silindi",
    name: "Ad", group: "Grup / ağ", group_hint: "Aynı gruptaki hastaneler birlikte listelenir", code: "Kısa kod", city: "Şehir", type: "Tür", capacity: "Yatak kapasitesi",
    address: "Adres", phone: "Telefon", email: "E-posta", website: "Web sitesi", license: "Ruhsat numarası", established: "Kuruluş tarihi", ambulances: "Ambulans", status: "Durum",
    types: { general: "Genel hastane", specialty: "Branş hastanesi", teaching: "Eğitim hastanesi", clinic: "Klinik / poliklinik", rehabilitation: "Rehabilitasyon merkezi", emergency: "Acil merkezi" } as Record<string, string>,
    states: { active: "Aktif", inactive: "Pasif", under_maintenance: "Bakımda" } as Record<string, string>,
    save: "Kaydet", cancel: "Vazgeç", name_required: "Bir ad girin", none: "Eşleşen hastane yok", loading_failed: "Hastaneler yüklenemedi",
  },
};

const blank = { name: "", group: "", code: "", city: "", type: "general", capacity: "", address: "", phone: "", email: "", website: "", licenseNumber: "", establishedDate: "", ambulanceCount: "", status: "active" };
const field = { variant: "bordered", labelPlacement: "outside", placeholder: " " } as const;

export default function HospitalsPage() {
  const { language } = useI18n();
  const tx = TEXT[language === "tr" ? "tr" : "en"];
  const { can } = useAuth();
  const { current, switchTo, refresh } = useHospital();
  const confirm = useConfirm();

  const [rows, setRows] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [editing, setEditing] = useState<Hospital | "new" | null>(null);
  const [form, setForm] = useState<Record<string, any>>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { document.title = `${tx.title} · Hospital`; }, [tx.title]);

  const load = useCallback(async () => {
    try {
      const res = await hospitalAPI.getAll();

      setRows(res.data?.data || []);
    } catch {
      toast.error(tx.loading_failed);
    } finally { setLoading(false); }
  }, [tx.loading_failed]);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => Array.from(new Set(rows.map((h) => h.group).filter(Boolean) as string[])).sort(), [rows]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((h) =>
      (group === "all" || (group === "" ? !h.group : h.group === group)) &&
      (!q || [h.name, h.city, h.group, h.code].some((v) => v?.toLowerCase().includes(q))));
  }, [rows, query, group]);

  const grouped = useMemo(() => {
    const map = new Map<string, Hospital[]>();

    shown.forEach((h) => map.set(h.group || "", [...(map.get(h.group || "") ?? []), h]));

    return Array.from(map.entries()).sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));
  }, [shown]);

  const sum = (key: keyof NonNullable<Hospital["counts"]>) => rows.reduce((a, h) => a + (h.counts?.[key] ?? 0), 0);

  const openForm = (h: Hospital | "new") => {
    setEditing(h);
    setError(null);
    setForm(h === "new" ? blank : {
      ...blank, ...h, capacity: h.capacity ?? "", ambulanceCount: h.ambulanceCount ?? "", establishedDate: h.establishedDate?.slice(0, 10) ?? "",
      group: h.group ?? "", code: h.code ?? "", city: h.city ?? "", phone: h.phone ?? "", email: h.email ?? "", website: h.website ?? "", licenseNumber: h.licenseNumber ?? "", address: h.address ?? "",
    });
  };

  const set = (k: string, v: any) => { setForm((f) => ({ ...f, [k]: v })); setError(null); };

  const save = async () => {
    if (!String(form.name).trim()) { setError(tx.name_required); return; }
    setSaving(true);
    try {
      const body = { ...form };

      if (!body.establishedDate) delete body.establishedDate;
      if (editing === "new") await hospitalAPI.create(body);
      else if (editing) await hospitalAPI.update(editing._id, body);
      toast.success(tx.saved);
      setEditing(null);
      await Promise.all([load(), refresh()]);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || "Error");
    } finally { setSaving(false); }
  };

  const patch = async (h: Hospital, data: Record<string, any>) => {
    try {
      await hospitalAPI.update(h._id, data);
      await Promise.all([load(), refresh()]);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Error");
    }
  };

  const remove = async (h: Hospital) => {
    if (!(await confirm(tx.delete_q.replace("{name}", h.name)))) return;
    try {
      await hospitalAPI.delete(h._id);
      toast.success(tx.removed);
      await Promise.all([load(), refresh()]);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Error");
    }
  };

  const toggleActive = async (h: Hospital) => {
    if (h.status === "active" && !(await confirm(tx.deactivate_q.replace("{name}", h.name)))) return;
    patch(h, { status: h.status === "active" ? "inactive" : "active" });
  };

  const stat = (label: string, value: number) => (
    <Card shadow="none" className="border border-divider">
      <CardBody className="gap-1 p-4">
        <p className="text-xs text-foreground-500">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString(language === "tr" ? "tr-TR" : "en-US")}</p>
      </CardBody>
    </Card>
  );

  const canEdit = can("hospital.edit");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tx.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-foreground-500">{tx.subtitle}</p>
        </div>
        {can("hospital.create") && <Button color="primary" startContent={<Plus size={16} />} onPress={() => openForm("new")}>{tx.add}</Button>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat(tx.hospitals, rows.length)}
        {stat(tx.groups, groups.length)}
        {stat(tx.patients, sum("patients"))}
        {stat(tx.staff, sum("staff"))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          {...field}
          aria-label={tx.search}
          className="min-w-64 flex-1"
          placeholder={tx.search}
          startContent={<Search className="text-foreground-400" size={16} />}
          value={query}
          onValueChange={setQuery}
        />
        <Select {...field} aria-label={tx.groups} className="w-56" placeholder={tx.all_groups} selectedKeys={[group]} onSelectionChange={(k) => setGroup(String(Array.from(k)[0] ?? "all"))}>
          {[<SelectItem key="all">{tx.all_groups}</SelectItem>, ...groups.map((g) => <SelectItem key={g}>{g}</SelectItem>)]}
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-large" />)}</div>
      ) : grouped.length === 0 ? (
        <p className="rounded-large border border-dashed border-divider p-10 text-center text-sm text-foreground-500">{tx.none}</p>
      ) : (
        grouped.map(([name, list]) => (
          <section key={name || "none"} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-foreground-600">
              <Building2 size={15} /> {name || tx.independent} <span className="text-foreground-400">· {list.length}</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((h) => {
                const here = current?._id === h._id;

                return (
                  <Card key={h._id} shadow="none" className={`border ${here ? "border-primary" : "border-divider"}`}>
                    <CardBody className="gap-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold">{h.name}</p>
                          <p className="mt-0.5 truncate text-xs text-foreground-500">
                            {[h.code, h.city, tx.types[h.type || "general"] ?? h.type].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {h.isDefault && <Chip size="sm" startContent={<Star size={11} />}>{tx.default}</Chip>}
                          <Chip color={h.status === "active" ? "success" : h.status === "inactive" ? "default" : "warning"} size="sm">{tx.states[h.status] ?? h.status}</Chip>
                        </div>
                      </div>

                      <dl className="grid grid-cols-4 gap-2 text-center">
                        {([["patients", tx.patients], ["staff", tx.staff], ["departments", tx.departments], ["rooms", tx.rooms]] as const).map(([k, l]) => (
                          <div key={k} className="rounded-lg bg-content2 py-2">
                            <dd className="text-lg font-semibold tabular-nums">{h.counts?.[k] ?? 0}</dd>
                            <dt className="text-[11px] text-foreground-500">{l}</dt>
                          </div>
                        ))}
                      </dl>

                      <div className="flex items-center justify-between gap-2">
                        {here ? (
                          <span className="inline-flex items-center gap-1 text-sm text-primary"><Check size={14} /> {tx.current}</span>
                        ) : (
                          <Button isDisabled={h.status === "inactive"} size="sm" startContent={<LogIn size={14} />} variant="flat" onPress={() => switchTo(h._id)}>{tx.open}</Button>
                        )}
                        <div className="flex items-center gap-0.5">
                          {canEdit && !h.isDefault && h.status === "active" && (
                            <Tooltip content={tx.make_default}><Button isIconOnly aria-label={tx.make_default} size="sm" variant="light" onPress={() => patch(h, { isDefault: true })}><Star size={15} /></Button></Tooltip>
                          )}
                          {canEdit && !h.isDefault && (
                            <Tooltip content={h.status === "active" ? tx.deactivate : tx.activate}><Button isIconOnly aria-label={tx.deactivate} size="sm" variant="light" onPress={() => toggleActive(h)}><Power size={15} /></Button></Tooltip>
                          )}
                          {canEdit && <Tooltip content={tx.edit}><Button isIconOnly aria-label={tx.edit} size="sm" variant="light" onPress={() => openForm(h)}><Pencil size={15} /></Button></Tooltip>}
                          {can("hospital.delete") && !h.isDefault && (
                            <Tooltip content={tx.delete}><Button isIconOnly aria-label={tx.delete} size="sm" variant="light" onPress={() => remove(h)}><Trash2 size={15} /></Button></Tooltip>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}

      <Drawer isOpen={editing !== null} placement="right" size="lg" onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DrawerContent>
          {() => (
            <>
              <DrawerHeader className="border-b border-divider text-base font-semibold">{editing === "new" ? tx.add : tx.edit}</DrawerHeader>
              <DrawerBody className="gap-5 py-5 [&>*]:shrink-0">
                <Input {...field} isRequired label={tx.name} value={form.name} onValueChange={(v) => set("name", v)} />
                <Autocomplete
                  {...field}
                  allowsCustomValue
                  defaultItems={groups.map((g) => ({ key: g }))}
                  description={tx.group_hint}
                  inputValue={form.group}
                  label={tx.group}
                  onInputChange={(v) => set("group", v)}
                >
                  {(g) => <AutocompleteItem key={g.key}>{g.key}</AutocompleteItem>}
                </Autocomplete>
                <div className="grid grid-cols-2 gap-3">
                  <Input {...field} label={tx.code} value={form.code} onValueChange={(v) => set("code", v)} />
                  <Input {...field} label={tx.city} value={form.city} onValueChange={(v) => set("city", v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select {...field} label={tx.type} selectedKeys={[form.type]} onSelectionChange={(k) => set("type", Array.from(k)[0] ?? "general")}>
                    {Object.entries(tx.types).map(([k, v]) => <SelectItem key={k}>{v}</SelectItem>)}
                  </Select>
                  <Input {...field} label={tx.capacity} type="number" value={String(form.capacity)} onValueChange={(v) => set("capacity", v)} />
                </div>
                <Input {...field} label={tx.address} value={form.address} onValueChange={(v) => set("address", v)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input {...field} label={tx.phone} value={form.phone} onValueChange={(v) => set("phone", v)} />
                  <Input {...field} label={tx.email} type="email" value={form.email} onValueChange={(v) => set("email", v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input {...field} label={tx.website} value={form.website} onValueChange={(v) => set("website", v)} />
                  <Input {...field} label={tx.license} value={form.licenseNumber} onValueChange={(v) => set("licenseNumber", v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DateField label={tx.established} value={form.establishedDate} onValueChange={(v) => set("establishedDate", v)} />
                  <Input {...field} label={tx.ambulances} type="number" value={String(form.ambulanceCount)} onValueChange={(v) => set("ambulanceCount", v)} />
                </div>
                <Select {...field} isDisabled={editing !== "new" && (editing as Hospital)?.isDefault} label={tx.status} selectedKeys={[form.status]} onSelectionChange={(k) => set("status", Array.from(k)[0] ?? "active")}>
                  {Object.entries(tx.states).map(([k, v]) => <SelectItem key={k}>{v}</SelectItem>)}
                </Select>
                {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
              </DrawerBody>
              <DrawerFooter className="border-t border-divider">
                <Button variant="light" onPress={() => setEditing(null)}>{tx.cancel}</Button>
                <Button color="primary" isLoading={saving} onPress={save}>{tx.save}</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
