"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ShieldOff } from "lucide-react";

import { useI18n } from "@/contexts/I18nContext";

/** Shown instead of a page the signed-in person's role does not allow. */
export default function NoAccess({ permission, roleName }: { permission: string; roleName?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [resource, action] = permission.split(".");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-default-100 text-foreground-500">
        <ShieldOff size={26} />
      </span>
      <h1 className="text-xl font-semibold">{t("noaccess.title")}</h1>
      <p className="text-sm text-foreground-500">
        {t("noaccess.text").replace("{permission}", `“${t(`perm.resource.${resource}`)} · ${t(`perm.action.${action}`)}”`)}
      </p>
      {roleName && (
        <p className="text-xs text-foreground-400">
          {t("noaccess.role")}: <span className="font-medium text-foreground-600">{roleName}</span>
        </p>
      )}
      <Button color="primary" variant="flat" onPress={() => router.push("/dashboard")}>
        {t("noaccess.back")}
      </Button>
    </div>
  );
}
