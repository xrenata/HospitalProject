"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { Avatar, Button, Card, CardBody, Input, Kbd, Skeleton, Switch } from "@heroui/react";
import { Info, Lock, LogOut, Monitor, Moon, Palette, ShieldCheck, Sun, User } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { accessAPI, authAPI } from "@/lib/api";
import { roleDescription, roleName } from "@/lib/roles";

type Section = "profile" | "appearance" | "access" | "security" | "about";

interface Profile {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  specialization?: string;
  permLevel: number;
  hireDate?: string;
  exp?: number;
}

const SECTIONS: { key: Section; icon: React.ReactNode }[] = [
  { key: "profile", icon: <User size={16} /> },
  { key: "appearance", icon: <Palette size={16} /> },
  { key: "access", icon: <ShieldCheck size={16} /> },
  { key: "security", icon: <Lock size={16} /> },
  { key: "about", icon: <Info size={16} /> },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <span className="text-sm text-foreground-500">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-medium">{children}</span>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="gap-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-foreground-500">{hint}</p>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

function Choice({
  active,
  onPress,
  icon,
  label,
}: {
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      aria-pressed={active}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
        active
          ? "border-primary bg-primary/5 font-medium text-foreground"
          : "border-divider text-foreground-500 hover:bg-default-100"
      }`}
      type="button"
      onClick={onPress}
    >
      {icon}
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { logout, user } = useAuth();
  const [catalog, setCatalog] = useState<{ groups: { group: string; resources: { key: string; actions: string[] }[] }[] } | null>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [serverUp, setServerUp] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setSidebarCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    } catch {}
    accessAPI.catalog().then((r) => setCatalog(r.data)).catch(() => {});
    authAPI
      .me()
      .then((res) => {
        setProfile(res.data);
        setServerUp(true);
      })
      .catch(() => setServerUp(false));
  }, []);

  const toggleSidebar = (value: boolean) => {
    setSidebarCollapsed(value);
    try {
      localStorage.setItem("sidebar-collapsed", value ? "1" : "0");
    } catch {}
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast.error(t("account.password_short"));
    if (next !== confirm) return toast.error(t("account.password_mismatch"));

    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: current, newPassword: next });
      toast.success(t("account.password_updated"));
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (error: any) {
      const message = error?.response?.data?.message;

      toast.error(message === "Current password is incorrect" ? t("account.password_wrong") : t("account.password_failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  const locale = language === "tr" ? "tr-TR" : "en-US";
  const formatDate = (value?: string | number, withTime = false) => {
    if (!value) return t("account.not_set");
    const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);

    return date.toLocaleString(locale, withTime
      ? { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "numeric", month: "long", year: "numeric" });
  };

  const browser = mounted
    ? (/Edg\//.test(navigator.userAgent) ? "Edge" : /Chrome\//.test(navigator.userAgent) ? "Chrome" : /Firefox\//.test(navigator.userAgent) ? "Firefox" : /Safari\//.test(navigator.userAgent) ? "Safari" : navigator.userAgent)
    : "";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("account.title")}</h1>
        <p className="mt-1 text-sm text-foreground-500">{t("account.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label={t("account.title")} className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map(({ key, icon }) => (
            <button
              key={key}
              aria-current={section === key ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                section === key
                  ? "bg-default-100 font-medium text-foreground"
                  : "text-foreground-500 hover:bg-default-100 hover:text-foreground"
              }`}
              type="button"
              onClick={() => setSection(key)}
            >
              <span className={section === key ? "text-primary" : ""}>{icon}</span>
              {key === "access" ? t("myaccess.nav") : t(`account.nav_${key}`)}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {section === "profile" && (
            <Panel hint={t("account.profile_hint")} title={t("account.profile")}>
              {profile ? (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 text-lg" name={profile.name || profile.username} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{profile.name || profile.username}</p>
                      <p className="truncate text-sm text-foreground-500">
                        {profile.role}
                        {profile.specialization ? ` · ${profile.specialization}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="divide-y divide-divider border-t border-divider">
                    <Row label={t("account.username")}>{profile.username}</Row>
                    <Row label={t("account.email")}>{profile.email || t("account.not_set")}</Row>
                    <Row label={t("account.phone")}>{profile.phone || t("account.not_set")}</Row>
                    <Row label={t("account.role")}>{profile.role || t("account.not_set")}</Row>
                    <Row label={t("account.access_level")}>{t(`account.level_${profile.permLevel}`)}</Row>
                    <Row label={t("account.member_since")}>{formatDate(profile.hireDate)}</Row>
                  </div>
                </>
              ) : serverUp === false ? (
                <p className="text-sm text-foreground-500">{t("account.api_unreachable")}</p>
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
              )}
            </Panel>
          )}

          {section === "appearance" && (
            <Panel hint={t("account.appearance_hint")} title={t("account.appearance")}>
              <div className="space-y-3">
                <p className="text-sm font-medium">{t("account.theme")}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Choice active={mounted && theme === "light"} icon={<Sun size={16} />} label={t("account.theme_light")} onPress={() => setTheme("light")} />
                  <Choice active={mounted && theme === "dark"} icon={<Moon size={16} />} label={t("account.theme_dark")} onPress={() => setTheme("dark")} />
                  <Choice active={mounted && theme === "system"} icon={<Monitor size={16} />} label={t("account.theme_system")} onPress={() => setTheme("system")} />
                </div>
              </div>

              <div className="space-y-3 border-t border-divider pt-6">
                <p className="text-sm font-medium">{t("account.language")}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Choice active={language === "tr"} label="Türkçe" onPress={() => setLanguage("tr")} />
                  <Choice active={language === "en"} label="English" onPress={() => setLanguage("en")} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 border-t border-divider pt-6">
                <div>
                  <p className="text-sm font-medium">{t("account.sidebar_collapsed")}</p>
                  <p className="text-xs text-foreground-500">{t("account.sidebar_collapsed_hint")}</p>
                </div>
                <Switch aria-label={t("account.sidebar_collapsed")} isSelected={sidebarCollapsed} onValueChange={toggleSidebar} />
              </div>
            </Panel>
          )}

          {section === "access" && (
            <Panel hint={t("myaccess.hint")} title={t("myaccess.title")}>
              <div className="flex items-start gap-3 rounded-xl border border-divider px-4 py-3">
                <span className="mt-0.5 text-primary"><ShieldCheck size={18} /></span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t("myaccess.role")}: {user?.accessRole ? roleName(t, { ...(user.accessRole as any), name: user.accessRole.name }) : "—"}</p>
                  {profile?.role && <p className="text-xs text-foreground-500">{profile.role}</p>}
                </div>
              </div>
              {user?.isAdmin ? (
                <p className="text-sm text-foreground-600">{t("myaccess.full")}</p>
              ) : !user?.permissions.length ? (
                <p className="text-sm text-foreground-400">{t("myaccess.none")}</p>
              ) : (
                catalog?.groups.map((g) => {
                  const rows = g.resources
                    .map((r) => ({ key: r.key, actions: r.actions.filter((a) => user.permissions.includes(`${r.key}.${a}`)) }))
                    .filter((r) => r.actions.length);

                  if (!rows.length) return null;

                  return (
                    <div key={g.group}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-400">{t(`perm.group.${g.group}`)}</p>
                      <ul className="divide-y divide-divider">
                        {rows.map((r) => (
                          <li key={r.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                            <span>{t(`perm.resource.${r.key}`)}</span>
                            <span className="flex flex-wrap justify-end gap-1.5">
                              {r.actions.map((a) => (
                                <span key={a} className="rounded-md bg-default-100 px-2 py-0.5 text-xs text-foreground-600">{t(`perm.action.${a}`)}</span>
                              ))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </Panel>
          )}

          {section === "security" && (
            <div className="space-y-6">
              <Panel hint={t("account.password_hint")} title={t("account.change_password")}>
                <form className="flex max-w-sm flex-col gap-4" onSubmit={handlePassword}>
                  <Input
                    autoComplete="current-password"
                    label={t("account.current_password")}
                    labelPlacement="outside"
                    placeholder=" "
                    type="password"
                    value={current}
                    variant="bordered"
                    onValueChange={setCurrent}
                  />
                  <Input
                    autoComplete="new-password"
                    label={t("account.new_password")}
                    labelPlacement="outside"
                    placeholder=" "
                    type="password"
                    value={next}
                    variant="bordered"
                    onValueChange={setNext}
                  />
                  <Input
                    autoComplete="new-password"
                    label={t("account.confirm_password")}
                    labelPlacement="outside"
                    placeholder=" "
                    type="password"
                    value={confirm}
                    variant="bordered"
                    onValueChange={setConfirm}
                  />
                  <Button
                    className="w-fit"
                    color="primary"
                    isDisabled={!current || !next || !confirm}
                    isLoading={saving}
                    type="submit"
                  >
                    {t("account.update_password")}
                  </Button>
                </form>
              </Panel>

              <Panel hint={profile?.exp ? `${t("account.session_expires")}: ${formatDate(profile.exp, true)}` : ""} title={t("account.session")}>
                <Button className="w-fit" color="danger" startContent={<LogOut size={16} />} variant="flat" onPress={handleSignOut}>
                  {t("account.sign_out")}
                </Button>
              </Panel>
            </div>
          )}

          {section === "about" && (
            <Panel hint={t("account.about_hint")} title={t("account.about")}>
              <div className="divide-y divide-divider">
                <Row label={t("account.app_name")}>v1.0</Row>
                <Row label={t("account.api_status")}>
                  {serverUp === null ? (
                    "…"
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${serverUp ? "bg-success" : "bg-danger"}`} />
                      {serverUp ? t("account.api_connected") : t("account.api_unreachable")}
                    </span>
                  )}
                </Row>
                <Row label={t("account.browser")}>{browser}</Row>
              </div>

              <div className="space-y-3 border-t border-divider pt-6">
                <p className="text-sm font-medium">{t("account.shortcuts")}</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-500">{t("account.shortcut_search")}</span>
                    <Kbd keys={["command"]}>K</Kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-500">{t("account.shortcut_toggle")}</span>
                    <Kbd keys={["command"]}>B</Kbd>
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
