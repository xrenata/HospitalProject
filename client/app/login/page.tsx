"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, CardBody, Button, Input, Progress, Chip, Avatar,
  Divider, Tab, Tabs, Modal, ModalContent, ModalHeader, 
  ModalBody, ModalFooter, useDisclosure, Code, Badge
} from '@heroui/react';
import { 
  Eye, EyeOff, User, Lock, Shield, LogIn,
  Sparkles, CheckCircle, Calendar, TrendingUp,
  Globe, Monitor, Smartphone, Wifi, WifiOff, Sun, Moon, Clock, Users, Clipboard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTheme } from 'next-themes';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // Modal states
  const { isOpen: isFeaturesOpen, onOpen: onFeaturesOpen, onClose: onFeaturesClose } = useDisclosure();





  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Make background cover full screen
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.width = '100vw';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';
    document.documentElement.style.width = '100vw';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';

    return () => {
      clearInterval(timer);
      // Restore original styles on cleanup
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.width = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.width = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
    };
  }, []);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setIsLoading(true);
    
    const success = await login(username, password);
    
    if (success) {
      toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } else {
      toast.error('Hatalı kullanıcı adı veya şifre! Lütfen bilgilerinizi kontrol edin.');
    }
    
    setIsLoading(false);
  };



  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-background via-background to-primary-50 dark:from-background dark:via-gray-900 dark:to-gray-800 overflow-hidden flex items-center justify-center p-4">
      {/* Theme Switch */}
      <div className="absolute top-4 right-4 z-20">
        {mounted && (
          <Button
            isIconOnly
            variant="flat"
            className="bg-background/70 backdrop-blur-sm border border-divider hover:bg-background/90"
            onPress={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-foreground" />
            )}
          </Button>
        )}
      </div>
      
      {/* Elegant background pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/8 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-purple-500/8 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-cyan-500/8 rounded-full animate-pulse delay-2000"></div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 dark:from-blue-900/20 dark:to-purple-900/20"></div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-sm">
        {/* System Time Display */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4 ring-4 ring-blue-100 dark:ring-blue-900">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Hospital Management System
            </h1>
            <p className="text-foreground/70 text-sm mb-4">
              Sistem Zamanı
            </p>
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-foreground mb-1">{formatTime(currentTime)}</p>
              <p className="text-sm text-foreground/70">
                {currentTime ? currentTime.toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-background/90 backdrop-blur-sm border border-divider shadow-xl">
          <CardBody className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="relative mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto shadow-md">
                  <LogIn className="h-7 w-7 text-white" />
                </div>
              </div>
              
              <h2 className="text-lg font-bold text-foreground mb-1">
                Hoş Geldiniz
              </h2>
              <p className="text-foreground/70 text-sm">
                Hesabınıza giriş yapın
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                label="Kullanıcı Adı"
                placeholder="Kullanıcı adınızı girin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="bordered"
                size="md"
                isRequired
                startContent={<User className="h-4 w-4 text-foreground/50" />}
                classNames={{
                  input: "text-foreground bg-background text-sm placeholder:text-foreground/40",
                  label: "text-foreground/70 text-sm",
                  inputWrapper: "border-divider hover:border-foreground/40 focus-within:border-primary bg-background",
                }}
              />

              <Input
                label="Şifre"
                placeholder="Şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="bordered"
                size="md"
                isRequired
                startContent={<Lock className="h-4 w-4 text-foreground/50" />}
                endContent={
                  <button
                    className="focus:outline-none hover:text-primary transition-colors text-foreground/50"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                type={isVisible ? "text" : "password"}
                classNames={{
                  input: "text-foreground bg-background text-sm placeholder:text-foreground/40",
                  label: "text-foreground/70 text-sm",
                  inputWrapper: "border-divider hover:border-foreground/40 focus-within:border-primary bg-background",
                }}
              />

              <Button
                type="submit"
                color="primary"
                size="md"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200"
                isLoading={isLoading}
                disabled={isLoading}
                startContent={!isLoading && <LogIn className="h-4 w-4" />}
              >
                {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>



            {/* Progress for demo */}
            {isLoading && (
              <Progress
                size="sm"
                isIndeterminate
                color="primary"
                className="mt-3"
                label="Sisteme bağlanılıyor..."
              />
            )}
          </CardBody>
        </Card>

        {/* Footer */}
        <div className="text-center mt-4 space-y-1">
          <p className="text-xs text-foreground/60">
            {t('login.copyright')}
          </p>
          <div className="flex items-center justify-center space-x-3 text-xs text-foreground/50">
            <button className="hover:text-primary transition-colors">{t('login.privacy')}</button>
            <span>•</span>
            <button className="hover:text-primary transition-colors">Kullanım Şartları</button>
            <span>•</span>
            <button className="hover:text-primary transition-colors">{t('login.support')}</button>
          </div>
        </div>
      </div>



      {/* Features Modal */}
      <Modal 
        isOpen={isFeaturesOpen} 
        onClose={onFeaturesClose}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-background border border-divider",
          body: "bg-background",
          header: "bg-background border-b border-divider",
          footer: "bg-background border-t border-divider",
        }}
      >
        <ModalContent className="bg-background text-foreground">
          <ModalHeader>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-foreground">{t('login.system_features')}</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: Users,
                  title: 'Hasta Yönetimi',
                  description: 'Kapsamlı hasta kayıt ve takip sistemi',
                  features: ['Hasta kayıtları', 'Tıbbi geçmiş', 'Alerji takibi', 'Vital signs']
                },
                {
                  icon: Calendar,
                  title: 'Randevu Sistemi',
                  description: 'Akıllı randevu planlama ve yönetimi',
                  features: ['Online randevu', 'Takvim entegrasyonu', 'SMS hatırlatma', 'Bekleme listesi']
                },
                {
                  icon: Clipboard,
                  title: 'Tedavi Takibi',
                  description: 'Detaylı tedavi ve ilaç yönetimi',
                  features: ['Reçete yönetimi', 'Doktor notları', 'Lab sonuçları', 'Görüntüleme']
                },
                {
                  icon: TrendingUp,
                  title: 'Analitik & Raporlar',
                  description: 'Gelişmiş raporlama ve analiz araçları',
                  features: ['İstatistikler', 'Finansal raporlar', 'Performans analizi', 'Tahminleme']
                },
                {
                  icon: Shield,
                  title: 'Güvenlik',
                  description: 'Üst düzey veri güvenliği ve gizlilik',
                  features: ['Şifreleme', 'Yetki yönetimi', 'Audit log', 'GDPR uyumluluk']
                },
                {
                  icon: Globe,
                  title: 'Multi-Platform',
                  description: 'Web, mobil ve tablet desteği',
                  features: ['Responsive tasarım', 'Offline çalışma', 'Senkronizasyon', 'PWA desteği']
                }
              ].map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow bg-content1 border border-divider">
                  <CardBody className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-foreground">{feature.title}</h3>
                        <p className="text-sm text-foreground/70 mb-3">
                          {feature.description}
                        </p>
                        <div className="space-y-1">
                          {feature.features.map((item, i) => (
                            <div key={i} className="flex items-center space-x-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-success" />
                              <span className="text-foreground/70">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onFeaturesClose}>
              {t('login.understood')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}