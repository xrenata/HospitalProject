"use client";

import React from "react";
import { Check, Plus, X } from "lucide-react";

import { useI18n } from "@/contexts/I18nContext";

export interface Catalog {
  groups: { group: string; resources: { key: string; actions: string[] }[] }[];
  all: string[];
}

const BASIC = ["view", "create", "edit", "delete"];

type CellState = "role" | "extra" | "blocked" | "none";

/** One permission cell. Defined at module level so it keeps its identity between renders (a remount would eat clicks). */
function Cell({ perm, state, locked, label, onToggle }: { perm: string; state: CellState; locked: boolean; label: string; onToggle: (perm: string) => void }) {
  let cls = "border border-dashed border-default-300 text-transparent hover:border-primary";
  let icon: React.ReactNode = <Check size={13} />;

  if (state === "role") cls = "bg-primary text-primary-foreground";
  else if (state === "extra") { cls = "border-2 border-success bg-success/10 text-success"; icon = <Plus size={13} />; }
  else if (state === "blocked") { cls = "border-2 border-dashed border-danger/60 bg-danger/5 text-danger"; icon = <X size={13} />; }

  return (
    <button
      aria-label={label}
      aria-pressed={state === "role" || state === "extra"}
      className={`mx-auto grid h-6 w-6 place-items-center rounded-md transition-colors ${cls} ${locked ? "cursor-default opacity-70" : ""}`}
      disabled={locked}
      title={label}
      type="button"
      onClick={() => onToggle(perm)}
    >
      {icon}
    </button>
  );
}

/**
 * Per-person access on top of a role. Every cell is one permission:
 *   filled blue  = allowed by the role          dashed red  = the role allows it, blocked for this person
 *   green +      = extra, only for this person   empty       = not allowed
 * Clicking a cell grants or blocks it for this person only; the role itself is not touched.
 */
export default function AccessEditor({
  catalog,
  rolePermissions,
  extra,
  denied,
  onChange,
  disabled = false,
}: {
  catalog: Catalog;
  rolePermissions: string[];
  extra: string[];
  denied: string[];
  onChange: (next: { extra: string[]; denied: string[] }) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const all = rolePermissions.includes("*");
  const role = new Set(rolePermissions);
  const ex = new Set(extra);
  const de = new Set(denied);

  const inRole = (p: string) => all || role.has(p);
  const allowed = (p: string) => (inRole(p) ? !de.has(p) : ex.has(p));

  const setOne = (p: string, on: boolean, e: Set<string>, d: Set<string>) => {
    if (on) (inRole(p) ? d.delete(p) : e.add(p));
    else (inRole(p) ? d.add(p) : e.delete(p));
  };

  const toggle = (perm: string) => {
    if (disabled || all) return;
    const e = new Set(ex);
    const d = new Set(de);
    const on = !allowed(perm);
    const [res, action] = perm.split(".");

    setOne(perm, on, e, d);
    if (on && action !== "view" && catalog.all.includes(`${res}.view`)) setOne(`${res}.view`, true, e, d); // can't change what you can't see
    if (!on && action === "view") BASIC.forEach((a) => catalog.all.includes(`${res}.${a}`) && setOne(`${res}.${a}`, false, e, d));
    onChange({ extra: Array.from(e), denied: Array.from(d) });
  };

  const cellFor = (perm: string) => {
    const [res, action] = perm.split(".");
    const on = allowed(perm);
    const state: CellState = on ? (inRole(perm) ? "role" : "extra") : inRole(perm) ? "blocked" : "none";

    return <Cell key={perm} label={`${t(`perm.resource.${res}`)} · ${t(`perm.action.${action}`)}`} locked={disabled || all} perm={perm} state={state} onToggle={toggle} />;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-foreground-500">
        <span className="flex items-center gap-1.5"><span className="grid h-4 w-4 place-items-center rounded bg-primary text-primary-foreground"><Check size={10} /></span>{t("team.inherits")}</span>
        <span className="flex items-center gap-1.5"><span className="grid h-4 w-4 place-items-center rounded border-2 border-success bg-success/10 text-success"><Plus size={10} /></span>{t("team.allowed_extra")}</span>
        <span className="flex items-center gap-1.5"><span className="grid h-4 w-4 place-items-center rounded border-2 border-dashed border-danger/60 bg-danger/5 text-danger"><X size={10} /></span>{t("team.blocked")}</span>
      </div>

      {catalog.groups.map((g) => (
        <section key={g.group}>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-400">{t(`perm.group.${g.group}`)}</h4>
          <div className="overflow-x-auto rounded-xl border border-divider">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="border-b border-divider bg-default-50 text-[11px] text-foreground-500">
                  <th className="px-3 py-1.5 text-left font-medium" />
                  {BASIC.map((a) => <th key={a} className="w-14 px-1 py-1.5 text-center font-medium">{t(`perm.action.${a}`)}</th>)}
                  <th className="px-3 py-1.5 text-left font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {g.resources.map((r) => (
                  <tr key={r.key}>
                    <td className="px-3 py-1.5 text-[13px] font-medium">{t(`perm.resource.${r.key}`)}</td>
                    {BASIC.map((a) => (
                      <td key={a} className="px-1 py-1.5 text-center">
                        {r.actions.includes(a) ? cellFor(`${r.key}.${a}`) : <span className="text-foreground-300">–</span>}
                      </td>
                    ))}
                    <td className="px-3 py-1.5">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {r.actions.filter((a) => !BASIC.includes(a)).map((a) => (
                          <span key={a} className="flex items-center gap-1.5 text-xs text-foreground-500">
                            {cellFor(`${r.key}.${a}`)}
                            {t(`perm.action.${a}`)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
