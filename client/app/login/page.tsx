"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { Button, Input } from "@heroui/react";
import { Eye, EyeOff, Lock, LogIn, User } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import SideRays from "@/components/SideRays";

const inputClassNames = {
  inputWrapper:
    "h-11 rounded-xl bg-[#eef2f5] shadow-none data-[hover=true]:bg-[#e6ecf0] " +
    "group-data-[focus=true]:bg-[#e6ecf0] dark:bg-white/10 dark:data-[hover=true]:bg-white/15 " +
    "dark:group-data-[focus=true]:bg-white/15",
  input: "text-[15px]",
};

export default function LoginPage() {
  const { login } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error(t("login.fill_all"));

      return;
    }

    setIsLoading(true);
    const success = await login(username, password);

    if (success) {
      router.push("/dashboard");
    } else {
      toast.error(t("login.error"));
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-y-auto bg-gradient-to-b from-[#86c2ea] via-[#bfe0f4] to-[#f3f9fd] dark:from-[#09182a] dark:via-[#10283f] dark:to-[#1b3a52]">
      {/* Clouds */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 overflow-hidden">
        <div className="absolute bottom-0 -left-24 h-72 w-[30rem] rounded-full bg-white blur-2xl dark:bg-[#5b86a8]/30" />
        <div className="absolute -bottom-10 left-1/4 h-80 w-[40rem] rounded-full bg-white blur-3xl dark:bg-[#6b95b6]/30" />
        <div className="absolute bottom-0 -right-10 h-72 w-[32rem] rounded-full bg-white blur-2xl dark:bg-[#5b86a8]/30" />
        <div className="absolute bottom-36 right-1/4 h-32 w-80 rounded-full bg-white/70 blur-2xl dark:bg-[#5b86a8]/20" />
        <div className="absolute bottom-44 left-10 h-28 w-72 rounded-full bg-white/60 blur-2xl dark:bg-[#5b86a8]/20" />
      </div>

      {/* Light rays */}
      {mounted && (
        <SideRays
          className="!absolute inset-0"
          density={5}
          falloff={1.4}
          intensity={resolvedTheme === "dark" ? 1.4 : 2.6}
          lightMode={resolvedTheme !== "dark"}
          origin="top-right"
          rayColor1="#FFC46B"
          rayColor2="#7fb4ff"
          spread={2}
        />
      )}

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-16">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-lg bg-[#14181f] text-white"
         >
            <svg fill="none" height="15" viewBox="0 0 16 16" width="15">
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.25"
              />
            </svg>
          </span>
          <span className="text-[15px] font-semibold text-[#14181f] dark:text-white">
            {t("login.eyebrow")}
          </span>
        </div>
        <div className="flex gap-1 text-[#14181f] dark:text-white">
          <Button
            className="text-inherit"
            size="sm"
            variant="light"
            onPress={() => setLanguage(language === "tr" ? "en" : "tr")}
         >
            {language === "tr" ? "EN" : "TR"}
          </Button>
          {mounted && (
            <Button
              className="text-inherit"
              size="sm"
              variant="light"
              onPress={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
           >
              {resolvedTheme === "dark" ? "Light" : "Dark"}
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-8">
        <form
          noValidate
          className="w-full max-w-[22.5rem] rounded-[1.75rem] border border-white/70 bg-gradient-to-b from-[#c6eefa] via-white to-white p-7 shadow-[0_20px_60px_-20px_rgba(40,90,140,0.35)] dark:border-white/10 dark:from-[#1f4a63] dark:via-[#12222f] dark:to-[#101c27]"
          onSubmit={handleSubmit}
       >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-[0_6px_16px_-4px_rgba(30,70,110,0.3)] dark:bg-white/10">
            <LogIn className="h-5 w-5 text-[#14181f] dark:text-white" />
          </div>

          <h1 className="mt-5 text-center text-xl font-semibold text-[#14181f] dark:text-white">
            {t("login.welcome")}
          </h1>
          <p className="mx-auto mt-1.5 max-w-[18rem] text-balance text-center text-sm leading-snug text-[#6b7580] dark:text-white/60">
            {t("login.subtitle")}
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <Input
              aria-label={t("auth.username")}
              autoComplete="username"
              classNames={inputClassNames}
              placeholder={t("auth.username")}
              startContent={<User className="h-4 w-4 text-[#7c8792]" />}
              value={username}
              variant="flat"
              onValueChange={setUsername}
            />

            <Input
              aria-label={t("auth.password")}
              autoComplete="current-password"
              classNames={inputClassNames}
              endContent={
                <button
                  aria-label={showPassword ? t("login.hide") : t("login.show")}
                  className="text-[#7c8792] hover:text-[#14181f] dark:hover:text-white"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
               >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              placeholder={t("auth.password")}
              startContent={<Lock className="h-4 w-4 text-[#7c8792]" />}
              type={showPassword ? "text" : "password"}
              value={password}
              variant="flat"
              onValueChange={setPassword}
            />

            <Button
              className="mt-3 h-11 rounded-xl bg-gradient-to-b from-[#2d3139] to-[#0e1015] text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_14px_-6px_rgba(10,14,20,0.6)] dark:from-white dark:to-[#dfe6ec] dark:text-[#0e1015]"
              isLoading={isLoading}
              type="submit"
           >
              {t("login.submit")}
            </Button>
          </div>
        </form>
      </main>

      <footer className="relative z-10 px-6 py-4 text-center text-xs text-[#4a5864] dark:text-white/50">
        {t("login.copyright")}
      </footer>
    </div>
  );
}
