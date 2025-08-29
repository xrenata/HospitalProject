'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, CardHeader, Button, Select, SelectItem, Switch,
  Input, Divider, Tabs, Tab, Avatar, Chip, Progress, Badge,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Slider, RadioGroup, Radio, Accordion, AccordionItem,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Tooltip, Code, Spacer, Textarea
} from '@heroui/react';
import { 
  Settings as SettingsIcon, Globe, Palette, Bell, Shield, 
  Info, User, Key, Clock, HelpCircle, Mail, Smartphone,
  Volume2, Eye, EyeOff, Monitor, Sun, Moon, Download, Upload,
  Database, Wifi, WifiOff, Battery, Zap, Activity, BarChart3,
  FileText, Trash2, RefreshCw, CheckCircle, AlertTriangle,
  Camera, Edit, Save, X, Plus, Minus, Lock, Unlock,
  MessageSquare, Star, Settings2, Wrench, Bug, Github,
  Heart, Coffee, Award, Target, TrendingUp, Users
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { language, setLanguage, t, languages } = useI18n();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Enhanced Settings state
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    soundNotifications: true,
    notificationSound: 'default',
    notificationVolume: 75,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
    
    // Security
    twoFactorAuth: false,
    autoLogout: true,
    sessionTimeout: 30,
    loginAlerts: true,
    deviceTracking: true,
    passwordExpiry: false,
    
    // Appearance
    compactMode: false,
    showAnimations: true,
    highContrast: false,
    fontSize: 'medium',
    sidebarCollapsed: false,
    
    // Privacy
    analytics: true,
    crashReporting: true,
    usageData: false,
    locationTracking: false,
    
    // Performance
    autoSave: true,
    cacheSize: 100,
    offlineMode: false,
    
    // Accessibility
    screenReader: false,
    keyboardNavigation: true,
    reducedMotion: false,
  });

  // System info state
  const [systemInfo, setSystemInfo] = useState({
    platform: 'Web',
    browser: 'Chrome',
    version: '120.0.0',
    lastLogin: new Date().toISOString(),
    storageUsed: 45,
    cacheSize: 23,
    sessionDuration: '2h 34m',
  });

  // Activity stats
  const [activityStats, setActivityStats] = useState({
    totalLogins: 127,
    patientsViewed: 89,
    reportsGenerated: 23,
    settingsChanged: 15,
    averageSessionTime: '1h 45m',
    lastActive: new Date().toISOString(),
  });

  // Modal states
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const { isOpen: isAboutOpen, onOpen: onAboutOpen, onClose: onAboutClose } = useDisclosure();

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Loading states
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }

    // Simulate system info detection
    setSystemInfo(prev => ({
      ...prev,
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
               navigator.userAgent.includes('Firefox') ? 'Firefox' : 
               navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
      platform: navigator.platform || 'Unknown',
    }));
  }, []);

  const handleSettingChange = (key: string, value: boolean | number | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Auto-save for certain settings
    if (['theme', 'language', 'compactMode'].includes(key)) {
      setTimeout(() => {
        handleSaveSettings(false);
      }, 500);
    }
  };

  const handleSaveSettings = async (showToast = true) => {
    setSaving(true);
    try {
      // Save to localStorage (in real app, would save to API)
    localStorage.setItem('userSettings', JSON.stringify(settings));
      
      if (showToast) {
        toast.success('Ayarlar başarıyla kaydedildi!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      if (showToast) {
        toast.error('Ayarlar kaydedilirken hata oluştu');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır');
      return;
    }

    try {
    // Here you would call API to change password
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Şifre başarıyla değiştirildi!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    } catch (error) {
      toast.error('Şifre değiştirilirken hata oluştu');
    }
  };

  const handleExportSettings = async () => {
    setExporting(true);
    try {
      const exportData = {
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        user: user?.username,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-${user?.username}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Ayarlar başarıyla dışa aktarıldı!');
      onExportClose();
    } catch (error) {
      toast.error('Dışa aktarma sırasında hata oluştu');
    } finally {
      setExporting(false);
    }
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (importData.settings) {
        setSettings(prev => ({ ...prev, ...importData.settings }));
        await handleSaveSettings(false);
        toast.success('Ayarlar başarıyla içe aktarıldı!');
      } else {
        throw new Error('Geçersiz ayar dosyası');
      }
      
      onImportClose();
    } catch (error) {
      toast.error('İçe aktarma sırasında hata oluştu');
    } finally {
      setImporting(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      const defaultSettings = {
        // Notifications
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        soundNotifications: true,
        notificationSound: 'default',
        notificationVolume: 75,
        quietHours: false,
        quietStart: '22:00',
        quietEnd: '08:00',
        
        // Security
        twoFactorAuth: false,
        autoLogout: true,
        sessionTimeout: 30,
        loginAlerts: true,
        deviceTracking: true,
        passwordExpiry: false,
        
        // Appearance
        compactMode: false,
        showAnimations: true,
        highContrast: false,
        fontSize: 'medium',
        sidebarCollapsed: false,
        
        // Privacy
        analytics: true,
        crashReporting: true,
        usageData: false,
        locationTracking: false,
        
        // Performance
        autoSave: true,
        cacheSize: 100,
        offlineMode: false,
        
        // Accessibility
        screenReader: false,
        keyboardNavigation: true,
        reducedMotion: false,
      };

      setSettings(defaultSettings);
      localStorage.removeItem('userSettings');
      toast.success('Ayarlar varsayılan değerlere sıfırlandı!');
      onResetClose();
    } catch (error) {
      toast.error('Sıfırlama sırasında hata oluştu');
    }
  };

  const handleClearCache = async () => {
    try {
      // Clear various caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear localStorage except for essential data
      const essentialKeys = ['userSettings', 'authToken'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!essentialKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      toast.success('Önbellek başarıyla temizlendi!');
      
      // Update system info
      setSystemInfo(prev => ({ ...prev, cacheSize: 0 }));
    } catch (error) {
      toast.error('Önbellek temizlenirken hata oluştu');
    }
  };

  const getUserRole = () => {
    if (!user) return t('user.guest');
    switch (user.permLevel) {
      case 3: return 'Sistem Yöneticisi';
      case 2: return 'Doktor';
      case 1: return 'Hemşire';
      default: return 'Kullanıcı';
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    return Math.min(100, strength);
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 40) return 'danger';
    if (strength < 70) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 40) return 'Zayıf';
    if (strength < 70) return 'Orta';
    return 'Güçlü';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg">
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Sistem Ayarları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
              Kişiselleştirme ve güvenlik seçenekleri
          </p>
        </div>
      </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat" startContent={<Settings2 size={16} />}>
                Hızlı İşlemler
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Quick actions">
              <DropdownItem key="export" startContent={<Download size={16} />} onPress={onExportOpen}>
                Ayarları Dışa Aktar
              </DropdownItem>
              <DropdownItem key="import" startContent={<Upload size={16} />} onPress={onImportOpen}>
                Ayarları İçe Aktar
              </DropdownItem>
              <DropdownItem key="cache" startContent={<Trash2 size={16} />} onPress={handleClearCache}>
                Önbelleği Temizle
              </DropdownItem>
              <DropdownItem key="reset" startContent={<RefreshCw size={16} />} onPress={onResetOpen} color="danger">
                Fabrika Ayarları
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          
          <Button 
            color="primary" 
            onPress={() => handleSaveSettings(true)}
            isLoading={saving}
            startContent={<Save size={16} />}
          >
            Kaydet
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sistem Durumu</p>
                <p className="text-xl font-semibold text-success">Çevrimiçi</p>
              </div>
              <CheckCircle className="text-success" size={24} />
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Oturum Süresi</p>
                <p className="text-xl font-semibold">{systemInfo.sessionDuration}</p>
              </div>
              <Clock className="text-primary" size={24} />
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Depolama</p>
                <p className="text-xl font-semibold">{systemInfo.storageUsed}%</p>
              </div>
              <Database className="text-warning" size={24} />
            </div>
            <Progress 
              value={systemInfo.storageUsed} 
              color="warning" 
              size="sm" 
              className="mt-2"
            />
          </CardBody>
        </Card>
        
        <Card className="border-l-4 border-l-secondary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Önbellek</p>
                <p className="text-xl font-semibold">{systemInfo.cacheSize} MB</p>
              </div>
              <Zap className="text-secondary" size={24} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs aria-label="Settings tabs" className="w-full" variant="underlined">
        {/* Profile & General */}
        <Tab key="profile" title={
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profil</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            {/* Enhanced User Profile */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-6">
                <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                  <Avatar
                    name={user?.username}
                    size="lg"
                        className="ring-4 ring-white/20 shadow-lg"
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        color="primary"
                        className="absolute -bottom-1 -right-1"
                      >
                        <Camera size={12} />
                      </Button>
                    </div>
                  <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {user?.username}
                    </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip size="sm" color="primary" variant="solid">
                      {getUserRole()}
                    </Chip>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Son giriş: {new Date(systemInfo.lastLogin).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <Button variant="flat" size="sm" startContent={<Edit size={14} />}>
                    Düzenle
                  </Button>
                </div>
              </div>
              
              <CardBody className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full">
                      <Activity className="text-primary" size={20} />
                    </div>
                    <p className="text-2xl font-bold">{activityStats.totalLogins}</p>
                    <p className="text-sm text-gray-500">Toplam Giriş</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-success/10 rounded-full">
                      <Users className="text-success" size={20} />
                    </div>
                    <p className="text-2xl font-bold">{activityStats.patientsViewed}</p>
                    <p className="text-sm text-gray-500">Hasta Görüntülendi</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-warning/10 rounded-full">
                      <TrendingUp className="text-warning" size={20} />
                    </div>
                    <p className="text-2xl font-bold">{activityStats.reportsGenerated}</p>
                    <p className="text-sm text-gray-500">Rapor Oluşturuldu</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Language & Region */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dil ve Bölge</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Arayüz Dili"
                  selectedKeys={[language]}
                  onSelectionChange={(keys) => {
                    const selectedLang = Array.from(keys)[0] as string;
                    setLanguage(selectedLang as 'en' | 'tr');
                  }}
                >
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} textValue={lang.name}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                  
                  <Select
                    label="Saat Dilimi"
                    defaultSelectedKeys={["Europe/Istanbul"]}
                  >
                    <SelectItem key="Europe/Istanbul">İstanbul (GMT+3)</SelectItem>
                    <SelectItem key="Europe/London">Londra (GMT+0)</SelectItem>
                    <SelectItem key="America/New_York">New York (GMT-5)</SelectItem>
                  </Select>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Appearance & Customization */}
        <Tab key="appearance" title={
          <div className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Görünüm</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            {/* Theme Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Tema Seçimi</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                <RadioGroup
                  value={theme || 'system'}
                  onValueChange={(value) => setTheme(value)}
                  orientation="horizontal"
                  className="gap-4"
                >
                  <Radio
                    value="light"
                    description="Aydınlık tema"
                    classNames={{
                      base: "flex-1 m-0 bg-content1 hover:bg-content2 cursor-pointer rounded-lg border-2 border-default-200 data-[selected=true]:border-primary",
                      wrapper: "hidden",
                      labelWrapper: "flex flex-col items-center p-4",
                    }}
                  >
                    <Sun className="mb-2" size={24} />
                    <span className="font-medium">Açık</span>
                  </Radio>
                  <Radio
                    value="dark"
                    description="Karanlık tema"
                    classNames={{
                      base: "flex-1 m-0 bg-content1 hover:bg-content2 cursor-pointer rounded-lg border-2 border-default-200 data-[selected=true]:border-primary",
                      wrapper: "hidden",
                      labelWrapper: "flex flex-col items-center p-4",
                    }}
                  >
                    <Moon className="mb-2" size={24} />
                    <span className="font-medium">Koyu</span>
                  </Radio>
                  <Radio
                    value="system"
                    description="Sistem ayarı"
                    classNames={{
                      base: "flex-1 m-0 bg-content1 hover:bg-content2 cursor-pointer rounded-lg border-2 border-default-200 data-[selected=true]:border-primary",
                      wrapper: "hidden",
                      labelWrapper: "flex flex-col items-center p-4",
                    }}
                  >
                    <Monitor className="mb-2" size={24} />
                    <span className="font-medium">Sistem</span>
                  </Radio>
                </RadioGroup>
              </CardBody>
            </Card>

            {/* Display Settings */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Görüntü Ayarları</h3>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Kompakt Mod</p>
                      <p className="text-sm text-gray-500">Daha az boşluk, daha fazla içerik</p>
                    </div>
                    <Switch
                      isSelected={settings.compactMode}
                      onValueChange={(value) => handleSettingChange('compactMode', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Animasyonlar</p>
                      <p className="text-sm text-gray-500">Geçiş efektleri ve animasyonlar</p>
                    </div>
                    <Switch
                      isSelected={settings.showAnimations}
                      onValueChange={(value) => handleSettingChange('showAnimations', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Yüksek Kontrast</p>
                      <p className="text-sm text-gray-500">Erişilebilirlik için daha belirgin renkler</p>
                    </div>
                    <Switch
                      isSelected={settings.highContrast}
                      onValueChange={(value) => handleSettingChange('highContrast', value)}
                    />
                  </div>
                </div>
                
                <Divider />
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Yazı Tipi Boyutu
                    </label>
                <Select
                      selectedKeys={[settings.fontSize]}
                  onSelectionChange={(keys) => {
                        const size = Array.from(keys)[0] as string;
                        handleSettingChange('fontSize', size);
                  }}
                  className="max-w-xs"
                >
                      <SelectItem key="small">Küçük</SelectItem>
                      <SelectItem key="medium">Orta</SelectItem>
                      <SelectItem key="large">Büyük</SelectItem>
                      <SelectItem key="xl">Çok Büyük</SelectItem>
                </Select>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Notifications */}
        <Tab key="notifications" title={
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Bildirimler</span>
            <Badge content="3" color="danger" size="sm">
              <span></span>
            </Badge>
          </div>
        }>
          <div className="space-y-6 mt-6">
            {/* Notification Types */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Bildirim Türleri</h3>
                  </div>
                  <Chip size="sm" variant="flat" color="primary">
                    {Object.values(settings).filter(Boolean).length} aktif
                  </Chip>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Accordion>
                  <AccordionItem
                    key="email"
                    title={
                      <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                          <span>E-posta Bildirimleri</span>
                  </div>
                  <Switch
                    isSelected={settings.emailNotifications}
                    onValueChange={(value) => handleSettingChange('emailNotifications', value)}
                          size="sm"
                  />
                </div>
                    }
                  >
                    <div className="pl-8 space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Önemli güncellemeler ve sistem bildirimleri e-posta ile gönderilir.
                      </p>
                <div className="flex items-center justify-between">
                        <span className="text-sm">Hasta randevuları</span>
                        <Switch size="sm" defaultSelected />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sistem güncellemeleri</span>
                        <Switch size="sm" defaultSelected />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Güvenlik uyarıları</span>
                        <Switch size="sm" defaultSelected />
                      </div>
                    </div>
                  </AccordionItem>
                  
                  <AccordionItem
                    key="push"
                    title={
                      <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                          <span>Anlık Bildirimler</span>
                  </div>
                  <Switch
                    isSelected={settings.pushNotifications}
                    onValueChange={(value) => handleSettingChange('pushNotifications', value)}
                          size="sm"
                  />
                </div>
                    }
                  >
                    <div className="pl-8 space-y-3">
                <div className="flex items-center justify-between">
                        <span className="text-sm">Acil durumlar</span>
                        <Switch size="sm" defaultSelected />
                  </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Randevu hatırlatmaları</span>
                        <Switch size="sm" defaultSelected />
                      </div>
                    </div>
                  </AccordionItem>
                </Accordion>
              </CardBody>
            </Card>

            {/* Sound & Volume */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Ses Ayarları</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Ses Bildirimleri</span>
                  <Switch
                    isSelected={settings.soundNotifications}
                    onValueChange={(value) => handleSettingChange('soundNotifications', value)}
                  />
                </div>
                
                {settings.soundNotifications && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ses Seviyesi</label>
                      <Slider
                        value={[settings.notificationVolume]}
                        onChange={(value: number | number[]) => {
                          const vol = Array.isArray(value) ? value[0] : value;
                          handleSettingChange('notificationVolume', vol);
                        }}
                        maxValue={100}
                        step={5}
                        className="max-w-md"
                        color="primary"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Sessiz</span>
                        <span>{settings.notificationVolume}%</span>
                        <span>Yüksek</span>
                      </div>
                    </div>
                    
                    <Select
                      label="Bildirim Sesi"
                      selectedKeys={[settings.notificationSound]}
                      onSelectionChange={(keys) => {
                        const sound = Array.from(keys)[0] as string;
                        handleSettingChange('notificationSound', sound);
                      }}
                      className="max-w-xs"
                    >
                      <SelectItem key="default">Varsayılan</SelectItem>
                      <SelectItem key="chime">Çan</SelectItem>
                      <SelectItem key="alert">Uyarı</SelectItem>
                      <SelectItem key="notification">Bildirim</SelectItem>
                    </Select>
                  </>
                )}
              </CardBody>
            </Card>

            {/* Quiet Hours */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Moon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Sessiz Saatler</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sessiz Saatleri Etkinleştir</p>
                    <p className="text-sm text-gray-500">Belirtilen saatlerde bildirimi sessize al</p>
                  </div>
                  <Switch
                    isSelected={settings.quietHours}
                    onValueChange={(value) => handleSettingChange('quietHours', value)}
                  />
                </div>
                
                {settings.quietHours && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="time"
                      label="Başlangıç"
                      value={settings.quietStart}
                      onChange={(e) => handleSettingChange('quietStart', e.target.value)}
                    />
                    <Input
                      type="time"
                      label="Bitiş"
                      value={settings.quietEnd}
                      onChange={(e) => handleSettingChange('quietEnd', e.target.value)}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Security & Privacy */}
        <Tab key="security" title={
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Güvenlik</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            {/* Password Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Şifre Ayarları</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Mevcut Şifre"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="focus:outline-none"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                
                <div className="space-y-2">
                <Input
                    label="Yeni Şifre"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="focus:outline-none"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                  
                  {passwordData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Şifre Gücü:</span>
                        <span className={`font-medium text-${getPasswordStrengthColor(getPasswordStrength(passwordData.newPassword))}`}>
                          {getPasswordStrengthText(getPasswordStrength(passwordData.newPassword))}
                        </span>
                      </div>
                      <Progress
                        value={getPasswordStrength(passwordData.newPassword)}
                        color={getPasswordStrengthColor(getPasswordStrength(passwordData.newPassword)) as any}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
                
                <Input
                  label="Şifre Tekrarı"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="focus:outline-none"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  color={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword ? 'danger' : 'default'}
                  errorMessage={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword ? 'Şifreler eşleşmiyor' : ''}
                />
                
                <Button 
                  color="primary" 
                  onPress={handlePasswordChange}
                  isDisabled={!passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                  className="w-full"
                >
                  Şifreyi Değiştir
                </Button>
              </CardBody>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">İki Faktörlü Doğrulama</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">2FA Etkinleştir</p>
                    <p className="text-sm text-gray-500">Hesabınızın güvenliğini artırın</p>
                  </div>
                  <Switch
                    isSelected={settings.twoFactorAuth}
                    onValueChange={(value) => handleSettingChange('twoFactorAuth', value)}
                  />
                </div>
                
                {settings.twoFactorAuth && (
                  <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="text-warning mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-warning">2FA Aktif</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Google Authenticator veya benzer bir uygulama kullanarak QR kodu tarayın.
                        </p>
                        <Button size="sm" variant="flat" color="warning" className="mt-2">
                          QR Kodu Göster
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Session & Access */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Oturum ve Erişim</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Otomatik Çıkış</p>
                    <p className="text-sm text-gray-500">Hareketsizlik durumunda çıkış yap</p>
                  </div>
                  <Switch
                    isSelected={settings.autoLogout}
                    onValueChange={(value) => handleSettingChange('autoLogout', value)}
                  />
                </div>
                
                {settings.autoLogout && (
                  <div className="pl-4">
                <Input
                      label="Zaman Aşımı (dakika)"
                  type="number"
                  value={settings.sessionTimeout.toString()}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value) || 30)}
                      endContent={<span className="text-sm text-gray-500">dk</span>}
                  className="max-w-xs"
                      min={5}
                      max={480}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Giriş Uyarıları</p>
                    <p className="text-sm text-gray-500">Yeni cihaz girişlerinde bildir</p>
                  </div>
                  <Switch
                    isSelected={settings.loginAlerts}
                    onValueChange={(value) => handleSettingChange('loginAlerts', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Cihaz Takibi</p>
                    <p className="text-sm text-gray-500">Aktif oturumları izle</p>
                  </div>
                  <Switch
                    isSelected={settings.deviceTracking}
                    onValueChange={(value) => handleSettingChange('deviceTracking', value)}
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* System & Performance */}
        <Tab key="system" title={
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Sistem</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            {/* System Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Sistem Bilgileri</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Platform</p>
                    <p className="font-medium">{systemInfo.platform}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Tarayıcı</p>
                    <p className="font-medium">{systemInfo.browser}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Versiyon</p>
                    <p className="font-medium">v2.1.0</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Son Güncelleme</p>
                    <p className="font-medium">15 Şubat 2024</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Çalışma Süresi</p>
                    <p className="font-medium">{systemInfo.sessionDuration}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Bellek Kullanımı</p>
                    <p className="font-medium">127 MB</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Performance Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Performans Ayarları</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Otomatik Kaydetme</p>
                    <p className="text-sm text-gray-500">Değişiklikleri otomatik olarak kaydet</p>
                  </div>
                  <Switch
                    isSelected={settings.autoSave}
                    onValueChange={(value) => handleSettingChange('autoSave', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Çevrimdışı Mod</p>
                    <p className="text-sm text-gray-500">İnternet bağlantısı olmadan çalış</p>
                  </div>
                  <Switch
                    isSelected={settings.offlineMode}
                    onValueChange={(value) => handleSettingChange('offlineMode', value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Önbellek Boyutu (MB)</label>
                  <Slider
                    value={[settings.cacheSize]}
                    onChange={(value: number | number[]) => {
                      const size = Array.isArray(value) ? value[0] : value;
                      handleSettingChange('cacheSize', size);
                    }}
                    maxValue={500}
                    minValue={50}
                    step={25}
                    className="max-w-md"
                    color="primary"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>50 MB</span>
                    <span>{settings.cacheSize} MB</span>
                    <span>500 MB</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant="flat" 
                    onPress={handleClearCache}
                    startContent={<Trash2 size={16} />}
                  >
                    Önbelleği Temizle
                  </Button>
                  <Button 
                    variant="flat" 
                    color="warning"
                    startContent={<RefreshCw size={16} />}
                  >
                    Sayfayı Yenile
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Gizlilik</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analitik Veriler</p>
                    <p className="text-sm text-gray-500">Kullanım istatistiklerini paylaş</p>
                  </div>
                  <Switch
                    isSelected={settings.analytics}
                    onValueChange={(value) => handleSettingChange('analytics', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Çökme Raporları</p>
                    <p className="text-sm text-gray-500">Hata raporlarını otomatik gönder</p>
                  </div>
                  <Switch
                    isSelected={settings.crashReporting}
                    onValueChange={(value) => handleSettingChange('crashReporting', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Kullanım Verileri</p>
                    <p className="text-sm text-gray-500">Özellik kullanımını takip et</p>
                  </div>
                  <Switch
                    isSelected={settings.usageData}
                    onValueChange={(value) => handleSettingChange('usageData', value)}
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* About & Support */}
        <Tab key="about" title={
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4" />
            <span>Hakkında</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            {/* App Information */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full">
                    <Heart className="text-primary" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Hospital Management System</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Hastane Yönetim Sistemi v2.1.0
                  </p>
                </div>
              </div>
              
              <CardBody className="p-6">
                <div className="text-center space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Modern hastane yönetimi için tasarlanmış, kullanıcı dostu ve güvenli platform.
                  </p>
                  
                  <div className="flex items-center justify-center space-x-6">
                    <Tooltip content="GitHub">
                      <Button isIconOnly variant="flat" size="sm">
                        <Github size={16} />
                  </Button>
                    </Tooltip>
                    <Tooltip content="Dokümantasyon">
                      <Button isIconOnly variant="flat" size="sm">
                        <FileText size={16} />
                  </Button>
                    </Tooltip>
                    <Tooltip content="Destek">
                      <Button isIconOnly variant="flat" size="sm">
                        <MessageSquare size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Değerlendirin">
                      <Button isIconOnly variant="flat" size="sm">
                        <Star size={16} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Version Information */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Sürüm Bilgileri</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Uygulama Sürümü</p>
                    <Code size="sm">v2.1.0</Code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Build Numarası</p>
                    <Code size="sm">2024.02.15.001</Code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">API Sürümü</p>
                    <Code size="sm">v1.0.0</Code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Son Güncelleme</p>
                    <Code size="sm">15 Şubat 2024</Code>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Support & Feedback */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Destek ve Geri Bildirim</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant="flat" 
                    startContent={<HelpCircle size={16} />}
                    onPress={onAboutOpen}
                  >
                    Yardım Merkezi
                  </Button>
                  <Button 
                    variant="flat" 
                    startContent={<Mail size={16} />}
                  >
                    İletişim
                  </Button>
                  <Button 
                    variant="flat" 
                    startContent={<Bug size={16} />}
                  >
                    Hata Bildir
                  </Button>
                  <Button 
                    variant="flat" 
                    startContent={<Star size={16} />}
                  >
                    Değerlendir
                  </Button>
                </div>
                
                <Divider />
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    © 2025 Hospital Management System. Tüm hakları saklıdır.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <Button variant="light" size="sm">Gizlilik Politikası</Button>
                    <Button variant="light" size="sm">Kullanım Şartları</Button>
                    <Button variant="light" size="sm">Lisans</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* Modals */}
      {/* Export Modal */}
      <Modal isOpen={isExportOpen} onClose={onExportClose}>
        <ModalContent>
          <ModalHeader>Ayarları Dışa Aktar</ModalHeader>
          <ModalBody>
            <p>
              Tüm kişisel ayarlarınız bir JSON dosyası olarak kaydedilecek. 
              Bu dosyayı başka bir cihazda içe aktarabilirsiniz.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onExportClose}>
              İptal
        </Button>
            <Button 
              color="primary" 
              onPress={handleExportSettings}
              isLoading={exporting}
            >
              Dışa Aktar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={isImportOpen} onClose={onImportClose}>
        <ModalContent>
          <ModalHeader>Ayarları İçe Aktar</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p>
                Daha önce dışa aktardığınız ayar dosyasını seçin. 
                Mevcut ayarlarınızın üzerine yazılacaktır.
              </p>
              <Input
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                label="Ayar Dosyası Seç"
              />
      </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onImportClose}>
              İptal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reset Modal */}
      <Modal isOpen={isResetOpen} onClose={onResetClose}>
        <ModalContent>
          <ModalHeader>Fabrika Ayarlarına Sıfırla</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-warning mt-1" size={20} />
                <div>
                  <p className="font-medium">Bu işlem geri alınamaz!</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tüm özelleştirilmiş ayarlarınız varsayılan değerlere sıfırlanacak.
                    Profil bilgileriniz ve verileriniz etkilenmeyecek.
                  </p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onResetClose}>
              İptal
            </Button>
            <Button 
              color="danger" 
              onPress={handleResetSettings}
            >
              Sıfırla
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* About Modal */}
      <Modal isOpen={isAboutOpen} onClose={onAboutClose} size="2xl">
        <ModalContent>
          <ModalHeader>Yardım Merkezi</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Sık Sorulan Sorular</h4>
                <Accordion>
                  <AccordionItem key="1" title="Şifremi nasıl değiştirebilirim?">
                    Güvenlik sekmesinden mevcut şifrenizi girip yeni şifre belirleyebilirsiniz.
                  </AccordionItem>
                  <AccordionItem key="2" title="Bildirimleri nasıl özelleştirebilirim?">
                    Bildirimler sekmesinden hangi bildirimleri almak istediğinizi seçebilirsiniz.
                  </AccordionItem>
                  <AccordionItem key="3" title="Temayı nasıl değiştirebilirim?">
                    Görünüm sekmesinden açık, koyu veya sistem temasını seçebilirsiniz.
                  </AccordionItem>
                </Accordion>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Klavye Kısayolları</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Ayarları kaydet</span>
                    <Code size="sm">Ctrl + S</Code>
                  </div>
                  <div className="flex justify-between">
                    <span>Arama</span>
                    <Code size="sm">Ctrl + K</Code>
                  </div>
                  <div className="flex justify-between">
                    <span>Tema değiştir</span>
                    <Code size="sm">Ctrl + Shift + T</Code>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onPress={onAboutClose}>
              Kapat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}