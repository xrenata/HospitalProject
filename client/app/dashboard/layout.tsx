"use client";

import React, { useState, useEffect } from 'react';
import {
  Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Avatar, Badge, Chip, Input, Kbd, Link
} from '@heroui/react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import NextLink from 'next/link';
import CommandPalette from '@/components/CommandPalette';

import {
  Building2, Users, Calendar, Check, Stethoscope,
  Bed, DollarSign, Activity, Settings, Bell, Search,
  Home, FileText, Package, Sun, Moon, Monitor, User, LogOut,
  ClipboardList, Pill, Heart, UserCheck, Shield, Clock,
  MessageSquare, Star, Clipboard, Zap, Briefcase,
  Scissors, Navigation, BarChart3, Database, TestTube
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
  requiredPermission?: number;
  badge?: number;
  category?: string;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const { user, logout } = useAuth();
  const { t, language, setLanguage, languages } = useI18n();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const menuCategories: MenuCategory[] = [
    {
      name: "Overview",
      items: [
        { icon: <Home size={20} />, label: t('navigation.dashboard') || 'Dashboard', href: '/dashboard' },
      ]
    },
    {
      name: "Patient Care",
      items: [
        { icon: <Users size={20} />, label: t('navigation.patients') || 'Patients', href: '/dashboard/patients', requiredPermission: 1 },
        { icon: <Calendar size={20} />, label: t('navigation.appointments') || 'Appointments', href: '/dashboard/appointments', requiredPermission: 1 },
        { icon: <ClipboardList size={20} />, label: 'Visits', href: '/dashboard/visits', requiredPermission: 1 },
        { icon: <FileText size={20} />, label: t('navigation.medical_records') || 'Medical Records', href: '/dashboard/medical-records', requiredPermission: 1 },
      ]
    },
    {
      name: "Medical Operations",
      items: [
        { icon: <TestTube size={20} />, label: t('navigation.tests') || 'Tests & Labs', href: '/dashboard/tests', requiredPermission: 1 },
        { icon: <Heart size={20} />, label: 'Treatments', href: '/dashboard/treatments', requiredPermission: 1 },
        { icon: <Pill size={20} />, label: 'Prescriptions', href: '/dashboard/prescriptions', requiredPermission: 1 },
        { icon: <Scissors size={20} />, label: 'Surgeries', href: '/dashboard/surgeries', requiredPermission: 2 },
      ]
    },
    {
      name: "Hospital Management",
      items: [
        { icon: <Stethoscope size={20} />, label: t('navigation.staff') || 'Staff', href: '/dashboard/staff', requiredPermission: 3 },
        { icon: <Building2 size={20} />, label: t('navigation.departments') || 'Departments', href: '/dashboard/departments', requiredPermission: 2 },
        { icon: <Bed size={20} />, label: t('navigation.rooms') || 'Rooms', href: '/dashboard/rooms', requiredPermission: 2 },
        { icon: <Clock size={20} />, label: 'Shifts', href: '/dashboard/shifts', requiredPermission: 2 },
        { icon: <UserCheck size={20} />, label: 'Surgery Teams', href: '/dashboard/surgery-teams', requiredPermission: 2 },
      ]
    },
    {
      name: "Inventory",
      items: [
        { icon: <Package size={20} />, label: 'Medications', href: '/dashboard/medications', requiredPermission: 2 },
        { icon: <Zap size={20} />, label: 'Equipment', href: '/dashboard/equipment', requiredPermission: 2 },
      ]
    },
    {
      name: "Communication",
      items: [
        { icon: <Bell size={20} />, label: t('navigation.alerts') || 'Notifications', href: '/dashboard/alerts', requiredPermission: 1, badge: alertCount > 0 ? alertCount : undefined },
        { icon: <MessageSquare size={20} />, label: 'Complaints', href: '/dashboard/complaints', requiredPermission: 1 },
        { icon: <Star size={20} />, label: 'Feedback', href: '/dashboard/feedback', requiredPermission: 1 },
      ]
    },
    {
      name: "Administration",
      items: [
        { icon: <Shield size={20} />, label: 'Insurance', href: '/dashboard/insurance', requiredPermission: 2 },
        { icon: <Building2 size={20} />, label: 'Hospital Info', href: '/dashboard/hospital', requiredPermission: 3 },
        { icon: <BarChart3 size={20} />, label: 'Analytics', href: '/dashboard/analytics', requiredPermission: 2 },
        { icon: <Database size={20} />, label: 'Reports', href: '/dashboard/reports', requiredPermission: 2 },
        { icon: <Settings size={20} />, label: t('navigation.settings') || 'Settings', href: '/dashboard/settings', requiredPermission: 1 },
      ]
    }
  ];

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
      // Escape to close command palette
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const hasPermission = (requiredLevel?: number) => {
    if (!requiredLevel || !user) return true;
    return user.permLevel >= requiredLevel;
  };

  const filteredMenuCategories = menuCategories.map(category => ({
    ...category,
    items: category.items.filter(item => hasPermission(item.requiredPermission))
  })).filter(category => category.items.length > 0);

  const getUserRole = () => {
    if (!user) return t('user.guest');
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
        {/* Enhanced Sidebar with Navbar Features */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-80 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'top-16' : 'top-0'}
          bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/95
          border-r border-divider shadow-lg lg:shadow-none
        `}>
          <nav className="flex h-full flex-col overflow-hidden">
            {/* Enhanced Sidebar Header with Branding */}
            <div className="p-6 border-b border-divider bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 bg-primary/20 rounded-xl shadow-sm">
                  <Building2 className="text-primary" size={28} />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-foreground">MedCare</h1>
                  <p className="text-xs text-muted-foreground">Hospital Management</p>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Input
                  placeholder="Search patients, appointments..."
                  startContent={<Search className="text-muted-foreground" size={18} />}
                  endContent={
                    <Kbd className="hidden sm:inline-block" keys={["command"]}>
                      K
                    </Kbd>
                  }
                  classNames={{
                    inputWrapper: "bg-background/50 border-divider hover:bg-background/80 transition-colors cursor-pointer",
                    input: "text-sm cursor-pointer"
                  }}
                  size="sm"
                  readOnly
                  onClick={() => setCommandPaletteOpen(true)}
                />
              </div>
            </div>



            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="space-y-6">
                {filteredMenuCategories.map((category, categoryIndex) => (
                  <div key={category.name} className="space-y-2">
                    {/* Category Header */}
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category.name}
                      </h3>
                    </div>
                    
                    {/* Category Items */}
                    <div className="space-y-1">
                      {category.items.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                          <NextLink
                            key={item.href}
                            href={item.href}
                            onClick={() => isMobile && setSidebarOpen(false)}
                            className={`
                              group relative flex items-center space-x-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-200 ease-in-out
                              ${isActive
                                ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20 shadow-sm'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                              }
                            `}
                          >
                            {/* Active indicator */}
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-lg" />
                            )}
                            
                            {/* Icon */}
                            <div className={`
                              flex-shrink-0 transition-colors duration-200 ease-out
                              ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground'}
                            `}>
                              {item.icon}
                            </div>
                            
                            {/* Label */}
                            <span className="flex-1 truncate transition-colors duration-200">
                              {item.label}
                            </span>
                            
                            {/* Badge */}
                            {item.badge && (
                              <Chip 
                                size="sm" 
                                color="danger" 
                                className="ml-auto animate-pulse-slow"
                                variant="flat"
                              >
                                {item.badge}
                              </Chip>
                            )}
                          </NextLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* User Profile Section at Bottom */}
            <div className="p-4 border-t border-divider">
              <Dropdown placement="top-start">
                <DropdownTrigger>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start p-3 h-auto hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Avatar
                        name={user?.username}
                        size="sm"
                        className="ring-2 ring-primary/20"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {user?.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getUserRole()}
                        </p>
                      </div>
                    </div>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="User menu">
                  <DropdownItem key="profile" isReadOnly isDisabled className="opacity-100">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{user?.username}</p>
                        <p className="text-xs text-muted-foreground">{getUserRole()}</p>
                      </div>
                    </div>
                  </DropdownItem>
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

        {/* Mobile overlay with enhanced animation */}
        {isMobile && (
          <div
            className={`
              fixed inset-0 z-30 transition-all duration-300 ease-in-out lg:hidden
              ${sidebarOpen 
                ? 'bg-black/60 backdrop-blur-sm opacity-100 visible' 
                : 'bg-black/0 backdrop-blur-0 opacity-0 invisible'
              }
            `}
            onClick={() => setSidebarOpen(false)}
            style={{
              WebkitBackdropFilter: sidebarOpen ? 'blur(4px)' : 'blur(0px)',
              backdropFilter: sidebarOpen ? 'blur(4px)' : 'blur(0px)',
            }}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile hamburger menu - positioned fixed in top left */}
          {isMobile && (
            <Button
              isIconOnly
              variant="ghost"
              className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm shadow-md"
              onPress={() => setSidebarOpen(!sidebarOpen)}
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="flex flex-col space-y-1.5 transition-all duration-300 ease-in-out">
                  <span 
                    className={`
                      block w-5 h-0.5 bg-current transition-all duration-300 ease-in-out origin-center
                      ${sidebarOpen ? 'rotate-45 translate-y-2' : 'rotate-0 translate-y-0'}
                    `} 
                  />
                  <span 
                    className={`
                      block w-5 h-0.5 bg-current transition-all duration-300 ease-in-out
                      ${sidebarOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
                    `} 
                  />
                  <span 
                    className={`
                      block w-5 h-0.5 bg-current transition-all duration-300 ease-in-out origin-center
                      ${sidebarOpen ? '-rotate-45 -translate-y-2' : 'rotate-0 translate-y-0'}
                    `} 
                  />
                </div>
              </div>
            </Button>
          )}
          
          <div className="container mx-auto p-4 sm:p-6">
            {children}
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