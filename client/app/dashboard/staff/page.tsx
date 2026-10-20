"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Avatar, Button, Card, CardBody, Checkbox, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, Dropdown,
  DropdownItem, DropdownMenu, DropdownTrigger, Input, Pagination, Select, SelectItem, Skeleton, Switch, Tab, Tabs,
} from "@heroui/react";
import { KeyRound, MoreHorizontal, Plus, Search, ShieldCheck, UserCog, X } from "lucide-react";

import AccessEditor, { type Catalog } from "@/components/AccessEditor";
import { Chip } from "@/components/Chip";
import DataSummary from "@/components/DataSummary";
import { useConfirm } from "@/components/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { accessAPI, departmentsAPI, staffAPI } from "@/lib/api";
import { roleDescription, roleName } from "@/lib/roles";
import { relativeTime } from "@/lib/utils";

import DateField from '@/components/DateField';
interface Role {
  _id: string; key: string; name: string; description: string; color: string; permissions: string[]; isSystem: boolean; memberCount: number;
}
interface Person {
  _id: string;
  name: string;
  role?: string; // job title
  email?: string;
  phone?: string;
  specialization?: string;
  status?: string;
  salary?: number;
  hire_date?: string;
  username?: string;
  lastLogin?: string;
  department_id?: { _id: string; name: string } | string | null;
  roleId?: { _id: string; key: string; name: string; color: string } | null;
  extraPermissions?: string[];
  deniedPermissions?: string[];
}

const DOT: Record<string, string> = {
  default: "bg-default-400", primary: "bg-primary", secondary: "bg-secondary", success: "bg-success", warning: "bg-warning", danger: "bg-danger",
};
const PAGE_SIZES = ["10", "25", "50", "100"];
const SORTS = ["name", "-name", "newest", "oldest", "last_login"];
const SORT_KEY: Record<string, string> = { name: "sort_name", "-name": "sort_name_desc", newest: "sort_newest", oldest: "sort_oldest", last_login: "sort_login" };

const emptyForm = {
  name: "", role: "", email: "", phone: "", specialization: "", hire_date: "", salary: "", department_id: "", status: "active",
  username: "", password: "", roleId: "",
};

const randomPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));

  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

