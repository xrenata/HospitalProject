"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { HospitalProvider } from "@/contexts/HospitalContext";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import { ConfirmProvider } from "@/components/ConfirmDialog";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

/** HeroUI's calendars and date fields follow the interface language. Lives inside I18nProvider to read it. */
function HeroShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { language } = useI18n();

  return (
    <HeroUIProvider locale={language === "tr" ? "tr-TR" : "en-US"} navigate={router.push}>
      {children}
    </HeroUIProvider>
  );
}

export function Providers({ children, themeProps }: ProvidersProps) {

  return (
    <NextThemesProvider {...themeProps}>
      <I18nProvider>
        <HeroShell>
          <AuthProvider>
            <HospitalProvider>
              <ConfirmProvider>{children}</ConfirmProvider>
            </HospitalProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "hsl(var(--heroui-content1))",
                  color: "hsl(var(--heroui-foreground))",
                  border: "1px solid hsl(var(--heroui-default-200))",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  boxShadow: "0 12px 32px -12px rgba(0, 0, 0, 0.25)",
                  fontSize: "14px",
                  fontWeight: "500",
                  maxWidth: "420px",
                },
                success: { iconTheme: { primary: "#17c964", secondary: "#ffffff" } },
                error: { iconTheme: { primary: "#f31260", secondary: "#ffffff" } },
              }}
              containerStyle={{ bottom: "24px", right: "24px" }}
            />
          </AuthProvider>
        </HeroShell>
      </I18nProvider>
    </NextThemesProvider>
  );
}
