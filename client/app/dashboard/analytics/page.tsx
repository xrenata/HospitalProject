"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useI18n } from '@/contexts/I18nContext';
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
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedTab, setSelectedTab] = useState(searchParams?.get('tab') || 'overview');
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
        analyticsAPI.getFinancialAnalytics(params),
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

  const ChartCard = ({ title, children, actions, className }: {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
  }) => (
    <Card className={className}>
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
            {t('analytics.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('analytics.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            onPress={() => loadAnalyticsData()}
            startContent={<RefreshCw size={16} />}
          >
            {t('analytics.refresh')}
          </Button>
          <Button
            color="primary"
            onPress={onReportOpen}
            startContent={<Download size={16} />}
          >
            {t('analytics.generate_report')}
          </Button>
        </div>
      </div>

      {/* Time Period Selector */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('analytics.time_period')}:</span>
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
                <SelectItem key="7d">{t('analytics.last_7_days')}</SelectItem>
                <SelectItem key="30d">{t('analytics.last_30_days')}</SelectItem>
                <SelectItem key="90d">{t('analytics.last_90_days')}</SelectItem>
                <SelectItem key="1y">{t('analytics.last_1_year')}</SelectItem>
              </Select>
            </div>
            
            <Button
              size="sm"
              variant={customDateRange ? "solid" : "flat"}
              onPress={() => setCustomDateRange(!customDateRange)}
              startContent={<Calendar size={16} />}
            >
              {t('analytics.custom_range')}
            </Button>
            
            {customDateRange && (
              <>
                <Input
                  size="sm"
                  type="date"
                  label={t('analytics.start_date')}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
                <Input
                  size="sm"
                  type="date"
                  label={t('analytics.end_date')}
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
        <Tab key="overview" title={t('analytics.overview')}>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title={t('analytics.total_patients')}
              value={overviewStats?.totalPatients || 0}
              icon={Users}
              trend="up"
              trendValue={`+${overviewStats?.newPatients || 0} ${t('analytics.new_patients')}`}
              color="blue"
            />
            <StatCard
              title={t('analytics.total_staff')}
              value={overviewStats?.totalStaff || 0}
              icon={UserCheck}
              color="green"
            />
            <StatCard
              title={t('analytics.appointments')}
              value={overviewStats?.totalAppointments || 0}
              icon={Calendar}
              trend="up"
              trendValue={`${overviewStats?.appointmentCompletionRate || 0}% ${t('analytics.completed_rate')}`}
              color="purple"
            />
            <StatCard
              title={t('analytics.departments')}
              value={overviewStats?.totalDepartments || 0}
              icon={Building}
              color="orange"
            />
          </div>

          {/* Quick Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={t('analytics.age_distribution')}>
              <SimplePieChart 
                data={patientAnalytics?.ageDistribution?.map((item: any) => ({
                  name: item._id,
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title={t('analytics.appointment_status')}>
              <SimplePieChart 
                data={appointmentAnalytics?.statusDistribution?.map((item: any) => ({
                  name: item._id,
                  value: item.count
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>

        <Tab key="patients" title={t('analytics.patient_analytics')}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={t('analytics.gender_distribution')}>
              <SimplePieChart 
                data={patientAnalytics?.genderDistribution?.map((item: any) => ({
                  name: item._id || t('analytics.unspecified'),
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title={t('analytics.blood_type_distribution')}>
              <SimpleBarChart 
                data={patientAnalytics?.bloodTypeDistribution?.map((item: any) => ({
                  name: item._id || t('analytics.unspecified'),
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title={t('analytics.age_groups')}>
              <SimpleBarChart 
                data={patientAnalytics?.ageDistribution?.map((item: any) => ({
                  name: item._id,
                  value: item.count
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>

        <Tab key="appointments" title={t('analytics.appointment_analytics')}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={t('analytics.appointments_by_department')}>
              <SimpleBarChart 
                data={appointmentAnalytics?.departmentStats?.map((item: any) => ({
                  name: item._id || t('analytics.unspecified'),
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title={t('analytics.hourly_distribution')}>
              <SimpleBarChart 
                data={appointmentAnalytics?.hourlyDistribution?.map((item: any) => ({
                  name: `${item._id}:00`,
                  value: item.count
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>

        <Tab key="staff" title={t('analytics.staff_analytics')}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={t('analytics.staff_by_department')}>
              <SimpleBarChart 
                data={staffAnalytics?.staffByDepartment?.map((item: any) => ({
                  name: item._id || t('analytics.unspecified'),
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title={t('analytics.staff_by_role')}>
              <SimplePieChart 
                data={staffAnalytics?.staffByRole?.map((item: any) => ({
                  name: item._id,
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title={t('analytics.busiest_staff')}>
              <SimpleBarChart 
                data={staffAnalytics?.staffWorkload?.slice(0, 5)?.map((item: any) => ({
                  name: item._id.name || t('analytics.unnamed'),
                  value: item.totalAppointments
                })) || []}
              />
            </ChartCard>
          </div>
        </Tab>

        <Tab key="financial" title={t('analytics.financial_analytics')}>
          <div className="space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">{t('analytics.total_revenue')}</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(financialAnalytics?.totalRevenue || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-200 dark:bg-green-800/30 rounded-lg">
                      <DollarSign className="text-green-700 dark:text-green-300" size={24} />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{t('analytics.monthly_average')}</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency((financialAnalytics?.totalRevenue || 0) / 12)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-200 dark:bg-blue-800/30 rounded-lg">
                      <TrendingUp className="text-blue-700 dark:text-blue-300" size={24} />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">{t('analytics.top_service')}</p>
                      <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                        {financialAnalytics?.topService?.name || t('analytics.unspecified')}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        {formatCurrency(financialAnalytics?.topService?.revenue || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-200 dark:bg-purple-800/30 rounded-lg">
                      <Activity className="text-purple-700 dark:text-purple-300" size={24} />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">{t('analytics.growth_rate')}</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        +{(financialAnalytics?.growthRate || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-orange-200 dark:bg-orange-800/30 rounded-lg">
                      <TrendingUp className="text-orange-700 dark:text-orange-300" size={24} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Revenue Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard 
                title={t('analytics.revenue_by_type')}
                actions={
                  <Button size="sm" variant="flat" startContent={<Download size={14} />}>
                    {t('analytics.export')}
                  </Button>
                }
              >
                <div className="space-y-4">
                  {financialAnalytics?.revenueByType?.map((item: any, index: number) => {
                    const maxValue = Math.max(...(financialAnalytics?.revenueByType?.map((d: any) => d.totalRevenue) || [1]));
                    const percentage = ((item.totalRevenue || 0) / maxValue) * 100;
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-indigo-500'];
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                            <span className="text-sm font-medium">{item._id || t('analytics.unspecified')}</span>
                          </div>
                          <span className="text-sm font-bold">{formatCurrency(item.totalRevenue || 0)}</span>
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
              </ChartCard>
              
              <ChartCard 
                title={t('analytics.monthly_revenue_trend')}
                actions={
                  <Button size="sm" variant="flat" startContent={<TrendingUp size={14} />}>
                    {t('analytics.view_details')}
                  </Button>
                }
              >
                <div className="space-y-3">
                  {financialAnalytics?.treatmentRevenue?.slice(-6)?.map((item: any, index: number) => {
                    const maxValue = Math.max(...(financialAnalytics?.treatmentRevenue?.map((d: any) => d.totalRevenue) || [1]));
                    const percentage = ((item.totalRevenue || 0) / maxValue) * 100;
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{`${item._id?.year}/${String(item._id?.month).padStart(2, '0')}`}</span>
                          <span className="font-medium">{formatCurrency(item.totalRevenue || 0)}</span>
                        </div>
                        <Progress 
                          value={percentage}
                          className="h-2"
                          color={percentage > 75 ? 'success' : percentage > 50 ? 'warning' : 'default'}
                        />
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </div>

            {/* Department Revenue and Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartCard title={t('analytics.revenue_by_department')} className="lg:col-span-2">
                <div className="space-y-3">
                  {financialAnalytics?.revenueByDepartment?.map((item: any, index: number) => {
                    const maxValue = Math.max(...(financialAnalytics?.revenueByDepartment?.map((d: any) => d.totalRevenue) || [1]));
                    const percentage = ((item.totalRevenue || 0) / maxValue) * 100;
                    const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500'];
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
                            <div>
                              <span className="text-sm font-medium">{item._id || t('analytics.unspecified')}</span>
                              <p className="text-xs text-gray-500">{item.count} {t('analytics.transactions')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">{formatCurrency(item.totalRevenue || 0)}</span>
                            <p className="text-xs text-gray-500">{((item.totalRevenue || 0) / (financialAnalytics?.totalRevenue || 1) * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                        <Progress 
                          value={percentage}
                          className="h-1.5"
                          color="primary"
                        />
                      </div>
                    );
                  })}
                </div>
              </ChartCard>

              <ChartCard title={t('analytics.payment_methods')}>
                <div className="space-y-4">
                  {financialAnalytics?.paymentMethods?.map((item: any, index: number) => {
                    const total = financialAnalytics?.paymentMethods?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 1;
                    const percentage = ((item.amount || 0) / total) * 100;
                    const colors = ['text-blue-600', 'text-green-600', 'text-yellow-600', 'text-red-600', 'text-purple-600'];
                    const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-red-100', 'bg-purple-100'];
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${bgColors[index % bgColors.length]}`}>
                            <DollarSign className={`${colors[index % colors.length]}`} size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item._id || t('analytics.cash')}</p>
                            <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(item.amount || 0)}</p>
                          <p className="text-xs text-gray-500">{item.count} {t('analytics.payments')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </div>

            {/* Additional Financial Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title={t('analytics.daily_revenue_trend')}>
                <div className="space-y-2">
                  {financialAnalytics?.dailyRevenue?.slice(-14)?.map((item: any, index: number) => {
                    const maxValue = Math.max(...(financialAnalytics?.dailyRevenue?.map((d: any) => d.revenue) || [1]));
                    const percentage = ((item.revenue || 0) / maxValue) * 100;
                    const date = new Date(item.date);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    
                    return (
                      <div key={index} className={`flex items-center justify-between p-2 rounded ${isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500 w-16">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex-1">
                            <Progress 
                              value={percentage}
                              className="h-1.5"
                              color={isWeekend ? 'default' : 'primary'}
                            />
                          </div>
                        </div>
                        <div className="text-xs font-medium w-20 text-right">
                          {formatCurrency(item.revenue || 0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>

              <ChartCard title={t('analytics.financial_summary')}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {financialAnalytics?.totalTransactions || 0}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{t('analytics.total_transactions')}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency((financialAnalytics?.totalRevenue || 0) / (financialAnalytics?.totalTransactions || 1))}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">{t('analytics.average_transaction')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <span className="text-sm font-medium">{t('analytics.pending_payments')}</span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(financialAnalytics?.pendingPayments || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span className="text-sm font-medium">{t('analytics.overdue_payments')}</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(financialAnalytics?.overduePayments || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>
        </Tab>

        <Tab key="resources" title={t('analytics.resource_usage')}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title={t('analytics.room_status')}>
              <SimplePieChart 
                data={resourceAnalytics?.roomUtilization?.map((item: any) => ({
                  name: item._id || t('analytics.unspecified'),
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title={t('analytics.equipment_status')}>
              <SimplePieChart 
                data={resourceAnalytics?.equipmentStatus?.map((item: any) => ({
                  name: item._id || t('analytics.unspecified'),
                  value: item.count
                })) || []}
              />
            </ChartCard>
            
            <ChartCard title={t('analytics.medication_stock_levels')}>
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
          <ModalHeader>{t('analytics.report_modal_title')}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label={t('analytics.report_type')}
                selectedKeys={[reportType]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as typeof reportType;
                  setReportType(selected);
                }}
              >
                <SelectItem key="comprehensive">{t('analytics.comprehensive_report')}</SelectItem>
                <SelectItem key="patients">{t('analytics.patient_report')}</SelectItem>
                <SelectItem key="appointments">{t('analytics.appointment_report')}</SelectItem>
                <SelectItem key="financial">{t('analytics.financial_report')}</SelectItem>
              </Select>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label={t('analytics.start_date_label')}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  label={t('analytics.end_date_label')}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onReportClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              color="primary" 
              onPress={handleGenerateReport}
              isLoading={reportLoading}
            >
              {t('analytics.generate_report_button')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