export default function StaffPage() {
  const { t, language } = useI18n();
  const { can, user } = useAuth();
  const confirm = useConfirm();
  const router = useRouter();
  const params = useSearchParams();

  // ---- filters live in the URL so a view can be shared and the back button works ---------------------------------
  const [page, setPage] = useState(Number(params.get("page")) || 1);
  const [limit, setLimit] = useState(params.get("limit") || "25");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [accessRole, setAccessRole] = useState(params.get("accessRole") ?? "all");
  const [department, setDepartment] = useState(params.get("department") ?? "all");
  const [status, setStatus] = useState(params.get("status") ?? "all");
  const [sort, setSort] = useState(params.get("sort") ?? "name");
  const [debouncedQ, setDebouncedQ] = useState(q);

  const [rows, setRows] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState("");

  const [roles, setRoles] = useState<Role[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([]);

  // drawer
  const [drawer, setDrawer] = useState<{ mode: "create" | "edit"; person?: Person; tab?: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [accessRoleId, setAccessRoleId] = useState("");
  const [extra, setExtra] = useState<string[]>([]);
  const [denied, setDenied] = useState<string[]>([]);
  const [accessDirty, setAccessDirty] = useState(false);
  const [history, setHistory] = useState<any[] | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const canCreate = can("staff.create");
  const canEdit = can("staff.edit");
  const canDelete = can("staff.delete");
  const canAssign = can("staff.assign_roles");
  const canSalary = can("staff.salary");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);

    return () => clearTimeout(id);
  }, [q]);

  // reflect filters in the address bar without adding history entries
  useEffect(() => {
    const next = new URLSearchParams();

    if (page > 1) next.set("page", String(page));
    if (limit !== "25") next.set("limit", limit);
    if (debouncedQ) next.set("q", debouncedQ);
    if (accessRole !== "all") next.set("accessRole", accessRole);
    if (department !== "all") next.set("department", department);
    if (status !== "all") next.set("status", status);
    if (sort !== "name") next.set("sort", sort);
    const qs = next.toString();

    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [page, limit, debouncedQ, accessRole, department, status, sort]);

  // any filter change goes back to page 1
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setPage(1);
  }, [debouncedQ, accessRole, department, status, sort, limit]);

  useEffect(() => {
    accessAPI.roles().then((r) => setRoles(r.data)).catch(() => {});
    accessAPI.catalog().then((r) => setCatalog(r.data)).catch(() => {});
    departmentsAPI.getAll({ limit: 100 }).then((r) => setDepartments(r.data.departments ?? r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    staffAPI
      .getAll({
        page, limit: Number(limit), search: debouncedQ || undefined, sort,
        accessRole: accessRole !== "all" ? accessRole : undefined,
        department_id: department !== "all" ? department : undefined,
        status: status !== "all" ? status : undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.data ?? []);
        setTotal(res.data.pagination?.total ?? 0);
      })
      .catch(() => !cancelled && toast.error(t("common.error") || "Error"))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [page, limit, debouncedQ, accessRole, department, status, sort, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => setReload((n) => n + 1);
  const filtersActive = !!(debouncedQ || accessRole !== "all" || department !== "all" || status !== "all");
  const clearFilters = () => { setQ(""); setAccessRole("all"); setDepartment("all"); setStatus("all"); };

  const totalPages = Math.max(1, Math.ceil(total / Number(limit)));
  const from = total === 0 ? 0 : (page - 1) * Number(limit) + 1;
  const to = Math.min(page * Number(limit), total);
  const deptName = (p: Person) => (typeof p.department_id === "object" && p.department_id ? p.department_id.name : "");
  const rname = (r?: { key: string; name: string; description?: string } | null) => roleName(t, r as any);

  // ---- selection ---------------------------------------------------------------------------------------------------
  const pageIds = rows.map((r) => r._id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggleRow = (id: string, on: boolean) => setSelected((prev) => { const n = new Set(prev); on ? n.add(id) : n.delete(id); return n; });
  const togglePage = (on: boolean) => setSelected((prev) => { const n = new Set(prev); pageIds.forEach((id) => (on ? n.add(id) : n.delete(id))); return n; });

  const applyBulk = async () => {
    if (!bulkRole || !selected.size) return;
    try {
      const { data } = await accessAPI.bulkAssign(Array.from(selected), bulkRole);

      toast.success(t("team.assigned").replace("{n}", String(data.updated)));
      if (data.skipped?.length) toast.error(`${t("team.skipped").replace("{n}", String(data.skipped.length))}: ${data.skipped[0].reason}`);
      setSelected(new Set());
      setBulkRole("");
      refresh();
      accessAPI.roles().then((r) => setRoles(r.data));
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Error");
    }
  };

  // ---- drawer --------------------------------------------------------------------------------------------------------
  const openCreate = () => {
    setForm({ ...emptyForm, roleId: roles.find((r) => r.key === "nurse")?._id ?? "" });
    setAccessRoleId("");
    setExtra([]); setDenied([]); setAccessDirty(false); setHistory(null); setNewPassword("");
    setDrawer({ mode: "create" });
  };

  const openPerson = async (person: Person, tab = "details") => {
    setForm({
      name: person.name ?? "", role: person.role ?? "", email: person.email ?? "", phone: person.phone ?? "",
      specialization: person.specialization ?? "", hire_date: person.hire_date ? person.hire_date.slice(0, 10) : "",
      salary: person.salary !== undefined ? String(person.salary) : "",
      department_id: typeof person.department_id === "object" && person.department_id ? person.department_id._id : "",
      status: person.status ?? "active", username: person.username ?? "", password: "", roleId: "",
    });
    setAccessRoleId(person.roleId?._id ?? "");
    setExtra(person.extraPermissions ?? []);
    setDenied(person.deniedPermissions ?? []);
    setAccessDirty(false);
    setHistory(null);
    setNewPassword("");
    setDrawer({ mode: "edit", person, tab });
  };

  const field = (key: keyof typeof emptyForm) => ({
    value: form[key] as string,
    onValueChange: (v: string) => setForm((f) => ({ ...f, [key]: v })),
  });

  const savePerson = async () => {
    if (!form.name.trim()) return toast.error(t("team.name"));
    setSaving(true);
    try {
      const body: any = {
        name: form.name.trim(), role: form.role, email: form.email, phone: form.phone, specialization: form.specialization,
        hire_date: form.hire_date || undefined, department_id: form.department_id || undefined,
      };
      if (canSalary && form.salary !== "") body.salary = Number(form.salary);

      if (drawer?.mode === "create") {
        if (form.username || form.password) { body.username = form.username; body.password = form.password; body.roleId = form.roleId; }
        else if (canAssign && form.roleId) body.roleId = form.roleId;
        await staffAPI.create(body);
        toast.success(t("team.created"));
        setDrawer(null);
      } else if (drawer?.person) {
        body.status = form.status;
        await staffAPI.update(drawer.person._id, body);
        toast.success(t("team.updated"));
        setDrawer(null);
      }
      refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? error?.response?.data?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  };

  const saveAccess = async () => {
    if (!drawer?.person || !accessRoleId) return;
    setSaving(true);
    try {
      await accessAPI.setStaffAccess(drawer.person._id, { roleId: accessRoleId, extraPermissions: extra, deniedPermissions: denied });
      toast.success(t("team.access_saved"));
      setAccessDirty(false);
      setHistory(null);
      refresh();
      accessAPI.roles().then((r) => setRoles(r.data));
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!drawer?.person) return;
    try {
      await staffAPI.update(drawer.person._id, { password: newPassword });
      toast.success(t("team.password_reset"));
      setNewPassword("");
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Error");
    }
  };

  const setActive = async (person: Person, active: boolean) => {
    if (!active && !(await confirm(t("team.deactivate_confirm").replace("{name}", person.name), { confirmLabel: t("team.deactivate") }))) return;
    try {
      await staffAPI.update(person._id, { status: active ? "active" : "inactive" });
      toast.success(t("team.updated"));
      refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Error");
    }
  };

  const remove = async (person: Person) => {
    if (!(await confirm(t("team.delete_confirm").replace("{name}", person.name)))) return;
    try {
      await staffAPI.delete(person._id);
      toast.success(t("team.deleted"));
      setSelected((prev) => { const n = new Set(prev); n.delete(person._id); return n; });
      refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Error");
    }
  };

  const loadHistory = () => {
    if (drawer?.person && !history) accessAPI.audit({ targetType: "staff", targetId: drawer.person._id, limit: 20 }).then((r) => setHistory(r.data.data)).catch(() => setHistory([]));
  };

  const pickedRole = roles.find((r) => r._id === accessRoleId);
  const isSelf = drawer?.person?._id === String(user?.id);
  const accessLocked = !canAssign || (isSelf && !user?.isAdmin);
  const effectiveCount = useMemo(() => {
    if (!catalog || !pickedRole) return 0;
    if (pickedRole.permissions.includes("*")) return catalog.all.length;
    const set = new Set(pickedRole.permissions);

    extra.forEach((p) => set.add(p));
    denied.forEach((p) => set.delete(p));

    return set.size;
  }, [catalog, pickedRole, extra, denied]);

  // ---- render ---------------------------------------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-[88rem] space-y-4 pb-24 sm:space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("team.title")}</h1>
          <p className="mt-1 text-sm text-foreground-500">{t("team.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {can("roles.view") && (
            <Button startContent={<ShieldCheck size={16} />} variant="bordered" onPress={() => router.push("/dashboard/roles")}>
              {t("navigation.roles")}
            </Button>
          )}
          {canCreate && (
            <Button color="primary" startContent={<Plus size={16} />} onPress={openCreate}>{t("team.add")}</Button>
          )}
        </div>
      </div>

      <DataSummary entity="staff" loading={loading && rows.length === 0} />

      {/* Toolbar */}
      <Card className="w-full">
        <CardBody className="gap-3 p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
            <Input
              aria-label={t("team.search")}
              isClearable
              placeholder={t("team.search")}
              startContent={<Search className="text-foreground-400" size={16} />}
              value={q}
              onClear={() => setQ("")}
              onValueChange={setQ}
            />
            <Select aria-label={t("team.access")} disallowEmptySelection selectedKeys={[accessRole]} onSelectionChange={(k) => setAccessRole(String(Array.from(k)[0]))}>
              {[<SelectItem key="all">{t("team.all_access")}</SelectItem>, ...roles.map((r) => <SelectItem key={r._id}>{rname(r)}</SelectItem>)]}
            </Select>
            <Select aria-label={t("team.department")} disallowEmptySelection selectedKeys={[department]} onSelectionChange={(k) => setDepartment(String(Array.from(k)[0]))}>
              {[<SelectItem key="all">{t("team.all_departments")}</SelectItem>, ...departments.map((d) => <SelectItem key={d._id}>{d.name}</SelectItem>)]}
            </Select>
            <Select aria-label={t("team.status")} disallowEmptySelection selectedKeys={[status]} onSelectionChange={(k) => setStatus(String(Array.from(k)[0]))}>
              <SelectItem key="all">{t("team.all_status")}</SelectItem>
              <SelectItem key="active">{t("team.active")}</SelectItem>
              <SelectItem key="inactive">{t("team.inactive")}</SelectItem>
            </Select>
            <Select aria-label={t("team.sort")} disallowEmptySelection selectedKeys={[sort]} onSelectionChange={(k) => setSort(String(Array.from(k)[0]))}>
              {SORTS.map((s) => <SelectItem key={s}>{t(`team.${SORT_KEY[s]}`)}</SelectItem>)}
            </Select>
          </div>
          {filtersActive && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-500">{t("team.results").replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(total))}</span>
              <button className="text-primary hover:underline" type="button" onClick={clearFilters}>{t("team.reset_filters")}</button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-divider bg-content1 px-4 py-3 shadow-large">
          <span className="text-sm font-medium">{t("team.selected").replace("{n}", String(selected.size))}</span>
          {canAssign && (
            <>
              <Select
                aria-label={t("team.assign_role")}
                className="w-56"
                placeholder={t("team.assign_role")}
                selectedKeys={bulkRole ? [bulkRole] : []}
                size="sm"
                onSelectionChange={(k) => setBulkRole(String(Array.from(k)[0] ?? ""))}
              >
                {roles.filter((r) => user?.isAdmin || !r.permissions.includes("*")).map((r) => <SelectItem key={r._id}>{rname(r)}</SelectItem>)}
              </Select>
              <Button color="primary" isDisabled={!bulkRole} size="sm" onPress={applyBulk}>{t("team.apply")}</Button>
            </>
          )}
          <Button size="sm" startContent={<X size={14} />} variant="light" onPress={() => setSelected(new Set())}>{t("team.clear_selection")}</Button>
        </div>
      )}

      {/* Table */}
      <Card className="w-full">
        <CardBody className="p-0">
          <div className={`overflow-x-auto transition-opacity ${loading && rows.length ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-divider text-xs text-foreground-500">
                  <th className="w-10 px-4 py-3">
                    <Checkbox aria-label={t("team.select_page")} isSelected={allOnPage} size="sm" onValueChange={togglePage} />
                  </th>
                  <th className="px-3 py-3 font-medium">{t("team.person")}</th>
                  <th className="px-3 py-3 font-medium">{t("team.job_title")}</th>
                  <th className="px-3 py-3 font-medium">{t("team.access")}</th>
                  <th className="px-3 py-3 font-medium">{t("team.department")}</th>
                  <th className="px-3 py-3 font-medium">{t("team.status")}</th>
                  <th className="px-3 py-3 font-medium">{t("team.last_login")}</th>
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {loading && rows.length === 0
                  ? Array.from({ length: 8 }, (_, i) => (
                      <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-10 w-full rounded-lg" /></td></tr>
                    ))
                  : rows.map((p) => {
                      const overrides = (p.extraPermissions?.length ?? 0) + (p.deniedPermissions?.length ?? 0);

                      return (
                        <tr key={p._id} className="cursor-pointer hover:bg-default-50" onClick={() => openPerson(p)}>
                          <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <Checkbox aria-label={p.name} isSelected={selected.has(p._id)} size="sm" onValueChange={(on) => toggleRow(p._id, on)} />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 shrink-0 text-xs" name={p.name} />
                              <div className="min-w-0">
                                <p className="truncate font-medium">{p.name}</p>
                                <p className="truncate text-xs text-foreground-500">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-foreground-600">{p.role || "—"}</td>
                          <td className="px-3 py-2.5">
                            {p.roleId ? (
                              <span className="inline-flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${DOT[p.roleId.color] ?? DOT.default}`} />
                                <span className="font-medium">{rname(p.roleId)}</span>
                                {overrides > 0 && <span className="rounded bg-default-100 px-1.5 py-0.5 text-[11px] text-foreground-500" title={t("team.extra")}>±{overrides}</span>}
                              </span>
                            ) : "—"}
                            {!p.username && <p className="text-[11px] text-foreground-400">{t("team.no_account")}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-foreground-600">{deptName(p) || "—"}</td>
                          <td className="px-3 py-2.5"><Chip color={p.status === "inactive" ? "default" : "success"} size="sm">{p.status ?? "active"}</Chip></td>
                          <td className="px-3 py-2.5 text-xs text-foreground-500">{p.lastLogin ? relativeTime(p.lastLogin, language) : t("team.never")}</td>
                          <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <Dropdown placement="bottom-end">
                              <DropdownTrigger>
                                <Button isIconOnly aria-label={t("team.actions")} size="sm" variant="light"><MoreHorizontal size={16} /></Button>
                              </DropdownTrigger>
                              <DropdownMenu aria-label={t("team.actions")} disabledKeys={[...(!canAssign ? ["access"] : []), ...(!canEdit ? ["edit", "toggle"] : []), ...(!canDelete ? ["delete"] : [])]}>
                                <DropdownItem key="access" startContent={<UserCog size={15} />} onPress={() => openPerson(p, "access")}>{t("team.manage_access")}</DropdownItem>
                                <DropdownItem key="edit" onPress={() => openPerson(p)}>{t("team.edit_profile")}</DropdownItem>
                                <DropdownItem key="toggle" onPress={() => setActive(p, p.status === "inactive")}>{p.status === "inactive" ? t("team.activate") : t("team.deactivate")}</DropdownItem>
                                <DropdownItem key="delete" className="text-danger" color="danger" onPress={() => remove(p)}>{t("team.delete")}</DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
            {!loading && rows.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-sm text-foreground-500">{t("team.no_results")}</p>
                {filtersActive && <Button size="sm" variant="bordered" onPress={clearFilters}>{t("team.reset_filters")}</Button>}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-divider px-4 py-3 sm:flex-row">
            <div className="flex items-center gap-3 text-sm text-foreground-500">
              <span>{t("team.results").replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(total))}</span>
              <Select aria-label={t("team.per_page")} className="w-24" disallowEmptySelection selectedKeys={[limit]} size="sm" onSelectionChange={(k) => setLimit(String(Array.from(k)[0]))}>
                {PAGE_SIZES.map((s) => <SelectItem key={s}>{s}</SelectItem>)}
              </Select>
            </div>
            {totalPages > 1 && <Pagination isCompact showControls page={page} total={totalPages} onChange={setPage} />}
          </div>
        </CardBody>
      </Card>

      {/* Drawer */}
      <Drawer isOpen={!!drawer} placement="right" scrollBehavior="inside" size="3xl" onOpenChange={(open) => !open && setDrawer(null)}>
        <DrawerContent>
          {() => (
            <>
              <DrawerHeader className="flex items-center gap-3 border-b border-divider">
                {drawer?.person ? (
                  <>
                    <Avatar className="h-10 w-10 text-sm" name={drawer.person.name} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{drawer.person.name}</p>
                      <p className="truncate text-xs font-normal text-foreground-500">{drawer.person.role} {drawer.person.email ? `· ${drawer.person.email}` : ""}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-base font-semibold">{t("team.add")}</p>
                )}
              </DrawerHeader>
              <DrawerBody className="py-5">
                {drawer?.mode === "create" ? (
                  PersonForm()
                ) : (
                  <Tabs
                    aria-label="Staff"
                    classNames={{ tabList: "gap-6 p-0 border-b border-divider w-full", cursor: "w-full bg-primary", tab: "px-0 h-11", panel: "px-0 pt-5" }}
                    defaultSelectedKey={drawer?.tab ?? "details"}
                    variant="underlined"
                    onSelectionChange={(k) => k === "activity" && loadHistory()}
                  >
                    <Tab key="details" title={t("team.tab_details")}>{PersonForm()}</Tab>
                    <Tab key="access" title={t("team.tab_access")}>
                      <div className="space-y-6">
                        {accessLocked && <p className="rounded-xl bg-default-100 px-4 py-3 text-sm text-foreground-500">{isSelf && !user?.isAdmin ? t("team.cannot_self") : t("team.cannot_assign")}</p>}
                        <div>
                          <Select
                            description={pickedRole ? roleDescription(t, pickedRole) : t("team.role_hint")}
                            disallowEmptySelection
                            isDisabled={accessLocked}
                            label={t("team.role")}
                            labelPlacement="outside"
                            placeholder={t("team.pick_role")}
                            selectedKeys={accessRoleId ? [accessRoleId] : []}
                            variant="bordered"
                            onSelectionChange={(k) => { setAccessRoleId(String(Array.from(k)[0] ?? "")); setAccessDirty(true); }}
                          >
                            {roles.filter((r) => user?.isAdmin || !r.permissions.includes("*") || r._id === accessRoleId).map((r) => <SelectItem key={r._id}>{rname(r)}</SelectItem>)}
                          </Select>
                        </div>

                        {pickedRole && catalog && (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-divider px-4 py-3">
                              <p className="text-sm">
                                <span className="font-semibold">{t("team.effective")}: </span>
                                {pickedRole.permissions.includes("*") ? t("team.full_access") : t("team.effective_count").replace("{n}", String(effectiveCount))}
                              </p>
                              {(extra.length > 0 || denied.length > 0) ? (
                                <button className="text-xs text-primary hover:underline" disabled={accessLocked} type="button" onClick={() => { setExtra([]); setDenied([]); setAccessDirty(true); }}>
                                  {t("team.reset_overrides")} (+{extra.length} / −{denied.length})
                                </button>
                              ) : (
                                <span className="text-xs text-foreground-400">{t("team.overrides_none")}</span>
                              )}
                            </div>
                            <AccessEditor
                              catalog={catalog}
                              denied={denied}
                              disabled={accessLocked}
                              extra={extra}
                              rolePermissions={pickedRole.permissions}
                              onChange={(n) => { setExtra(n.extra); setDenied(n.denied); setAccessDirty(true); }}
                            />
                          </>
                        )}
                      </div>
                    </Tab>
                    <Tab key="activity" title={t("team.tab_activity")}>
                      {!history ? <Skeleton className="h-32 w-full rounded-xl" /> : history.length === 0 ? (
                        <p className="py-10 text-center text-sm text-foreground-400">{t("roles.no_activity")}</p>
                      ) : (
                        <ul className="divide-y divide-divider rounded-xl border border-divider">
                          {history.map((a) => (
                            <li key={a._id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                              <p><span className="font-medium">{a.actorName}</span> <span className="text-foreground-500">{t(`roles.audit_${a.action.replace(".", "_")}`)}</span></p>
                              <span className="shrink-0 text-xs text-foreground-400">{relativeTime(a.createdAt, language)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Tab>
                  </Tabs>
                )}
              </DrawerBody>
              <DrawerFooter className="border-t border-divider">
                <Button variant="light" onPress={() => setDrawer(null)}>{t("team.close")}</Button>
                {accessDirty && drawer?.mode === "edit" && !accessLocked && (
                  <Button color="primary" isLoading={saving} startContent={<ShieldCheck size={15} />} onPress={saveAccess}>{t("team.save_access")}</Button>
                )}
                {(drawer?.mode === "create" || (canEdit && drawer?.mode === "edit")) && (
                  <Button color="primary" isLoading={saving} variant={accessDirty ? "flat" : "solid"} onPress={savePerson}>{t("team.save")}</Button>
                )}
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );

  // the details form, shared by "add" and "edit"
  function PersonForm() {
    const creating = drawer?.mode === "create";
    const readOnly = !creating && !canEdit;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input isReadOnly={readOnly} label={t("team.name")} labelPlacement="outside" placeholder=" " variant="bordered" {...field("name")} />
          <Input isReadOnly={readOnly} label={t("team.job_title")} labelPlacement="outside" placeholder=" " variant="bordered" {...field("role")} />
          <Input isReadOnly={readOnly} label={t("team.email")} labelPlacement="outside" placeholder=" " type="email" variant="bordered" {...field("email")} />
          <Input isReadOnly={readOnly} label={t("team.phone")} labelPlacement="outside" placeholder=" " variant="bordered" {...field("phone")} />
          <Select
            isDisabled={readOnly}
            label={t("team.department")}
            labelPlacement="outside"
            placeholder=" "
            selectedKeys={form.department_id ? [form.department_id] : []}
            variant="bordered"
            onSelectionChange={(k) => setForm((f) => ({ ...f, department_id: String(Array.from(k)[0] ?? "") }))}
          >
            {departments.map((d) => <SelectItem key={d._id}>{d.name}</SelectItem>)}
          </Select>
          <Input isReadOnly={readOnly} label={t("team.specialization")} labelPlacement="outside" placeholder=" " variant="bordered" {...field("specialization")} />
          <DateField isReadOnly={readOnly} label={t("team.hire_date")}  {...field("hire_date")} />
          {canSalary ? (
            <Input isReadOnly={readOnly} label={t("team.salary")} labelPlacement="outside" placeholder=" " type="number" variant="bordered" {...field("salary")} />
          ) : (
            <div>
              <p className="mb-1.5 text-sm">{t("team.salary")}</p>
              <p className="flex h-10 items-center rounded-xl border border-divider px-3 text-sm text-foreground-400">{t("team.salary_hidden")}</p>
            </div>
          )}
        </div>

        {!creating && canEdit && (
          <div className="flex items-center justify-between rounded-xl border border-divider px-4 py-3">
            <div>
              <p className="text-sm font-medium">{t("team.active")}</p>
              <p className="text-xs text-foreground-500">{t("team.deactivate_confirm").replace("{name}", form.name)}</p>
            </div>
            <Switch isSelected={form.status !== "inactive"} onValueChange={(on) => setForm((f) => ({ ...f, status: on ? "active" : "inactive" }))} />
          </div>
        )}

        {creating && canAssign && (
          <div className="space-y-4 rounded-xl border border-divider p-4">
            <div>
              <p className="text-sm font-semibold">{t("team.account")}</p>
              <p className="text-xs text-foreground-500">{t("team.account_hint")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t("team.username")} labelPlacement="outside" placeholder=" " variant="bordered" {...field("username")} />
              <Input
                description={t("team.password_hint")}
                endContent={<button className="text-xs text-primary hover:underline" type="button" onClick={() => setForm((f) => ({ ...f, password: randomPassword() }))}>{t("team.generate")}</button>}
                label={t("team.password")}
                labelPlacement="outside"
                placeholder=" "
                variant="bordered"
                {...field("password")}
              />
              <Select
                className="sm:col-span-2"
                description={t("team.role_hint")}
                disallowEmptySelection
                label={t("team.role")}
                labelPlacement="outside"
                selectedKeys={form.roleId ? [form.roleId] : []}
                variant="bordered"
                onSelectionChange={(k) => setForm((f) => ({ ...f, roleId: String(Array.from(k)[0] ?? "") }))}
              >
                {roles.filter((r) => user?.isAdmin || !r.permissions.includes("*")).map((r) => <SelectItem key={r._id}>{rname(r)}</SelectItem>)}
              </Select>
            </div>
          </div>
        )}

        {!creating && canAssign && drawer?.person?.username && (
          <div className="space-y-3 rounded-xl border border-divider p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><KeyRound size={15} />{t("team.reset_password")}</p>
            <div className="flex gap-2">
              <Input
                aria-label={t("team.new_password")}
                className="flex-1"
                endContent={<button className="text-xs text-primary hover:underline" type="button" onClick={() => setNewPassword(randomPassword())}>{t("team.generate")}</button>}
                placeholder={t("team.new_password")}
                value={newPassword}
                variant="bordered"
                onValueChange={setNewPassword}
              />
              <Button isDisabled={newPassword.length < 8} variant="flat" onPress={resetPassword}>{t("team.reset_password")}</Button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
