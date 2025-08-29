"use client";

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, CardHeader, Button, Input, Select, SelectItem,
  Tabs, Tab, DatePicker, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Spinner, Chip, Progress
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import {
  BarChart3, LineChart, PieChart, TrendingUp, TrendingDown, Users, Calendar,
  DollarSign, Activity, Download, Filter, RefreshCw, Settings, Eye,
  UserCheck, Clock, AlertTriangle, Building, Stethoscope
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OverviewStats {
  totalPatients: number;
  totalStaff: number;
  totalDepartments: number;
  totalRooms: number;
  newPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  appointmentCompletionRate: number;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [customDateRange, setCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Data states
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [patientAnalytics, setPatientAnalytics] = useState<any>(null);
  const [appointmentAnalytics, setAppointmentAnalytics] = useState<any>(null);
  const [staffAnalytics, setStaffAnalytics] = useState<any>(null);
  const [financialAnalytics, setFinancialAnalytics] = useState<any>(null);
  const [resourceAnalytics, setResourceAnalytics] = useState<any>(null);

  // Modal states
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();
  const [reportType, setReportType] = useState<'comprehensive' | 'patients' | 'appointments' | 'financial'>('comprehensive');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, startDate, endDate]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = customDateRange && startDate && endDate 
        ? { startDate, endDate }
        : { period: selectedPeriod };

      const [
        overviewResponse,
        patientResponse,
        appointmentResponse,
        staffResponse,
        financialResponse,
        resourceResponse
      ] = await Promise.all([
        analyticsAPI.getOverview(params),
        analyticsAPI.getPatientAnalytics(params),
        analyticsAPI.getAppointmentAnalytics(params),
        analyticsAPI.getStaffAnalytics(),
        analyticsAPI.getFinancialAnalytics(),
        analyticsAPI.getResourceAnalytics()
      ]);

      setOverviewStats(overviewResponse.data?.data?.overview);
      setPatientAnalytics(patientResponse.data?.data);
      setAppointmentAnalytics(appointmentResponse.data?.data);
      setStaffAnalytics(staffResponse.data?.data);
      setFinancialAnalytics(financialResponse.data?.data);
      setResourceAnalytics(resourceResponse.data?.data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const reportData = {
        reportType,
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0]
      };

      const response = await analyticsAPI.generateReport(reportData);
      
      // Create and download file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hospital-report-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      onReportClose();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "primary" }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: string;
  }) => (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="ml-1">{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
            <Icon className={`text-${color}-600`} size={24} />
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const ChartCard = ({ title, children, actions }: {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {actions}
      </CardHeader>
      <CardBody className="pt-0">
        {children}
      </CardBody>
    </Card>
  );

  const SimpleBarChart = ({ data, dataKey = 'value', nameKey = 'name' }: {
    data: ChartData[];
    dataKey?: string;
    nameKey?: string;
  }) => (
    <div className="space-y-3">
      {data?.map((item, index) => {
        const maxValue = Math.max(...data.map(d => d[dataKey]));
        const percentage = (item[dataKey] / maxValue) * 100;
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item[nameKey]}</span>
              <span className="font-medium">{item[dataKey]}</span>
            </div>
            <Progress 
              value={percentage}
              className="h-2"
              color="primary"
            />
          </div>
        );
      })}
    </div>
  );

  const SimplePieChart = ({ data, dataKey = 'value', nameKey = 'name' }: {
    data: ChartData[];
    dataKey?: string;
    nameKey?: string;
  }) => {
    const total = data?.reduce((sum, item) => sum + item[dataKey], 0) || 0;
    
    return (
      <div className="space-y-3">
        {data?.map((item, index) => {
          const percentage = total > 0 ? ((item[dataKey] / total) * 100).toFixed(1) : 0;
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
          
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                <span className="text-sm">{item[nameKey]}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{item[dataKey]}</div>
                <div className="text-xs text-gray-500">{percentage}%</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analiz ve Raporlar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Hastane performans metrikleri ve detaylı analizler
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            onPress={() => loadAnalyticsData()}
            startContent={<RefreshCw size={16} />}
          >
            Yenile
          </Button>
          <Button
            color="primary"
            onPress={onReportOpen}
            startContent={<Download size={16} />}
          >
            Rapor Oluştur
          </Button>
        </div>
      </div>

      {/* Time Period Selector */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Zaman Aralığı:</span>
              <Select
                size="sm"
                selectedKeys={[selectedPeriod]}
                className="w-32"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as typeof selectedPeriod;
                  setSelectedPeriod(selected);
                  setCustomDateRange(false);
                }}
              >
                <SelectItem key="7d">Son 7 Gün</SelectItem>
                <SelectItem key="30d">Son 30 Gün</SelectItem>
                <SelectItem key="90d">Son 90 Gün</SelectItem>
                <SelectItem key="1y">Son 1 Yıl</SelectItem>
              </Select>
            </div>
            
            <Button
              size="sm"
              variant={customDateRange ? "solid" : "flat"}
              onPress={() => setCustomDateRange(!customDateRange)}
              startContent={<Calendar size={16} />}
            >
              Özel Aralık
            </Button>
            
            {customDateRange && (
              <>
                <Input
                  size="sm"
                  type="date"
                  label="Başlangıç"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
                <Input
                  size="sm"
                  type="date"
                  label="Bitiş"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Analytics Tabs */}
      <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key as string)}>
        <Tab key="overview" title="Genel Bakış">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Toplam Hasta"
              value={overviewStats?.totalPatients || 0}
              icon={Users}
              trend="up"
              trendValue={`+${overviewStats?.newPatients || 0} yeni`}
              color="blue"
            />
            <StatCard
              title="Toplam Personel"
              value={overviewStats?.totalStaff || 0}
              icon={UserCheck}
              color="green"
            />
            <StatCard
              title="Randevular"
              value={overviewStats?.totalAppointments || 0}
              icon={Calendar}
              trend="up"
              trendValue={`${overviewStats?.appointmentCompletionRate || 0}% tamamlandı`}
              color="purple"
            />
            <StatCard
              title="Departmanlar"
              value={overviewStats?.totalDepartments || 0}
              icon={Building}
              color="orange"
            />
          </div>

          {/* Quick Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Hasta Yaş Dağılımı">
              <SimplePieChart 
                data={patientAnalytics?.ageDistribution?.map((item: any) => ({
                  name: item._id,
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title="Randevu Durumları">
              <SimplePieChart 
                data={appointmentAnalytics?.statusDistribution?.map((item: any) => ({
                  name: item._id,
                  value: item.count
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>

        <Tab key="patients" title="Hasta Analizleri">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Cinsiyet Dağılımı">
              <SimplePieChart 
                data={patientAnalytics?.genderDistribution?.map((item: any) => ({
                  name: item._id || 'Belirtilmemiş',
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title="Kan Grubu Dağılımı">
              <SimpleBarChart 
                data={patientAnalytics?.bloodTypeDistribution?.map((item: any) => ({
                  name: item._id || 'Belirtilmemiş',
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title="Yaş Grupları">
              <SimpleBarChart 
                data={patientAnalytics?.ageDistribution?.map((item: any) => ({
                  name: item._id,
                  value: item.count
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>

        <Tab key="appointments" title="Randevu Analizleri">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Departmanlara Göre Randevular">
              <SimpleBarChart 
                data={appointmentAnalytics?.departmentStats?.map((item: any) => ({
                  name: item._id || 'Belirtilmemiş',
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title="Saatlik Dağılım">
              <SimpleBarChart 
                data={appointmentAnalytics?.hourlyDistribution?.map((item: any) => ({
                  name: `${item._id}:00`,
                  value: item.count
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>

        <Tab key="staff" title="Personel Analizleri">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Departmanlara Göre Personel">
              <SimpleBarChart 
                data={staffAnalytics?.staffByDepartment?.map((item: any) => ({
                  name: item._id || 'Belirtilmemiş',
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title="Görevlere Göre Dağılım">
              <SimplePieChart 
                data={staffAnalytics?.staffByRole?.map((item: any) => ({
                  name: item._id,
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title="En Yoğun Personel (Randevu Sayısı)">
              <SimpleBarChart 
                data={staffAnalytics?.staffWorkload?.slice(0, 5)?.map((item: any) => ({
                  name: item._id.name || 'İsimsiz',
                  value: item.totalAppointments
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>

        <Tab key="financial" title="Mali Analizler">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Tedavi Türlerine Göre Gelir">
              <SimpleBarChart 
                data={financialAnalytics?.revenueByType?.map((item: any) => ({
                  name: item._id || 'Belirtilmemiş',
                  value: item.totalRevenue || 0
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title="Aylık Gelir Trendi">
              <SimpleBarChart 
                data={financialAnalytics?.treatmentRevenue?.map((item: any) => ({
                  name: `${item._id.year}/${item._id.month}`,
                  value: item.totalRevenue || 0
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>

        <Tab key="resources" title="Kaynak Kullanımı">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Oda Durumları">
              <SimplePieChart 
                data={resourceAnalytics?.roomUtilization?.map((item: any) => ({
                  name: item._id || 'Belirtilmemiş',
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title="Ekipman Durumları">
              <SimplePieChart 
                data={resourceAnalytics?.equipmentStatus?.map((item: any) => ({
                  name: item._id || 'Belirtilmemiş',
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title="İlaç Stok Seviyeleri">
              <SimplePieChart 
                data={resourceAnalytics?.medicationLevels?.map((item: any) => ({
                  name: item._id,
                  value: item.count
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>
      </Tabs>

      {/* Generate Report Modal */}
      <Modal isOpen={isReportOpen} onClose={onReportClose}>
        <ModalContent>
          <ModalHeader>Rapor Oluştur</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Rapor Türü"
                selectedKeys={[reportType]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as typeof reportType;
                  setReportType(selected);
                }}
              >
                <SelectItem key="comprehensive">Kapsamlı Rapor</SelectItem>
                <SelectItem key="patients">Hasta Raporu</SelectItem>
                <SelectItem key="appointments">Randevu Raporu</SelectItem>
                <SelectItem key="financial">Mali Rapor</SelectItem>
              </Select>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Başlangıç Tarihi"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  label="Bitiş Tarihi"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onReportClose}>
              İptal
            </Button>
            <Button 
              color="primary" 
              onPress={handleGenerateReport}
              isLoading={reportLoading}
            >
              Rapor Oluştur
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
