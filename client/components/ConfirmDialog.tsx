"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button, Modal, ModalContent, ModalFooter, ModalHeader, ModalBody } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

import { useI18n } from "@/contexts/I18nContext";

type Confirm = (message: string, options?: { title?: string; confirmLabel?: string }) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/** `const confirm = useConfirm(); if (await confirm("Delete this?")) { ... }` */
export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext);

  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");

  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [state, setState] = useState<{ message: string; title?: string; confirmLabel?: string } | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((message, options) => {
    setState({ message, ...options });

    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal hideCloseButton isOpen={state !== null} size="sm" onClose={() => settle(false)}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger">
              <AlertTriangle size={18} />
            </span>
            {state?.title ?? t("confirm.title")}
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-foreground-500">{state?.message}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => settle(false)}>
              {t("confirm.cancel")}
            </Button>
            <Button autoFocus color="danger" onPress={() => settle(true)}>
              {state?.confirmLabel ?? t("confirm.confirm")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ConfirmContext.Provider>
  );
}
