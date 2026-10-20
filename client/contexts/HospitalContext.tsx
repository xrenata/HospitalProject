"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

export interface HospitalLite {
  _id: string;
  name: string;
  group?: string;
  code?: string;
  city?: string;
  status?: string;
  isDefault?: boolean;
}

interface HospitalContextType {
  hospitals: HospitalLite[];
  /** the hospital whose data is shown, or null while "all hospitals" is on */
  current: HospitalLite | null;
  isAll: boolean;
  canAll: boolean;
  loading: boolean;
  /** pass a hospital id or "all"; the page reloads so every list shows the right data */
  switchTo: (id: string) => void;
  refresh: () => Promise<void>;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [hospitals, setHospitals] = useState<HospitalLite[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [canAll, setCanAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/hospitals/mine");

      setHospitals(res.data?.data || []);
      setCurrentId(res.data?.current || "");
      setCanAll(Boolean(res.data?.canAll));
      // keep the stored choice in step with what the server actually used
      try {
        if (res.data?.current && localStorage.getItem("hospitalId") && localStorage.getItem("hospitalId") !== res.data.current) {
          localStorage.setItem("hospitalId", res.data.current);
        }
      } catch { /* storage can be unavailable */ }
    } catch {
      /* the switcher simply stays hidden */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refresh();
    else setLoading(false);
  }, [isAuthenticated, refresh]);

  const switchTo = useCallback((id: string) => {
    try { localStorage.setItem("hospitalId", id); } catch { /* ignore */ }
    window.location.reload();
  }, []);

  const value = useMemo<HospitalContextType>(() => ({
    hospitals,
    current: hospitals.find((h) => h._id === currentId) ?? null,
    isAll: currentId === "all",
    canAll,
    loading,
    switchTo,
    refresh,
  }), [hospitals, currentId, canAll, loading, switchTo, refresh]);

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
}

export function useHospital() {
  const ctx = useContext(HospitalContext);

  if (!ctx) throw new Error("useHospital must be used within a HospitalProvider");

  return ctx;
}
