"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Button,
  Kbd,
  Divider,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import {
  Search,
  Users,
  Calendar,
  Bell,
  Activity,
  Stethoscope,
  Settings,
  Bed,
  FileText,
  Package,
  Home,
  Building2,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  ArrowRight,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: "navigation" | "actions" | "search" | "settings";
  keywords: string[];
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  onLogout: () => void;
  onThemeChange: () => void;
  theme?: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
  user,
  onLogout,
  onThemeChange,
  theme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { t } = useI18n();

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation Commands
      {
        id: "nav-dashboard",
        title: t("navigation.dashboard"),
        description: t("command_palette.commands.go_to_dashboard"),
        icon: <Home size={18} />,
        action: () => router.push("/dashboard"),
        category: "navigation",
        keywords: ["dashboard", "home", "main", "ana sayfa"],
        shortcut: "Ctrl+H",
      },
      {
        id: "nav-patients",
        title: t("navigation.patients"),
        description: t("command_palette.commands.manage_patients"),
        icon: <Users size={18} />,
        action: () => router.push("/dashboard/patients"),
        category: "navigation",
        keywords: ["patients", "hasta", "hastalar", "people"],
      },
      {
        id: "nav-appointments",
        title: t("navigation.appointments"),
        description: t("command_palette.commands.view_appointments"),
        icon: <Calendar size={18} />,
        action: () => router.push("/dashboard/appointments"),
        category: "navigation",
        keywords: ["appointments", "randevu", "calendar", "schedule"],
      },
      {
        id: "nav-alerts",
        title: t("navigation.alerts"),
        description: t("command_palette.commands.check_alerts"),
        icon: <Bell size={18} />,
        action: () => router.push("/dashboard/alerts"),
        category: "navigation",
        keywords: ["alerts", "notifications", "uyarılar", "bildirimler"],
      },
      {
        id: "nav-tests",
        title: t("navigation.tests"),
        description: t("command_palette.commands.medical_tests"),
        icon: <Activity size={18} />,
        action: () => router.push("/dashboard/tests"),
        category: "navigation",
        keywords: ["tests", "testler", "medical", "results", "sonuçlar"],
      },
      {
        id: "nav-staff",
        title: t("navigation.staff"),
        description: t("command_palette.commands.manage_staff"),
        icon: <Stethoscope size={18} />,
        action: () => router.push("/dashboard/staff"),
        category: "navigation",
        keywords: [
          "staff",
          "personel",
          "doctors",
          "nurses",
          "doktor",
          "hemşire",
        ],
      },
      {
        id: "nav-departments",
        title: t("navigation.departments"),
        description: t("command_palette.commands.hospital_departments"),
        icon: <Building2 size={18} />,
        action: () => router.push("/dashboard/departments"),
        category: "navigation",
        keywords: ["departments", "bölümler", "units", "birimler"],
      },
      {
        id: "nav-rooms",
        title: t("navigation.rooms"),
        description: t("command_palette.commands.room_management"),
        icon: <Bed size={18} />,
        action: () => router.push("/dashboard/rooms"),
        category: "navigation",
        keywords: ["rooms", "odalar", "beds", "yataklar"],
      },
      {
        id: "nav-records",
        title: t("navigation.medical_records"),
        description: t("command_palette.commands.patient_records"),
        icon: <FileText size={18} />,
        action: () => router.push("/dashboard/medical-records"),
        category: "navigation",
        keywords: ["records", "kayıtlar", "medical", "tıbbi", "files"],
      },
      {
        id: "nav-inventory",
        title: t("navigation.inventory"),
        description: t("command_palette.commands.medical_inventory"),
        icon: <Package size={18} />,
        action: () => router.push("/dashboard/inventory"),
        category: "navigation",
        keywords: ["inventory", "envanter", "supplies", "malzemeler"],
      },
      {
        id: "nav-settings",
        title: t("navigation.settings"),
        description: t("command_palette.commands.app_settings"),
        icon: <Settings size={18} />,
        action: () => router.push("/dashboard/settings"),
        category: "settings",
        keywords: ["settings", "ayarlar", "preferences", "config"],
        shortcut: "Ctrl+,",
      },

      // Action Commands
      {
        id: "action-theme",
        title: `Switch to ${theme === "light" ? "Dark" : theme === "dark" ? "System" : "Light"} Theme`,
        description: t("command_palette.commands.toggle_theme"),
        icon:
          theme === "light" ? (
            <Moon size={18} />
          ) : theme === "dark" ? (
            <Monitor size={18} />
          ) : (
            <Sun size={18} />
          ),
        action: onThemeChange,
        category: "actions",
        keywords: ["theme", "tema", "dark", "light", "karanlık", "aydınlık"],
        shortcut: "Ctrl+T",
      },
      {
        id: "action-logout",
        title: t("auth.logout"),
        description: t("command_palette.commands.sign_out"),
        icon: <LogOut size={18} />,
        action: onLogout,
        category: "actions",
        keywords: ["logout", "çıkış", "sign out", "exit"],
        shortcut: "Ctrl+Q",
      },

      // Search Commands
      {
        id: "search-patients",
        title: "Search Patients",
        description: t("command_palette.commands.search_patients"),
        icon: <Search size={18} />,
        action: () => {
          router.push("/dashboard/patients");
          // Focus search input after navigation
          setTimeout(() => {
            const searchInput = document.querySelector(
              'input[placeholder*="patient"]'
            ) as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }, 100);
        },
        category: "search",
        keywords: ["search", "ara", "find", "bul", "patients", "hastalar"],
        shortcut: "Ctrl+P",
      },
      {
        id: "search-appointments",
        title: "Search Appointments",
        description: t("command_palette.commands.search_appointments"),
        icon: <Search size={18} />,
        action: () => {
          router.push("/dashboard/appointments");
          setTimeout(() => {
            const searchInput = document.querySelector(
              'input[placeholder*="appointment"]'
            ) as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }, 100);
        },
        category: "search",
        keywords: ["search", "ara", "appointments", "randevular", "schedule"],
        shortcut: "Ctrl+A",
      },
    ],
    [router, t, theme, onThemeChange, onLogout]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const searchTerm = query.toLowerCase().trim();
    return commands.filter(
      (command) =>
        command.title.toLowerCase().includes(searchTerm) ||
        command.description?.toLowerCase().includes(searchTerm) ||
        command.keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchTerm)
        )
    );
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((command) => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  const allFilteredCommands = useMemo(() => {
    return Object.values(groupedCommands).flat();
  }, [groupedCommands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allFilteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : allFilteredCommands.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (allFilteredCommands[selectedIndex]) {
          allFilteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "navigation":
        return t("command_palette.categories.navigation");
      case "actions":
        return t("command_palette.categories.actions");
      case "search":
        return t("command_palette.categories.search");
      case "settings":
        return t("command_palette.categories.settings");
      default:
        return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "navigation":
        return <ArrowRight size={16} />;
      case "actions":
        return <Activity size={16} />;
      case "search":
        return <Search size={16} />;
      case "settings":
        return <Settings size={16} />;
      default:
        return <ArrowRight size={16} />;
    }
  };

  let currentIndex = 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      placement="top"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "mt-16",
        wrapper: "items-start",
      }}
    >
      <ModalContent>
        <ModalHeader className="pb-2">
          <div className="flex items-center space-x-2 w-full">
            <Search size={20} className="text-muted-foreground" />
            <span className="font-semibold">{t("command_palette.title")}</span>
          </div>
        </ModalHeader>
        <ModalBody className="pb-6">
          <Input
            placeholder={t("command_palette.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            startContent={
              <Search size={18} className="text-muted-foreground" />
            }
            classNames={{
              inputWrapper: "border-divider",
              input: "text-sm",
            }}
          />

          <div className="max-h-96 overflow-y-auto space-y-4">
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category}>
                <div className="flex items-center space-x-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {getCategoryIcon(category)}
                  <span>{getCategoryTitle(category)}</span>
                </div>
                <div className="space-y-1">
                  {commands.map((command) => {
                    const isSelected = currentIndex === selectedIndex;
                    const itemIndex = currentIndex++;

                    return (
                      <Button
                        key={command.id}
                        variant={isSelected ? "flat" : "light"}
                        className={`
                          w-full justify-start h-auto p-3 text-left
                          ${isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/50"}
                        `}
                        onPress={() => {
                          command.action();
                          onClose();
                        }}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div
                            className={`
                            flex-shrink-0 
                            ${isSelected ? "text-primary" : "text-muted-foreground"}
                          `}
                          >
                            {command.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {command.title}
                            </div>
                            {command.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {command.description}
                              </div>
                            )}
                          </div>
                          {command.shortcut && (
                            <div className="flex-shrink-0">
                              <Kbd className="text-xs">{command.shortcut}</Kbd>
                            </div>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
                {Object.keys(groupedCommands).indexOf(category) <
                  Object.keys(groupedCommands).length - 1 && (
                  <Divider className="my-2" />
                )}
              </div>
            ))}

            {filteredCommands.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">{t("command_palette.no_results")}</p>
                <p className="text-xs">{t("command_palette.try_different")}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-divider">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Kbd>↑↓</Kbd>
                <span>{t("command_palette.shortcuts.navigate")}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Kbd>↵</Kbd>
                <span>{t("command_palette.shortcuts.select")}</span>
              </span>
            </div>
            <span className="flex items-center space-x-1">
              <Kbd>ESC</Kbd>
              <span>{t("command_palette.shortcuts.close")}</span>
            </span>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
