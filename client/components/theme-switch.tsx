"use client";

import { FC, useState, useEffect } from "react";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { useSwitch } from "@heroui/react";
import type { SwitchProps } from "@heroui/react";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
  classNames?: SwitchProps["classNames"];
  size?: "sm" | "md" | "lg";
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
  classNames,
  size = "md",
}) => {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onChange = () => {
    theme === "light" ? setTheme("dark") : setTheme("light");
  };

  const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;

  const {
    Component,
    slots,
    isSelected,
    getBaseProps,
    getInputProps,
    getWrapperProps,
  } = useSwitch({
    isSelected: theme === "light" || isSSR,
    "aria-label": `Switch to ${theme === "light" || isSSR ? "dark" : "light"} mode`,
    onChange,
  });

  // Don't render anything on the server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={clsx("w-auto h-auto p-2", className)}>
        <div className={`w-${iconSize/4} h-${iconSize/4}`} />
      </div>
    );
  }

  return (
    <Component
      {...getBaseProps({
        className: clsx(
          "px-px transition-opacity hover:opacity-80 cursor-pointer",
          className,
          classNames?.base,
        ),
      })}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <div
        {...getWrapperProps()}
        className={slots.wrapper({
          class: clsx(
            [
              "w-auto h-auto",
              "bg-transparent",
              "rounded-lg",
              "flex items-center justify-center",
              "group-data-[selected=true]:bg-transparent",
              "!text-default-500 hover:!text-primary",
              "pt-px",
              "px-0",
              "mx-0",
              "transition-colors",
            ],
            classNames?.wrapper,
          ),
        })}
      >
        {!isSelected || isSSR ? (
          <SunFilledIcon size={iconSize} />
        ) : (
          <MoonFilledIcon size={iconSize} />
        )}
      </div>
    </Component>
  );
};
