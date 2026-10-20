"use client";

import HospitalSwitcher from '@/components/HospitalSwitcher';
import React, { useState, useEffect } from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Kbd,
  Tooltip
} from '@heroui/react';
import { Chip } from '@/components/Chip';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import NextLink from 'next/link';
import CommandPalette from '@/components/CommandPalette';
import NoAccess from '@/components/NoAccess';
import { roleName } from '@/lib/roles';

import {
  Building2, Users, Calendar, Check, Stethoscope,
  Bed, DollarSign, Activity, Settings, Bell, Search,
  Home, FileText, Package, Sun, Moon, Monitor, User, LogOut,
  ClipboardList, Pill, Heart, UserCheck, Shield, Clock,
  MessageSquare, Star, Clipboard, Zap, Briefcase,
  Scissors, Navigation, BarChart3, Database, TestTube,
  PanelLeftClose, PanelLeftOpen, ChevronsUpDown, Menu, ShieldCheck,
  Wrench,
  Siren,
  Droplets,
  AlertOctagon,
  Receipt,
  Landmark,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18n } from '@/contexts/I18nContext';
import { dashboardAPI } from '@/lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  resource?: string;
  badge?: number;
  category?: string;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

const RESOURCE_BY_PATH: Record<string, string> = {"/dashboard/patients": "patients", "/dashboard/appointments": "appointments", "/dashboard/visits": "visits", "/dashboard/medical-records": "treatments", "/dashboard/tests": "tests", "/dashboard/treatments": "treatments", "/dashboard/prescriptions": "prescriptions", "/dashboard/surgeries": "surgeries", "/dashboard/staff": "staff", "/dashboard/departments": "departments", "/dashboard/rooms": "rooms", "/dashboard/shifts": "shifts", "/dashboard/surgery-teams": "surgery_teams", "/dashboard/medications": "medications", "/dashboard/equipment": "equipment", "/dashboard/inventory": "medications", "/dashboard/alerts": "notifications", "/dashboard/complaints": "complaints", "/dashboard/feedback": "feedback", "/dashboard/insurance": "insurance", "/dashboard/hospital": "hospital", "/dashboard/analytics": "analytics", "/dashboard/reports": "reports", "/dashboard/roles": "roles", "/dashboard/hospitals": "hospital", "/dashboard/billing": "billing", "/dashboard/blood-bank": "blood_bank", "/dashboard/maintenance": "maintenance", "/dashboard/incidents": "incidents", "/dashboard/ambulances": "ambulances"};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const { user, logout, can, loading: authLoading } = useAuth();
  const { t, language, setLanguage, languages } = useI18n();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const menuCategories: MenuCategory[] = [
    {
      name: t('navigation.group_overview'),
      items: [
        { icon: <Home size={18} />, label: t('navigation.dashboard'), href: '/dashboard' },
      ]
    },
    {
      name: t('navigation.group_patient_care'),
      items: [
        { icon: <Users size={18} />, label: t('navigation.patients'), href: '/dashboard/patients', resource: 'patients' },
        { icon: <Calendar size={18} />, label: t('navigation.appointments'), href: '/dashboard/appointments', resource: 'appointments' },
        { icon: <ClipboardList size={18} />, label: t('navigation.visits'), href: '/dashboard/visits', resource: 'visits' },
        { icon: <FileText size={18} />, label: t('navigation.medical_records'), href: '/dashboard/medical-records', resource: 'treatments' },
      ]
    },
    {
      name: t('navigation.group_medical'),
      items: [
        { icon: <TestTube size={18} />, label: t('navigation.tests'), href: '/dashboard/tests', resource: 'tests' },
        { icon: <Heart size={18} />, label: t('navigation.treatments'), href: '/dashboard/treatments', resource: 'treatments' },
        { icon: <Pill size={18} />, label: t('navigation.prescriptions'), href: '/dashboard/prescriptions', resource: 'prescriptions' },
        { icon: <Scissors size={18} />, label: t('navigation.surgeries'), href: '/dashboard/surgeries', resource: 'surgeries' },
      ]
    },
    {
      name: t('navigation.group_hospital'),
      items: [
        { icon: <Stethoscope size={18} />, label: t('navigation.staff'), href: '/dashboard/staff', resource: 'staff' },
        { icon: <Building2 size={18} />, label: t('navigation.departments'), href: '/dashboard/departments', resource: 'departments' },
        { icon: <Bed size={18} />, label: t('navigation.rooms'), href: '/dashboard/rooms', resource: 'rooms' },
        { icon: <Clock size={18} />, label: t('navigation.shifts'), href: '/dashboard/shifts', resource: 'shifts' },
        { icon: <UserCheck size={18} />, label: t('navigation.surgery_teams'), href: '/dashboard/surgery-teams', resource: 'surgery_teams' },
        { icon: <Wrench size={18} />, label: t('navigation.maintenance'), href: '/dashboard/maintenance', resource: 'maintenance' },
        { icon: <Siren size={18} />, label: t('navigation.ambulances'), href: '/dashboard/ambulances', resource: 'ambulances' },
      ]
    },
    {
      name: t('navigation.group_inventory'),
      items: [
        { icon: <Package size={18} />, label: t('navigation.medications'), href: '/dashboard/medications', resource: 'medications' },
        { icon: <Zap size={18} />, label: t('navigation.equipment'), href: '/dashboard/equipment', resource: 'equipment' },
        { icon: <Droplets size={18} />, label: t('navigation.blood_bank'), href: '/dashboard/blood-bank', resource: 'blood_bank' },
      ]
    },
    {
      name: t('navigation.group_communication'),
      items: [
        { icon: <Bell size={18} />, label: t('navigation.alerts'), href: '/dashboard/alerts', resource: 'notifications', badge: alertCount > 0 ? alertCount : undefined },
        { icon: <MessageSquare size={18} />, label: t('navigation.complaints'), href: '/dashboard/complaints', resource: 'complaints' },
        { icon: <Star size={18} />, label: t('navigation.feedback'), href: '/dashboard/feedback', resource: 'feedback' },
        { icon: <AlertOctagon size={18} />, label: t('navigation.incidents'), href: '/dashboard/incidents', resource: 'incidents' },
      ]
    },
    {
      name: t('navigation.group_admin'),
      items: [
        { icon: <Shield size={18} />, label: t('navigation.insurance'), href: '/dashboard/insurance', resource: 'insurance' },
        { icon: <Receipt size={18} />, label: t('navigation.billing'), href: '/dashboard/billing', resource: 'billing' },
        { icon: <Building2 size={18} />, label: t('navigation.hospital_info'), href: '/dashboard/hospital', resource: 'hospital' },
        { icon: <Landmark size={18} />, label: t('navigation.hospitals'), href: '/dashboard/hospitals', resource: 'hospital' },
        { icon: <BarChart3 size={18} />, label: t('navigation.analytics'), href: '/dashboard/analytics', resource: 'analytics' },
        { icon: <Database size={18} />, label: t('navigation.reports'), href: '/dashboard/reports', resource: 'reports' },
        { icon: <ShieldCheck size={18} />, label: t('navigation.roles'), href: '/dashboard/roles', resource: 'roles' },
        { icon: <Settings size={18} />, label: t('navigation.settings'), href: '/dashboard/settings' },
      ]
    }
  ];

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === '1');
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem('sidebar-collapsed', prev ? '0' : '1');
      } catch {}
      return !prev;
    });
  };

  // The page behind the current URL needs "<resource>.view"; without it show a friendly explanation instead.
  const requiredResource = Object.entries(RESOURCE_BY_PATH).find(([path]) => pathname === path || pathname?.startsWith(path + '/'))?.[1];
  const blocked = !!user && !!requiredResource && !can(`${requiredResource}.view`);

  const isActiveRoute = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname === href || pathname?.startsWith(href + '/');

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load alert count
  useEffect(() => {
    const loadAlertCount = async () => {
      try {
        const response = await dashboardAPI.getAlerts();
        const unreadAlerts = response.data.alerts?.filter((alert: any) => !alert.isRead) || [];
        setAlertCount(unreadAlerts.length);
      } catch (error) {
        console.error('Error loading alert count:', error);
        setAlertCount(0);
      }
    };

    if (user) {
      loadAlertCount();
      // Refresh alert count every 30 seconds
      const interval = setInterval(loadAlertCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Command Palette Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Ctrl+B or Cmd+B to collapse / expand the sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleCollapsed();
      }
      // Escape to close command palette
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const hasPermission = (resource?: string) => {
    if (!resource) return true;
    return can(`${resource}.view`);
  };

  const filteredMenuCategories = menuCategories.map(category => ({
    ...category,
    items: category.items.filter(item => hasPermission(item.resource))
  })).filter(category => category.items.length > 0);

  // the browser tab names the current page, so several open tabs can be told apart
  const currentLabel = filteredMenuCategories.flatMap((c) => c.items).find((i) => isActiveRoute(i.href))?.label;

  useEffect(() => {
    document.title = currentLabel ? `${currentLabel} · ${t('login.eyebrow')}` : t('login.eyebrow');
  }, [currentLabel, t]);

  const getUserRole = () => {
    if (!user) return t('user.guest');
    if (user.accessRole) return roleName(t, user.accessRole as any);
    switch (user.permLevel) {
      case 3: return t('user.admin');
      case 2: return t('user.doctor');
      case 1: return t('user.nurse');
      default: return t('user.user');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-72 shrink-0 border-r border-divider bg-content1
            transition-[transform,width] duration-200 ease-out lg:static lg:translate-x-0
            ${collapsed ? 'lg:w-[68px]' : 'lg:w-64'}
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
       >
          <nav className="flex h-full flex-col">
            {/* Brand */}
            <div className={`flex h-14 shrink-0 items-center gap-2.5 px-4 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
              <span
                aria-hidden
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-foreground text-background"
             >
                <svg fill="none" height="15" viewBox="0 0 16 16" width="15">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" />
                </svg>
              </span>
              <div className={`flex min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
                <HospitalSwitcher fallback={t('login.eyebrow')} />
              </div>
            </div>

            {/* Search */}
            <div className={`px-3 pb-2 ${collapsed ? 'lg:px-[14px]' : ''}`}>
              <Tooltip content={t('sidebar.search') || 'Search'} placement="right" isDisabled={!collapsed}>
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className={`flex h-9 w-full items-center gap-2 rounded-lg border border-divider px-2.5 text-sm text-foreground-500 transition-colors hover:bg-default-100 ${
                    collapsed ? 'lg:justify-center lg:px-0' : ''
                  }`}
               >
                  <Search size={16} className="shrink-0" />
                  <span className={`flex-1 truncate text-left ${collapsed ? 'lg:hidden' : ''}`}>
                    {t('sidebar.search') || 'Search'}
                  </span>
                  <Kbd className={`hidden text-[10px] ${collapsed ? '' : 'lg:inline-flex'}`} keys={['command']}>
                    K
                  </Kbd>
                </button>
              </Tooltip>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filteredMenuCategories.map((category, categoryIndex) => (
                <div key={category.name} className={categoryIndex === 0 ? 'mt-1' : 'mt-5'}>
                  <h3
                    className={`px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground-400 ${
                      collapsed ? 'lg:hidden' : ''
                    }`}
                 >
                    {category.name}
                  </h3>
                  {collapsed && categoryIndex > 0 && <div className="mx-2 mb-2 hidden border-t border-divider lg:block" />}
                  <ul className="space-y-0.5">
                    {category.items.map((item) => {
                      const isActive = isActiveRoute(item.href);

                      return (
                        <li key={item.href}>
                          <Tooltip content={item.label} placement="right" isDisabled={!collapsed}>
                            <NextLink
                              href={item.href}
                              aria-current={isActive ? 'page' : undefined}
                              onClick={() => isMobile && setSidebarOpen(false)}
                              className={`
                                relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors
                                ${collapsed ? 'lg:justify-center lg:px-0' : ''}
                                ${isActive
                                  ? 'bg-default-100 font-medium text-foreground'
                                  : 'text-foreground-500 hover:bg-default-100 hover:text-foreground'}
                              `}
                           >
                              <span className={`shrink-0 ${isActive ? 'text-primary' : ''}`}>{item.icon}</span>
                              <span className={`flex-1 truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                              {item.badge && (
                                <Chip
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  className={`h-5 min-w-5 px-1 text-[11px] ${collapsed ? 'lg:hidden' : ''}`}
                               >
                                  {item.badge}
                                </Chip>
                              )}
                              {item.badge && collapsed && (
                                <span className="absolute right-2 top-1.5 hidden h-2 w-2 rounded-full bg-danger lg:block" />
                              )}
                            </NextLink>
                          </Tooltip>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer: collapse + user */}
            <div className="shrink-0 border-t border-divider p-3">
              <button
                type="button"
                onClick={toggleCollapsed}
                className={`mb-2 hidden h-8 w-full items-center gap-3 rounded-lg px-2.5 text-xs text-foreground-400 transition-colors hover:bg-default-100 hover:text-foreground lg:flex ${
                  collapsed ? 'justify-center px-0' : ''
                }`}
             >
                {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                {!collapsed && <span>{t('sidebar.collapse') || 'Collapse'}</span>}
              </button>

              <Dropdown placement="top-start">
                <DropdownTrigger>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-default-100 ${
                      collapsed ? 'lg:justify-center' : ''
                    }`}
                 >
                    <Avatar name={user?.username} size="sm" className="h-8 w-8 shrink-0 text-xs" />
                    <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
                      <p className="truncate text-sm font-medium leading-tight">{user?.username}</p>
                      <p className="truncate text-xs text-foreground-400">{getUserRole()}</p>
                    </div>
                    <ChevronsUpDown size={14} className={`shrink-0 text-foreground-400 ${collapsed ? 'lg:hidden' : ''}`} />
                  </button>
                </DropdownTrigger>
                <DropdownMenu aria-label="User menu">
                  <DropdownItem key="theme" onPress={cycleTheme}>
                    <div className="flex items-center space-x-2">
                      {getThemeIcon()}
                      <span>
                        {theme === 'light' ? t('theme.light') :
                         theme === 'dark' ? t('theme.dark') : t('theme.system')}
                      </span>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="settings" onPress={() => router.push('/dashboard/settings')}>
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>{t('navigation.settings')}</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="logout" color="danger" onPress={handleLogout}>
                    <div className="flex items-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>{t('auth.logout')}</span>
                    </div>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </nav>
        </aside>

        {/* Mobile overlay */}
        {isMobile && (
          <div
            className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 lg:hidden ${
              sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile menu button */}
          {isMobile && (
            <Button
              isIconOnly
              aria-label="Menu"
              variant="flat"
              size="sm"
              className="fixed left-3 top-3 z-20 border border-divider bg-content1 lg:hidden"
              onPress={() => setSidebarOpen(true)}
           >
              <Menu size={18} />
            </Button>
          )}

          <div className="container mx-auto p-4 sm:p-6">
            <React.Suspense fallback={null}>
              {/* nothing is rendered (so nothing is fetched) until we know who is signed in and what they may open */}
              {authLoading || !user ? null : blocked ? <NoAccess permission={`${requiredResource}.view`} roleName={roleName(t, user.accessRole as any)} /> : children}
            </React.Suspense>
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        user={user}
        onLogout={handleLogout}
        onThemeChange={cycleTheme}
        theme={theme}
      />
    </div>
  );
}