"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, ModalContent } from "@heroui/react";
import { useRouter } from "next/navigation";
import {
  Activity, Bed, Bell, Building2, Calendar, ClipboardList, CornerDownLeft, FileText, FlaskConical, HeartPulse, Home,
  LogOut, Monitor, Moon, Package, Pill, Plus, Scissors, Search, Settings, ShieldCheck, Stethoscope, Sun, User, Users,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { patientsAPI, staffAPI } from "@/lib/api";

interface Item {
  id: string;
  title: string;
  hint?: string;
  icon: React.ReactNode;
  group: string;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  onLogout: () => void;
  onThemeChange: () => void;
  theme?: string;
}

// where you can go (needs "<resource>.view")
const PAGES: { path: string; resource?: string; nav: string; icon: React.ReactNode }[] = [
  { path: "/dashboard", nav: "dashboard", icon: <Home size={16} /> },
  { path: "/dashboard/patients", resource: "patients", nav: "patients", icon: <Users size={16} /> },
  { path: "/dashboard/appointments", resource: "appointments", nav: "appointments", icon: <Calendar size={16} /> },
  { path: "/dashboard/visits", resource: "visits", nav: "visits", icon: <ClipboardList size={16} /> },
  { path: "/dashboard/medical-records", resource: "treatments", nav: "medical_records", icon: <FileText size={16} /> },
  { path: "/dashboard/tests", resource: "tests", nav: "tests", icon: <FlaskConical size={16} /> },
  { path: "/dashboard/treatments", resource: "treatments", nav: "treatments", icon: <HeartPulse size={16} /> },
  { path: "/dashboard/prescriptions", resource: "prescriptions", nav: "prescriptions", icon: <Pill size={16} /> },
  { path: "/dashboard/surgeries", resource: "surgeries", nav: "surgeries", icon: <Scissors size={16} /> },
  { path: "/dashboard/staff", resource: "staff", nav: "staff", icon: <Stethoscope size={16} /> },
  { path: "/dashboard/departments", resource: "departments", nav: "departments", icon: <Building2 size={16} /> },
  { path: "/dashboard/rooms", resource: "rooms", nav: "rooms", icon: <Bed size={16} /> },
  { path: "/dashboard/medications", resource: "medications", nav: "medications", icon: <Package size={16} /> },
  { path: "/dashboard/inventory", resource: "medications", nav: "inventory", icon: <Package size={16} /> },
  { path: "/dashboard/alerts", resource: "notifications", nav: "alerts", icon: <Bell size={16} /> },
  { path: "/dashboard/analytics", resource: "analytics", nav: "analytics", icon: <Activity size={16} /> },
  { path: "/dashboard/roles", resource: "roles", nav: "roles", icon: <ShieldCheck size={16} /> },
  { path: "/dashboard/settings", nav: "settings", icon: <Settings size={16} /> },
];

export default function CommandPalette({ isOpen, onClose, onLogout, onThemeChange, theme }: CommandPaletteProps) {
  const { t } = useI18n();
  const { can } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [found, setFound] = useState<Item[]>([]);
  const [searching, setSearching] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const go = (path: string) => () => router.push(path);

  // static commands, limited to what this person may open
  const commands = useMemo<Item[]>(() => {
    const pages: Item[] = PAGES.filter((p) => !p.resource || can(`${p.resource}.view`)).map((p) => ({
      id: `page-${p.path}`, title: t(`navigation.${p.nav}`), icon: p.icon, group: t("command_palette.categories.navigation"), run: go(p.path),
    }));
    const actions: Item[] = [];

    if (can("patients.create")) actions.push({ id: "new-patient", title: t("home.add_patient"), icon: <Plus size={16} />, group: t("command_palette.categories.actions"), run: go("/dashboard/patients?action=new") });
    if (can("appointments.create")) actions.push({ id: "new-appointment", title: t("home.schedule_appointment"), icon: <Plus size={16} />, group: t("command_palette.categories.actions"), run: go("/dashboard/appointments?action=new") });
    actions.push({
      id: "theme", title: theme === "dark" ? t("account.theme_light") : t("account.theme_dark"),
      icon: theme === "dark" ? <Sun size={16} /> : theme === "light" ? <Moon size={16} /> : <Monitor size={16} />,
      group: t("command_palette.categories.actions"), run: onThemeChange,
    });
    actions.push({ id: "logout", title: t("auth.logout"), icon: <LogOut size={16} />, group: t("command_palette.categories.actions"), run: onLogout });

    return [...actions, ...pages];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, can, theme]);

  // live results from the server once there are at least two characters
  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) { setFound([]); setSearching(false); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const patientHits: Item[] = [];
      const staffHits: Item[] = [];

      await Promise.all([
        can("patients.view")
          ? patientsAPI.getAll({ search: q, limit: 5 }).then((r) => {
              (r.data.patients ?? []).forEach((p: any) => {
                const id = p.patient_id || p._id;
                const name = `${p.first_name ?? p.firstName ?? ""} ${p.last_name ?? p.lastName ?? ""}`.trim();

                patientHits.push({ id: `p-${id}`, title: name, hint: p.tc_number || p.tcNumber, icon: <User size={16} />, group: t("navigation.patients"), run: go(`/dashboard/patients/${id}`) });
              });
            }).catch(() => {})
          : Promise.resolve(),
        can("staff.view")
          ? staffAPI.getAll({ search: q, limit: 5 }).then((r) => {
              (r.data.data ?? []).forEach((s: any) => {
                staffHits.push({ id: `s-${s._id}`, title: s.name, hint: s.role, icon: <Stethoscope size={16} />, group: t("navigation.staff"), run: go(`/dashboard/staff?q=${encodeURIComponent(s.name)}`) });
              });
            }).catch(() => {})
          : Promise.resolve(),
      ]);
      if (!cancelled) { setFound([...patientHits, ...staffHits]); setSearching(false); }
    }, 250);

    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? commands.filter((c) => c.title.toLowerCase().includes(q)) : commands;

    return [...found, ...matched];
  }, [commands, found, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();

    items.forEach((i) => map.set(i.group, [...(map.get(i.group) ?? []), i]));

    return Array.from(map.entries());
  }, [items]);

  useEffect(() => setIndex(0), [query, found.length]);
  useEffect(() => {
    if (!isOpen) { setQuery(""); setFound([]); }
  }, [isOpen]);
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const choose = (item?: Item) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => (i + 1) % Math.max(items.length, 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => (i - 1 + items.length) % Math.max(items.length, 1)); }
    if (e.key === "Enter") { e.preventDefault(); choose(items[index]); }
  };

  let position = -1;

  return (
    <Modal
      classNames={{ base: "mt-[12vh]", wrapper: "items-start", backdrop: "bg-black/40" }}
      hideCloseButton
      isOpen={isOpen}
      placement="top"
      size="xl"
      onClose={onClose}
    >
      <ModalContent>
        <div className="flex items-center gap-3 border-b border-divider px-4">
          <Search className="shrink-0 text-foreground-400" size={18} />
          <input
            autoFocus
            aria-label={t("command_palette.title")}
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-foreground-400"
            placeholder={t("command_palette.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {searching && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-default-300 border-t-primary" />}
        </div>

        <ul ref={listRef} className="max-h-[22rem] overflow-y-auto p-2">
          {items.length === 0 && (
            <li className="px-4 py-10 text-center">
              <p className="text-sm font-medium">{t("command_palette.no_results")}</p>
              <p className="mt-1 text-xs text-foreground-500">{t("command_palette.try_different")}</p>
            </li>
          )}
          {groups.map(([group, list]) => (
            <li key={group}>
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-foreground-400">{group}</p>
              <ul>
                {list.map((item) => {
                  position += 1;
                  const active = position === index;
                  const here = position;

                  return (
                    <li key={item.id}>
                      <button
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${active ? "bg-default-100" : "hover:bg-default-50"}`}
                        data-active={active}
                        type="button"
                        onClick={() => choose(item)}
                        onMouseMove={() => setIndex(here)}
                      >
                        <span className={active ? "text-primary" : "text-foreground-400"}>{item.icon}</span>
                        <span className="min-w-0 flex-1 truncate">{item.title}</span>
                        {item.hint && <span className="truncate text-xs text-foreground-400">{item.hint}</span>}
                        {active && <CornerDownLeft className="shrink-0 text-foreground-400" size={14} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 border-t border-divider px-4 py-2 text-[11px] text-foreground-400">
          <span>↑↓ {t("command_palette.shortcuts.navigate")}</span>
          <span>↵ {t("command_palette.shortcuts.select")}</span>
          <span>Esc {t("command_palette.shortcuts.close")}</span>
        </div>
      </ModalContent>
    </Modal>
  );
}
