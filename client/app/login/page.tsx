"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, CardBody, Button, Input, Progress, Chip, Avatar,
  Divider, Tab, Tabs, Modal, ModalContent, ModalHeader, 
  ModalBody, ModalFooter, useDisclosure, Code, Badge
} from '@heroui/react';
import { 
  Eye, EyeOff, User, Lock, Mail, Phone, Shield, Star,
  Heart, Activity, Users, Clock, ChevronRight, LogIn,
  Sparkles, Zap, Crown, Award, CheckCircle, ArrowRight,
  Building, Stethoscope, Clipboard, Calendar, TrendingUp,
  Globe, Monitor, Smartphone, Wifi, WifiOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { login } = useAuth();
  const router = useRouter();

  // Modal states
  const { isOpen: isDemoOpen, onOpen: onDemoOpen, onClose: onDemoClose } = useDisclosure();
  const { isOpen: isFeaturesOpen, onOpen: onFeaturesOpen, onClose: onFeaturesClose } = useDisclosure();

  // Demo accounts
  const demoAccounts = [
    {
      role: 'Sistem Yöneticisi',
      username: 'admin',
      password: 'admin',
      level: 3,
      icon: Crown,
      color: 'danger',
      gradient: 'from-red-500 to-pink-500',
      permissions: ['Tam Yetki', 'Kullanıcı Yönetimi', 'Sistem Ayarları', 'Raporlar'],
      description: 'Sistemin tüm özelliklerine erişim'
    },
    {
      role: 'Doktor',
      username: 'doctor',
      password: 'doctor',
      level: 2,
      icon: Stethoscope,
      color: 'primary',
      gradient: 'from-blue-500 to-cyan-500',
      permissions: ['Hasta Yönetimi', 'Teşhis', 'Reçete', 'Raporlar'],
      description: 'Hasta bakımı ve tedavi yönetimi'
    },
    {
      role: 'Hemşire',
      username: 'nurse',
      password: 'nurse',
      level: 1,
      icon: Heart,
      color: 'success',
      gradient: 'from-green-500 to-emerald-500',
      permissions: ['Hasta Takibi', 'Vital Signs', 'İlaç Takibi'],
      description: 'Hasta bakımı ve vital signs takibi'
    }
  ];



  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Prevent scroll on body and html
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';

    return () => {
      clearInterval(timer);
      // Restore scroll on cleanup
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
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
    try {
      const success = await login(username, password);
      if (success) {
        toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');
        setTimeout(() => {
        router.push('/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Giriş başarısız! Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (account: typeof demoAccounts[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setSelectedDemo(account.role);
    onDemoClose();
    toast.success(`${account.role} hesabı seçildi`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-purple-500/5 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-cyan-500/5 rounded-full animate-pulse delay-2000"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-sm">
        {/* System Time Display */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl mb-4">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              Hospital Management System
            </h1>
            <p className="text-gray-400 text-sm mb-4">
              Sistem Zamanı
            </p>
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-white mb-1">{formatTime(currentTime)}</p>
              <p className="text-sm text-gray-400">
                {currentTime.toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
          <CardBody className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="relative mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto">
                  <LogIn className="h-7 w-7 text-white" />
                </div>
              </div>
              
              <h2 className="text-lg font-bold text-white mb-1">
                Hoş Geldiniz
              </h2>
              <p className="text-gray-400 text-sm">
                Hesabınıza giriş yapın
              </p>
              
              {selectedDemo && (
                <Chip 
                  color="primary" 
                  variant="flat" 
                  className="mt-3"
                  startContent={<Star size={12} />}
                  size="sm"
                >
                  {selectedDemo} Hesabı Seçili
                </Chip>
              )}
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
                startContent={<User className="h-4 w-4 text-gray-400" />}
                classNames={{
                  input: "text-white bg-transparent text-sm",
                  label: "text-gray-300 text-sm",
                  inputWrapper: "border-gray-600 hover:border-gray-500 focus-within:border-primary bg-gray-800/50",
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
                startContent={<Lock className="h-4 w-4 text-gray-400" />}
                endContent={
                  <button
                    className="focus:outline-none hover:text-primary transition-colors text-gray-400"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                type={isVisible ? "text" : "password"}
                classNames={{
                  input: "text-white bg-transparent text-sm",
                  label: "text-gray-300 text-sm",
                  inputWrapper: "border-gray-600 hover:border-gray-500 focus-within:border-primary bg-gray-800/50",
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

            {/* Divider */}
            <div className="flex items-center my-4">
              <Divider className="flex-1 bg-gray-700" />
              <span className="px-3 text-xs text-gray-500">veya</span>
              <Divider className="flex-1 bg-gray-700" />
            </div>

            {/* Demo Account Button */}
            <Button
              variant="flat"
              color="secondary"
              size="md"
              className="w-full bg-gray-800/50 border border-gray-600 hover:bg-gray-700/50 text-gray-300"
              onPress={onDemoOpen}
              startContent={<Zap className="h-4 w-4" />}
              endContent={<ChevronRight className="h-4 w-4" />}
            >
              Demo Hesapları
            </Button>

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
          <p className="text-xs text-gray-500">
            © 2025 Hospital Management System
          </p>
          <div className="flex items-center justify-center space-x-3 text-xs text-gray-600">
            <button className="hover:text-primary transition-colors">Gizlilik</button>
            <span>•</span>
            <button className="hover:text-primary transition-colors">Kullanım Şartları</button>
            <span>•</span>
            <button className="hover:text-primary transition-colors">Destek</button>
          </div>
        </div>
      </div>

      {/* Demo Accounts Modal */}
      <Modal 
        isOpen={isDemoOpen} 
        onClose={onDemoClose}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          body: "bg-gray-900",
          header: "bg-gray-900 border-b border-gray-700",
          footer: "bg-gray-900 border-t border-gray-700",
        }}
      >
        <ModalContent className="bg-gray-900 text-white">
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-warning" />
              <span className="text-white">Demo Hesapları</span>
            </div>
            <p className="text-sm text-gray-400 font-normal">
              Farklı yetki seviyelerindeki hesapları test edin
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {demoAccounts.map((account, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer hover:scale-[1.02] transition-all duration-200 border-2 bg-gray-800/50 ${
                    selectedDemo === account.role ? 'border-primary' : 'border-gray-700'
                  }`}
                  isPressable
                  onPress={() => handleDemoLogin(account)}
                >
                  <CardBody className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 bg-gradient-to-r ${account.gradient} rounded-xl shadow-lg`}>
                        <account.icon className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-white">{account.role}</h3>
                          <Chip 
                            size="sm" 
                            color={account.color as any} 
                            variant="flat"
                          >
                            Level {account.level}
                          </Chip>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3">
                          {account.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Kullanıcı Adı</p>
                            <Code size="sm" color="primary" className="bg-gray-700 text-white">{account.username}</Code>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Şifre</p>
                            <Code size="sm" color="primary" className="bg-gray-700 text-white">{account.password}</Code>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Yetkiler:</p>
                          <div className="flex flex-wrap gap-1">
                            {account.permissions.map((permission, i) => (
                              <Chip key={i} size="sm" variant="dot" color="success">
                                {permission}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center">
                        <Award className={`h-5 w-5 text-${account.color} mb-2`} />
                        <Button
                          size="sm"
                          color={account.color as any}
                          variant="flat"
                          onPress={() => handleDemoLogin(account)}
                        >
                          Seç
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            
            <Card className="bg-gray-800/50 border border-gray-600">
              <CardBody className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-300 mb-1">
                      Güvenlik Bilgisi
                    </h4>
                    <p className="text-sm text-gray-400">
                      Bu demo hesaplar test amaçlıdır. Gerçek ortamda güçlü şifreler kullanın 
                      ve hesap bilgilerinizi kimseyle paylaşmayın.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onDemoClose} className="bg-gray-700 text-white">
              Kapat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

            {/* Features Modal */}
      <Modal 
        isOpen={isFeaturesOpen} 
        onClose={onFeaturesClose}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          body: "bg-gray-900",
          header: "bg-gray-900 border-b border-gray-700",
          footer: "bg-gray-900 border-t border-gray-700",
        }}
      >
        <ModalContent className="bg-gray-900 text-white">
          <ModalHeader>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-white">Sistem Özellikleri</span>
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
                <Card key={index} className="hover:shadow-lg transition-shadow bg-gray-800/50 border border-gray-700">
                  <CardBody className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-white">{feature.title}</h3>
                        <p className="text-sm text-gray-400 mb-3">
                          {feature.description}
                        </p>
                        <div className="space-y-1">
                          {feature.features.map((item, i) => (
                            <div key={i} className="flex items-center space-x-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-success" />
                              <span className="text-gray-400">{item}</span>
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
              Anladım
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}