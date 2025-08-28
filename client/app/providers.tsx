"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";

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

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <I18nProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--heroui-background)",
                  color: "var(--heroui-foreground)",
                  border: "1px solid var(--heroui-divider)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  fontSize: "14px",
                  fontWeight: "500",
                  minWidth: "300px",
                  maxWidth: "400px",
                },
                success: {
                  style: {
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    boxShadow:
                      "0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 10px 10px -5px rgba(16, 185, 129, 0.1)",
                  },
                  iconTheme: {
                    primary: "#ffffff",
                    secondary: "#10b981",
                  },
                },
                error: {
                  style: {
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    boxShadow:
                      "0 10px 25px -5px rgba(239, 68, 68, 0.3), 0 10px 10px -5px rgba(239, 68, 68, 0.1)",
                  },
                  iconTheme: {
                    primary: "#ffffff",
                    secondary: "#ef4444",
                  },
                },
                loading: {
                  style: {
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    boxShadow:
                      "0 10px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.1)",
                  },
                  iconTheme: {
                    primary: "#ffffff",
                    secondary: "#3b82f6",
                  },
                },
              }}
              containerStyle={{
                bottom: "24px",
                right: "24px",
              }}
            />
          </AuthProvider>
        </I18nProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
