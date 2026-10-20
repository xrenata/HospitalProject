"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@heroui/react";
import { Check, ChevronsUpDown, Globe, Settings2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useI18n } from "@/contexts/I18nContext";

/** Brand row of the sidebar: shows the hospital you are working in and lets you switch to another one. */
export default function HospitalSwitcher({ fallback }: { fallback: string }) {
  const { language } = useI18n();
  const { hospitals, current, isAll, canAll, switchTo } = useHospital();
  const { can } = useAuth();
  const router = useRouter();
  const tr = language === "tr";

  const groups = useMemo(() => {
    const map = new Map<string, typeof hospitals>();

    hospitals.forEach((h) => {
      const key = h.group || "";

      map.set(key, [...(map.get(key) ?? []), h]);
    });

    return Array.from(map.entries()).sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));
  }, [hospitals]);

  const name = isAll ? (tr ? "Tüm hastaneler" : "All hospitals") : current?.name ?? fallback;
  const sub = isAll ? (tr ? "Yalnızca görüntüleme" : "View only") : current?.group || current?.city || "";
  const multi = hospitals.length > 1 || canAll;

  const body = (
    <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
      <span className="truncate text-sm font-semibold">{name}</span>
      {sub && <span className="truncate text-[11px] font-normal text-foreground-500">{sub}</span>}
    </span>
  );

  if (!multi) return body;

  return (
    <Dropdown placement="bottom-start">
      <DropdownTrigger>
        <button className="flex min-w-0 flex-1 items-center gap-1 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-default-100" type="button">
          {body}
          <ChevronsUpDown className="shrink-0 text-foreground-400" size={14} />
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={tr ? "Hastane seç" : "Choose hospital"}
        className="max-h-96 min-w-64 overflow-y-auto"
        onAction={(key) => {
          if (key === "manage") router.push("/dashboard/hospitals");
          else if (key !== (isAll ? "all" : current?._id)) switchTo(String(key));
        }}
      >
        {[
          ...(canAll
            ? [
                <DropdownSection key="all-section" showDivider>
                  <DropdownItem key="all" description={tr ? "Tüm hastanelerin verisini birlikte gör" : "See every hospital's data together"} endContent={isAll ? <Check size={14} /> : null} startContent={<Globe size={15} />}>
                    {tr ? "Tüm hastaneler" : "All hospitals"}
                  </DropdownItem>
                </DropdownSection>,
              ]
            : []),
          ...groups.map(([group, list]) => (
            <DropdownSection key={`g-${group}`} showDivider title={group || (tr ? "Bağımsız" : "Independent")}>
              {list.map((h) => (
                <DropdownItem
                  key={h._id}
                  description={[h.city, h.code].filter(Boolean).join(" · ") || undefined}
                  endContent={!isAll && current?._id === h._id ? <Check size={14} /> : null}
                >
                  {h.name}
                </DropdownItem>
              ))}
            </DropdownSection>
          )),
          ...(can("hospital.view")
            ? [
                <DropdownSection key="manage-section">
                  <DropdownItem key="manage" startContent={<Settings2 size={15} />}>{tr ? "Hastaneleri yönet" : "Manage hospitals"}</DropdownItem>
                </DropdownSection>,
              ]
            : []),
        ]}
      </DropdownMenu>
    </Dropdown>
  );
}
