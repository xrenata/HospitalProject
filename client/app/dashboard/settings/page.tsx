'use client';

import React, { useState } from 'react';
import {
  Card, CardBody, CardHeader, Button, Select, SelectItem, Switch,
  Input, Divider, Tabs, Tab, Avatar, Chip
} from '@heroui/react';
import { 
  Settings as SettingsIcon, Globe, Palette, Bell, Shield, 
  Info, User, Key, Clock, HelpCircle, Mail, Smartphone,
  Volume2, Eye, EyeOff
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { language, setLanguage, t, languages } = useI18n();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    soundNotifications: true,
    twoFactorAuth: false,
    autoLogout: true,
    sessionTimeout: 30,
  });

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

  const handleSettingChange = (key: string, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    // Save settings to localStorage or API
    localStorage.setItem('userSettings', JSON.stringify(settings));
    alert(t('settings.settings_saved'));
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    // Here you would call API to change password
    alert(t('settings.password_changed'));
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const getUserRole = () => {
    if (!user) return t('user.guest');
    switch (user.permLevel) {
      case 3: return t('user.admin');
      case 2: return t('user.doctor');
      case 1: return t('user.nurse');
      default: return t('user.user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      <Tabs aria-label="Settings tabs" className="w-full">
        {/* General Settings */}
        <Tab key="general" title={
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>{t('settings.general')}</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            {/* User Profile */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">{t('user.profile')}</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar
                    name={user?.username}
                    size="lg"
                    className="ring-2 ring-primary/20"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {user?.username}
                    </h4>
                    <Chip size="sm" color="primary" variant="flat">
                      {getUserRole()}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Language Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('settings.language_selection')}</h3>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('settings.select_language')}
                </p>
                <Select
                  label={t('settings.language')}
                  selectedKeys={[language]}
                  onSelectionChange={(keys) => {
                    const selectedLang = Array.from(keys)[0] as string;
                    setLanguage(selectedLang as 'en' | 'tr');
                  }}
                  className="max-w-xs"
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
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Appearance Settings */}
        <Tab key="appearance" title={
          <div className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>{t('settings.appearance')}</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('settings.theme_selection')}</h3>
                </div>
              </CardHeader>
              <CardBody>
                <Select
                  label={t('settings.theme')}
                  selectedKeys={theme ? [theme] : []}
                  onSelectionChange={(keys) => {
                    const selectedTheme = Array.from(keys)[0] as string;
                    setTheme(selectedTheme);
                  }}
                  className="max-w-xs"
                >
                  <SelectItem key="light">{t('settings.light_theme')}</SelectItem>
                  <SelectItem key="dark">{t('settings.dark_theme')}</SelectItem>
                  <SelectItem key="system">{t('settings.system_theme')}</SelectItem>
                </Select>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Notification Settings */}
        <Tab key="notifications" title={
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>{t('settings.notifications')}</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('settings.notification_settings')}</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>{t('settings.email_notifications')}</span>
                  </div>
                  <Switch
                    isSelected={settings.emailNotifications}
                    onValueChange={(value) => handleSettingChange('emailNotifications', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    <span>{t('settings.push_notifications')}</span>
                  </div>
                  <Switch
                    isSelected={settings.pushNotifications}
                    onValueChange={(value) => handleSettingChange('pushNotifications', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    <span>{t('settings.sms_notifications')}</span>
                  </div>
                  <Switch
                    isSelected={settings.smsNotifications}
                    onValueChange={(value) => handleSettingChange('smsNotifications', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="h-5 w-5 text-gray-500" />
                    <span>{t('settings.sound_notifications')}</span>
                  </div>
                  <Switch
                    isSelected={settings.soundNotifications}
                    onValueChange={(value) => handleSettingChange('soundNotifications', value)}
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Security Settings */}
        <Tab key="security" title={
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>{t('settings.security')}</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            {/* Password Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('settings.password_settings')}</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label={t('settings.current_password')}
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                
                <Input
                  label={t('settings.new_password')}
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                
                <Input
                  label={t('settings.confirm_password')}
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                
                <Button color="primary" onPress={handlePasswordChange}>
                  {t('settings.change_password')}
                </Button>
              </CardBody>
            </Card>

            {/* Security Options */}
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <span>{t('settings.enable_2fa')}</span>
                  </div>
                  <Switch
                    isSelected={settings.twoFactorAuth}
                    onValueChange={(value) => handleSettingChange('twoFactorAuth', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span>{t('settings.auto_logout')}</span>
                  </div>
                  <Switch
                    isSelected={settings.autoLogout}
                    onValueChange={(value) => handleSettingChange('autoLogout', value)}
                  />
                </div>
                
                <Input
                  label={t('settings.session_timeout')}
                  type="number"
                  value={settings.sessionTimeout.toString()}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  endContent={<span className="text-sm text-gray-500">min</span>}
                  className="max-w-xs"
                />
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* About */}
        <Tab key="about" title={
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4" />
            <span>{t('settings.about')}</span>
          </div>
        }>
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('settings.about')}</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.version')}</p>
                    <p className="font-medium">1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.build')}</p>
                    <p className="font-medium">2024.02.15</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.last_updated')}</p>
                    <p className="font-medium">February 15, 2024</p>
                  </div>
                </div>
                
                <Divider />
                
                <div className="space-y-2">
                  <Button variant="flat" startContent={<HelpCircle className="h-4 w-4" />}>
                    {t('settings.documentation')}
                  </Button>
                  <Button variant="flat" startContent={<Mail className="h-4 w-4" />}>
                    {t('settings.contact_support')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button color="primary" size="lg" onPress={handleSaveSettings}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}