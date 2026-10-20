"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Skeleton } from "@heroui/react";
import { AlertTriangle, CalendarClock, DollarSign, Pill, Wrench } from "lucide-react";

import { Chip } from "@/components/Chip";
import { Donut, Legend, type Segment, type Tone } from "@/components/charts";
import { useI18n } from "@/contexts/I18nContext";
import { equipmentAPI, medicationsAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const LOW_STOCK = 50; // units at or below which a medication counts as low
const EXPIRY_DAYS = 90; // how far ahead "expiring soon" looks
const DAY = 86400000;

interface Med {
  _id: string;
  name: string;
  dosage?: string;
  category?: string;
  stockQuantity?: number;
  price?: number;
  expiryDate?: string;
}

interface Eq {
  _id: string;
  name: string;
  manufacturer?: string;
  status?: string;
  cost?: number;
}

const unwrap = (res: any, key: string): any[] => res?.data?.[key] ?? res?.data?.data ?? (Array.isArray(res?.data) ? res.data : []);

function Stat({
  label,
  value,
  icon,
  tone = "default",
  loading,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: Tone;
  loading: boolean;
}) {
  return (
    <Card className="w-full">
      <CardBody className="gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-500">{label}</span>
          <span className={tone === "default" ? "text-foreground-400" : `text-${tone}`}>{icon}</span>
        </div>
        <div className="truncate text-2xl font-semibold tabular-nums">
          {loading ? <Skeleton className="h-8 w-20 rounded-md" /> : value}
        </div>
      </CardBody>
    </Card>
  );
}

export default function InventoryPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const [meds, setMeds] = useState<Med[]>([]);
  const [equipment, setEquipment] = useState<Eq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      medicationsAPI.getAll({ limit: 200 }).catch(() => null),
      equipmentAPI.getAll({ limit: 200 }).catch(() => null),
    ])
      .then(([m, e]) => {
        setMeds(unwrap(m, "medications"));
        setEquipment(unwrap(e, "equipment"));
      })
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    const now = Date.now();
    const lowStock = meds.filter((m) => (m.stockQuantity ?? 0) <= LOW_STOCK);
    const expiring = meds
      .filter((m) => m.expiryDate && new Date(m.expiryDate).getTime() - now <= EXPIRY_DAYS * DAY)
      .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
    const stockValue = meds.reduce((sum, m) => sum + (m.stockQuantity ?? 0) * (m.price ?? 0), 0);
    const lowest = [...meds].sort((a, b) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0)).slice(0, 8);
    const max = Math.max(...lowest.map((m) => m.stockQuantity ?? 0), LOW_STOCK * 2, 1);
    const attention = equipment.filter((e) => e.status && e.status !== "operational");

    const byStatus = new Map<string, number>();

    equipment.forEach((e) => byStatus.set(e.status ?? "unknown", (byStatus.get(e.status ?? "unknown") ?? 0) + 1));
    const tones: Record<string, Tone> = {
      operational: "success",
      maintenance: "warning",
      "out-of-order": "danger",
      retired: "default",
    };
    const segments: Segment[] = Array.from(byStatus.entries()).map(([status, value]) => ({
      label: t(`values.${status}`) === `values.${status}` ? status : t(`values.${status}`),
      value,
      tone: tones[status] ?? "primary",
    }));

    return { lowStock, expiring, stockValue, lowest, max, attention, segments };
  }, [meds, equipment, t]);

  const locale = language === "tr" ? "tr-TR" : "en-US";
  const daysLeft = (iso?: string) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DAY) : 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("stock.title")}</h1>
          <p className="mt-1 text-sm text-foreground-500">{t("stock.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="bordered" onPress={() => router.push("/dashboard/medications")}>
            {t("navigation.medications")}
          </Button>
          <Button size="sm" variant="bordered" onPress={() => router.push("/dashboard/equipment")}>
            {t("navigation.equipment")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        <Stat icon={<Pill size={18} />} label={t("stock.medications")} loading={loading} value={meds.length} />
        <Stat
          icon={<AlertTriangle size={18} />}
          label={t("stock.low_stock")}
          loading={loading}
          tone={data.lowStock.length ? "warning" : "default"}
          value={data.lowStock.length}
        />
        <Stat
          icon={<CalendarClock size={18} />}
          label={t("stock.expiring_soon")}
          loading={loading}
          tone={data.expiring.length ? "danger" : "default"}
          value={data.expiring.length}
        />
        <Stat
          icon={<DollarSign size={18} />}
          label={t("stock.stock_value")}
          loading={loading}
          value={formatCurrency(data.stockValue)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 sm:gap-4">
        <Card className="w-full lg:col-span-2">
          <CardBody className="gap-5 p-5">
            <div>
              <h3 className="text-base font-semibold">{t("stock.stock_levels")}</h3>
              <p className="text-xs text-foreground-500">{t("stock.stock_levels_hint")}</p>
            </div>
            {loading ? (
              <Skeleton className="h-56 w-full rounded-xl" />
            ) : data.lowest.length === 0 ? (
              <p className="py-10 text-center text-sm text-foreground-400">{t("summary.no_data")}</p>
            ) : (
              <ul className="space-y-4">
                {data.lowest.map((m) => {
                  const qty = m.stockQuantity ?? 0;
                  const low = qty <= LOW_STOCK;

                  return (
                    <li key={m._id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
                        <span className="truncate font-medium">
                          {m.name}
                          {m.dosage && <span className="ml-2 font-normal text-foreground-400">{m.dosage}</span>}
                        </span>
                        <span className={`shrink-0 tabular-nums ${low ? "font-medium text-warning" : "text-foreground-500"}`}>
                          {qty} {t("stock.units")}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-default-100">
                        <div
                          className={`h-full rounded-full ${low ? "bg-warning" : "bg-primary"}`}
                          style={{ width: `${Math.max((qty / data.max) * 100, qty ? 2 : 0)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="w-full">
          <CardBody className="gap-5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">{t("stock.equipment_status")}</h3>
                <p className="text-xs text-foreground-500">{equipment.length} {t("stock.items")}</p>
              </div>
              <span className="text-foreground-400">
                <Wrench size={18} />
              </span>
            </div>
            {loading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <Donut segments={data.segments}>
                  <span className="text-3xl font-semibold tabular-nums">{equipment.length}</span>
                  <span className="text-xs text-foreground-500">{t("stock.items")}</span>
                </Donut>
                <div className="w-full max-w-[12rem]">
                  <Legend segments={data.segments} />
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="w-full">
        <CardBody className="p-0">
          <div className="px-5 py-4">
            <h3 className="text-base font-semibold">{t("stock.attention")}</h3>
          </div>
          <div className="border-t border-divider">
            {loading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : data.lowStock.length + data.expiring.length + data.attention.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-foreground-400">{t("stock.no_issues")}</p>
            ) : (
              <ul className="divide-y divide-divider">
                {data.lowStock.map((m) => (
                  <li key={`low-${m._id}`} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-warning/10 text-warning">
                      <AlertTriangle size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-foreground-500">
                        {t("stock.low_stock")} · {m.stockQuantity ?? 0} {t("stock.units")}
                      </p>
                    </div>
                    <Chip color="warning" size="sm">{t("stock.low_stock")}</Chip>
                  </li>
                ))}
                {data.expiring.map((m) => {
                  const left = daysLeft(m.expiryDate);

                  return (
                    <li key={`exp-${m._id}`} className="flex items-center gap-3 px-5 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                        <CalendarClock size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-foreground-500">
                          {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : ""}
                        </p>
                      </div>
                      <Chip color="danger" size="sm">
                        {left < 0 ? t("stock.expired") : t("stock.expires_in").replace("{n}", String(left))}
                      </Chip>
                    </li>
                  );
                })}
                {data.attention.map((e) => (
                  <li key={`eq-${e._id}`} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-default-100 text-foreground-500">
                      <Wrench size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      <p className="text-xs text-foreground-500">{e.manufacturer}</p>
                    </div>
                    <Chip color={e.status === "out-of-order" ? "danger" : "warning"} size="sm">
                      {e.status ?? ""}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
