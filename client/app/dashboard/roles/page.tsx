"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Button, Card, CardBody, Checkbox, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select,
  SelectItem, Skeleton, Switch, Tab, Tabs, Textarea, useDisclosure,
} from "@heroui/react";
import { Copy, Lock, Plus, Search, ShieldCheck, Trash2, Users } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useConfirm } from "@/components/ConfirmDialog";
import { accessAPI } from "@/lib/api";
import { relativeTime } from "@/lib/utils";
import { roleDescription, roleName } from "@/lib/roles";

interface Role {
  _id: string;
  key: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  isSystem: boolean;
  locked: boolean;
  memberCount: number;
}
interface Catalog {
  groups: { group: string; resources: { key: string; actions: string[] }[] }[];
  all: string[];
}

const DOT: Record<string, string> = {
  default: "bg-default-400", primary: "bg-primary", secondary: "bg-secondary",
  success: "bg-success", warning: "bg-warning", danger: "bg-danger",
};
const COLORS = Object.keys(DOT);
const BASIC = ["view", "create", "edit", "delete"];

const sameSet = (a: Set<string>, b: string[]) => a.size === b.length && b.every((p) => a.has(p));

export default function RolesPage() {
  const { t, language } = useI18n();
  const { can, user } = useAuth();
  const confirm = useConfirm();
  const router = useRouter();
  const create = useDisclosure();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // the role being edited, as the person is changing it
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("default");
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [matrixFilter, setMatrixFilter] = useState("");
  const [onlyGranted, setOnlyGranted] = useState(false);
  const [members, setMembers] = useState<{ data: any[]; total: number } | null>(null);
  const [activity, setActivity] = useState<any[] | null>(null);

  const [newName, setNewName] = useState("");
  const [newBase, setNewBase] = useState("blank");
  const [newDescription, setNewDescription] = useState("");

  const canEdit = can("roles.edit");
  const role = roles.find((r) => r._id === selectedId) ?? null;
  const editable = canEdit && !!role && !role.locked;

  const load = useCallback(async (selectId?: string) => {
    const [c, r] = await Promise.all([accessAPI.catalog(), accessAPI.roles()]);

    setCatalog(c.data);
    setRoles(r.data);
    setSelectedId((cur) => selectId ?? cur ?? r.data[0]?._id ?? null);
  }, []);

  useEffect(() => {
    load().catch(() => toast.error(t("common.error") || "Error")).finally(() => setLoading(false));
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  // load the editor state whenever another role is picked (or the saved role changes)
  useEffect(() => {
    if (!role) return;
    setName(roleName(t, role));
    setDescription(roleDescription(t, role));
    setColor(role.color ?? "default");
    setDraft(new Set(role.permissions));
    setMatrixFilter("");
    setMembers(null);
    setActivity(null);
  }, [role?._id, role?.permissions.join("|"), role?.name, role?.description, role?.color]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = !!role && (name !== roleName(t, role) || description !== roleDescription(t, role) || color !== (role.color ?? "default") || (!role.locked && !sameSet(draft, role.permissions)));

  const select = async (id: string) => {
    if (id === selectedId) return;
    if (dirty && !(await confirm(t("roles.unsaved"), { title: t("roles.discard"), confirmLabel: t("roles.discard") }))) return;
    setSelectedId(id);
  };

  const total = catalog?.all.length ?? 0;
  const isAll = role?.permissions.includes("*");
  const granted = isAll ? total : draft.size;

  // ---- editing the matrix -------------------------------------------------------------------------------------
  const toggle = (perm: string, on: boolean) =>
    setDraft((prev) => {
      const next = new Set(prev);
      const [res, action] = perm.split(".");

      if (on) {
        next.add(perm);
        if (action !== "view" && catalog?.all.includes(`${res}.view`)) next.add(`${res}.view`); // can't change what you can't see
      } else {
        next.delete(perm);
        if (action === "view") BASIC.forEach((a) => next.delete(`${res}.${a}`));
      }

      return next;
    });

  const setMany = (perms: string[], on: boolean) => perms.forEach((p) => toggle(p, on));

  const visibleGroups = useMemo(() => {
    if (!catalog) return [];
    const q = matrixFilter.trim().toLowerCase();

    return catalog.groups
      .map((g) => ({
        ...g,
        resources: g.resources.filter((r) => {
          const label = t(`perm.resource.${r.key}`).toLowerCase();
          const hasGrant = r.actions.some((a) => (isAll ? true : draft.has(`${r.key}.${a}`)));

          return (!q || label.includes(q)) && (!onlyGranted || hasGrant);
        }),
      }))
      .filter((g) => g.resources.length);
  }, [catalog, matrixFilter, onlyGranted, draft, isAll, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- actions --------------------------------------------------------------------------------------------------
  const save = async () => {
    if (!role) return;
    if (!name.trim()) return toast.error(t("roles.name_required"));
    setSaving(true);
    try {
      await accessAPI.updateRole(role._id, { name, description, color, ...(role.locked ? {} : { permissions: Array.from(draft) }) });
      toast.success(t("roles.saved"));
      await load(role._id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!role) return;
    setName(roleName(t, role));
    setDescription(roleDescription(t, role));
    setColor(role.color ?? "default");
    setDraft(new Set(role.permissions));
  };

  const createRole = async () => {
    if (!newName.trim()) return toast.error(t("roles.name_required"));
    const base = roles.find((r) => r._id === newBase);

    try {
      const { data } = await accessAPI.createRole({
        name: newName.trim(),
        description: newDescription,
        color: base?.color ?? "default",
        permissions: base && !base.permissions.includes("*") ? base.permissions : [],
      });

      toast.success(t("roles.created"));
      create.onClose();
      setNewName("");
      setNewDescription("");
      setNewBase("blank");
      await load(data._id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Error");
    }
  };

  const duplicate = () => {
    if (!role) return;
    setNewName(`${roleName(t, role)} (${t("roles.copy_suffix")})`);
    setNewBase(role._id);
    create.onOpen();
  };

  const remove = async () => {
    if (!role) return;
    if (role.memberCount > 0) {
      const others = roles.filter((r) => r._id !== role._id);
      setMoveTo(others.find((r) => user?.isAdmin || !r.permissions.includes("*"))?._id ?? ""); // people are moved in the dialog below
      moveDialog.onOpen();

      return;
    }
    if (!(await confirm(t("roles.delete_confirm").replace("{name}", roleName(t, role))))) return;
    try {
      await accessAPI.deleteRole(role._id);
      toast.success(t("roles.deleted"));
      setSelectedId(null);
      await load();
      setSelectedId(roles.find((r) => r._id !== role._id)?._id ?? null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Error");
    }
  };

  const moveDialog = useDisclosure();
  const [moveTo, setMoveTo] = useState("");
  const deleteAndMove = async () => {
    if (!role || !moveTo) return;
    try {
      await accessAPI.deleteRole(role._id, moveTo);
      toast.success(t("roles.deleted"));
      moveDialog.onClose();
      setSelectedId(null);
      await load(moveTo);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Error");
    }
  };

  // lazily load the side tabs
  const loadMembers = () => {
    if (role && !members) accessAPI.roleMembers(role._id).then((r) => setMembers(r.data)).catch(() => setMembers({ data: [], total: 0 }));
  };
  const loadActivity = () => {
    if (role && !activity) accessAPI.audit({ targetType: "role", targetId: role._id, limit: 20 }).then((r) => setActivity(r.data.data)).catch(() => setActivity([]));
  };

  const filteredRoles = roles.filter((r) => roleName(t, r).toLowerCase().includes(query.trim().toLowerCase()));

  // ---- render ---------------------------------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-[88rem] space-y-4 pb-24 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{t("roles.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-foreground-500">{t("roles.subtitle")}</p>
        </div>
        {can("roles.create") && (
          <Button color="primary" startContent={<Plus size={16} />} onPress={() => { setNewBase("blank"); setNewName(""); create.onOpen(); }}>
            {t("roles.new_role")}
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] sm:gap-5">
        {/* Role list */}
        <Card className="h-fit self-start lg:sticky lg:top-2">
          <CardBody className="gap-3 p-3">
            <Input
              aria-label={t("roles.search")}
              placeholder={t("roles.search")}
              size="sm"
              startContent={<Search className="text-foreground-400" size={15} />}
              value={query}
              onValueChange={setQuery}
            />
            {loading ? (
              <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
            ) : (
              <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
                {filteredRoles.map((r) => (
                  <li key={r._id}>
                    <button
                      aria-current={r._id === selectedId}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        r._id === selectedId ? "bg-default-100" : "hover:bg-default-50"
                      }`}
                      type="button"
                      onClick={() => select(r._id)}
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[r.color] ?? DOT.default}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <span className="truncate">{roleName(t, r)}</span>
                          {r.locked && <Lock className="shrink-0 text-foreground-400" size={12} />}
                        </span>
                        <span className="block truncate text-xs text-foreground-500">
                          {r.memberCount === 1 ? t("roles.one_member") : t("roles.members_count").replace("{n}", String(r.memberCount))}
                          {r.isSystem ? ` · ${t("roles.builtin")}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Editor */}
        {role && catalog ? (
          <Card className="w-full min-w-0 self-start">
            <CardBody className="gap-6 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <Input
                    isDisabled={!editable && !canEdit}
                    isReadOnly={!canEdit}
                    label={t("roles.name")}
                    labelPlacement="outside"
                    placeholder=" "
                    value={name}
                    variant="bordered"
                    onValueChange={setName}
                  />
                  <div>
                    <p className="mb-1.5 text-sm">{t("roles.color")}</p>
                    <div className="flex h-10 items-center gap-2.5">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          aria-label={t(`roles.colors.${c}`)}
                          aria-pressed={color === c}
                          className={`h-6 w-6 rounded-full ${DOT[c]} ring-offset-2 ring-offset-content1 transition ${color === c ? "ring-2 ring-foreground" : "opacity-60 hover:opacity-100"}`}
                          disabled={!canEdit}
                          type="button"
                          onClick={() => setColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea
                      isReadOnly={!canEdit}
                      label={t("roles.description")}
                      labelPlacement="outside"
                      minRows={2}
                      placeholder=" "
                      value={description}
                      variant="bordered"
                      onValueChange={setDescription}
                    />
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {can("roles.create") && (
                    <Button size="sm" startContent={<Copy size={14} />} variant="bordered" onPress={duplicate}>
                      {t("roles.duplicate")}
                    </Button>
                  )}
                  {can("roles.delete") && !role.isSystem && (
                    <Button color="danger" size="sm" startContent={<Trash2 size={14} />} variant="flat" onPress={remove}>
                      {t("roles.delete_role")}
                    </Button>
                  )}
                </div>
              </div>

              {!canEdit && (
                <p className="rounded-xl bg-default-100 px-4 py-3 text-sm text-foreground-500">{t("roles.cannot_edit")}</p>
              )}
              {role.locked && (
                <p className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
                  <ShieldCheck size={16} className="shrink-0" />
                  {t("roles.locked_hint")}
                </p>
              )}

              <Tabs
                aria-label="Role"
                classNames={{ tabList: "gap-6 p-0 border-b border-divider w-full", cursor: "w-full bg-primary", tab: "px-0 h-11", panel: "px-0 pt-5" }}
                variant="underlined"
                onSelectionChange={(key) => {
                  if (key === "members") loadMembers();
                  if (key === "activity") loadActivity();
                }}
              >
                <Tab key="permissions" title={`${t("roles.tab_permissions")} · ${isAll ? t("roles.all_access") : t("roles.perms_count").replace("{n}", String(granted)).replace("{total}", String(total))}`}>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Input
                      className="max-w-xs"
                      placeholder={t("roles.search_matrix")}
                      size="sm"
                      startContent={<Search className="text-foreground-400" size={15} />}
                      value={matrixFilter}
                      onValueChange={setMatrixFilter}
                    />
                    <Switch isSelected={onlyGranted} size="sm" onValueChange={setOnlyGranted}>
                      <span className="text-sm">{t("roles.only_granted")}</span>
                    </Switch>
                  </div>

                  <div className="space-y-6">
                    {visibleGroups.map((g) => {
                      const groupPerms = g.resources.flatMap((r) => r.actions.map((a) => `${r.key}.${a}`));
                      const allOn = isAll || groupPerms.every((p) => draft.has(p));

                      return (
                        <section key={g.group}>
                          <div className="mb-1 flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-400">{t(`perm.group.${g.group}`)}</h3>
                            {editable && (
                              <button className="text-xs text-primary hover:underline" type="button" onClick={() => setMany(groupPerms, !allOn)}>
                                {allOn ? t("roles.clear_all") : t("roles.select_all")}
                              </button>
                            )}
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-divider">
                            <table className="w-full min-w-[40rem] text-sm">
                              <thead>
                                <tr className="border-b border-divider bg-default-50 text-xs text-foreground-500">
                                  <th className="px-4 py-2 text-left font-medium" />
                                  {BASIC.map((a) => (
                                    <th key={a} className="w-20 px-2 py-2 text-center font-medium" title={t(`perm.hint.${a}`)}>{t(`perm.action.${a}`)}</th>
                                  ))}
                                  <th className="px-4 py-2 text-left font-medium">{t("roles.permissions")}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-divider">
                                {g.resources.map((r) => {
                                  const rowPerms = r.actions.map((a) => `${r.key}.${a}`);
                                  const rowOn = rowPerms.filter((p) => isAll || draft.has(p)).length;
                                  const extras = r.actions.filter((a) => !BASIC.includes(a));

                                  return (
                                    <tr key={r.key} className="hover:bg-default-50">
                                      <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-3">
                                          <Checkbox
                                            aria-label={`${t("roles.row_all")} ${t(`perm.resource.${r.key}`)}`}
                                            isDisabled={!editable}
                                            isIndeterminate={rowOn > 0 && rowOn < rowPerms.length}
                                            isSelected={rowOn === rowPerms.length}
                                            size="sm"
                                            onValueChange={(on) => setMany(rowPerms, on)}
                                          />
                                          <span className="font-medium">{t(`perm.resource.${r.key}`)}</span>
                                        </div>
                                      </td>
                                      {BASIC.map((a) => (
                                        <td key={a} className="px-2 py-2.5 text-center">
                                          {r.actions.includes(a) ? (
                                            <Checkbox
                                              aria-label={`${t(`perm.resource.${r.key}`)} · ${t(`perm.action.${a}`)}`}
                                              classNames={{ base: "m-0", wrapper: "m-0" }}
                                              color={a === "delete" ? "danger" : "primary"}
                                              isDisabled={!editable}
                                              isSelected={isAll || draft.has(`${r.key}.${a}`)}
                                              size="md"
                                              onValueChange={(on) => toggle(`${r.key}.${a}`, on)}
                                            />
                                          ) : (
                                            <span className="text-foreground-300">–</span>
                                          )}
                                        </td>
                                      ))}
                                      <td className="px-4 py-2.5">
                                        {extras.length ? (
                                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            {extras.map((a) => (
                                              <Checkbox
                                                key={a}
                                                isDisabled={!editable}
                                                isSelected={isAll || draft.has(`${r.key}.${a}`)}
                                                size="sm"
                                                onValueChange={(on) => toggle(`${r.key}.${a}`, on)}
                                              >
                                                <span title={t(`perm.hint.${a}`)}>{t(`perm.action.${a}`)}</span>
                                              </Checkbox>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-foreground-300">–</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </Tab>

                <Tab key="members" title={`${t("roles.tab_members")} · ${role.memberCount}`}>
                  {!members ? (
                    <Skeleton className="h-32 w-full rounded-xl" />
                  ) : members.data.length === 0 ? (
                    <p className="py-10 text-center text-sm text-foreground-400">{t("roles.no_members")}</p>
                  ) : (
                    <div className="space-y-3">
                      <ul className="divide-y divide-divider rounded-xl border border-divider">
                        {members.data.map((m) => (
                          <li key={m._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{m.name}</p>
                              <p className="truncate text-xs text-foreground-500">{[m.role, m.email].filter(Boolean).join(" · ")}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {members.total > members.data.length && (
                        <Button size="sm" startContent={<Users size={14} />} variant="bordered" onPress={() => router.push(`/dashboard/staff?accessRole=${role._id}`)}>
                          {t("roles.see_all_members")} ({members.total})
                        </Button>
                      )}
                    </div>
                  )}
                </Tab>

                <Tab key="activity" title={t("roles.tab_activity")}>
                  {!activity ? (
                    <Skeleton className="h-32 w-full rounded-xl" />
                  ) : activity.length === 0 ? (
                    <p className="py-10 text-center text-sm text-foreground-400">{t("roles.no_activity")}</p>
                  ) : (
                    <ul className="divide-y divide-divider rounded-xl border border-divider">
                      {activity.map((a) => (
                        <li key={a._id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                          <div className="min-w-0">
                            <p>
                              <span className="font-medium">{a.actorName}</span>{" "}
                              <span className="text-foreground-500">{t(`roles.audit_${a.action.replace(".", "_")}`)}</span>
                            </p>
                            {(a.details?.added?.length > 0 || a.details?.removed?.length > 0) && (
                              <p className="mt-0.5 text-xs text-foreground-500">
                                {a.details.added?.length > 0 && <span className="mr-3 text-success">{t("roles.added_n").replace("{n}", String(a.details.added.length))}</span>}
                                {a.details.removed?.length > 0 && <span className="text-danger">{t("roles.removed_n").replace("{n}", String(a.details.removed.length))}</span>}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-foreground-400">{relativeTime(a.createdAt, language)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        ) : (
          <Skeleton className="h-96 w-full rounded-2xl" />
        )}
      </div>

      {/* unsaved changes bar */}
      {dirty && canEdit && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-divider bg-content1 px-5 py-3 shadow-large">
            <span className="text-sm">{t("roles.unsaved")}</span>
            <Button size="sm" variant="light" onPress={discard}>{t("roles.discard")}</Button>
            <Button color="primary" isLoading={saving} size="sm" onPress={save}>{t("roles.save")}</Button>
          </div>
        </div>
      )}

      {/* new role */}
      <Modal isOpen={create.isOpen} size="md" onClose={create.onClose}>
        <ModalContent>
          <ModalHeader>{t("roles.new_role")}</ModalHeader>
          <ModalBody className="gap-4">
            <Input autoFocus label={t("roles.name")} labelPlacement="outside" placeholder={t("roles.new_name")} value={newName} variant="bordered" onValueChange={setNewName} />
            <Textarea label={t("roles.description")} labelPlacement="outside" minRows={2} placeholder=" " value={newDescription} variant="bordered" onValueChange={setNewDescription} />
            <Select
              disallowEmptySelection
              label={t("roles.preset")}
              labelPlacement="outside"
              selectedKeys={[newBase]}
              variant="bordered"
              onSelectionChange={(keys) => setNewBase(String(Array.from(keys)[0] ?? "blank"))}
            >
              {[<SelectItem key="blank">{t("roles.blank")}</SelectItem>, ...roles.filter((r) => !r.permissions.includes("*")).map((r) => <SelectItem key={r._id}>{roleName(t, r)}</SelectItem>)]}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={create.onClose}>{t("confirm.cancel")}</Button>
            <Button color="primary" onPress={createRole}>{t("roles.new_role")}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* delete a role that still has people */}
      <Modal isOpen={moveDialog.isOpen} size="md" onClose={moveDialog.onClose}>
        <ModalContent>
          <ModalHeader>{t("roles.in_use_title")}</ModalHeader>
          <ModalBody className="gap-4">
            <p className="text-sm text-foreground-500">{t("roles.in_use_text").replace("{n}", String(role?.memberCount ?? 0))}</p>
            <Select
              disallowEmptySelection
              label={t("roles.move_to")}
              labelPlacement="outside"
              selectedKeys={moveTo ? [moveTo] : []}
              variant="bordered"
              onSelectionChange={(keys) => setMoveTo(String(Array.from(keys)[0] ?? ""))}
            >
              {roles.filter((r) => r._id !== role?._id && (user?.isAdmin || !r.permissions.includes("*"))).map((r) => <SelectItem key={r._id}>{roleName(t, r)}</SelectItem>)}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={moveDialog.onClose}>{t("confirm.cancel")}</Button>
            <Button color="danger" isDisabled={!moveTo} onPress={deleteAndMove}>{t("roles.delete_and_move")}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
