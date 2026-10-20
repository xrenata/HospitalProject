"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Progress,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  useDisclosure
} from '@heroui/react';
import { Chip } from '@/components/Chip';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatNumber, relativeTime } from '@/lib/utils';
import { dashboardAPI } from '@/lib/api';
import {
  BarChart, Delta, Donut, Legend, SegmentBar, Sparkline, TONE,
  type Segment, type Tone
} from '@/components/charts';
import {
  Users, Calendar, Check, DollarSign, Bell, Clock,
  Bed, TrendingUp, Activity, Settings, AlertTriangle,
  Plus, UserPlus, CalendarPlus, FileText, Stethoscope,
  MessageCircle, Phone, Mail, ChevronDown
} from 'lucide-react';

import toast from 'react-hot-toast';
interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalStaff: number;
  totalRevenue: number;
  appointmentsToday: number;
  availableRooms: number;
  pendingTests: number;
  criticalAlerts: number;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'admission' | 'discharge' | 'emergency';
  patient: string;
  description: string;
  time: string;
  reason?: string;
  staff?: string;
  timestamp?: string;
  status: 'completed' | 'pending' | 'urgent';
}

const initialStats: DashboardStats = {
  totalPatients: 0,
  totalAppointments: 0,
  totalStaff: 0,
  totalRevenue: 0,
  appointmentsToday: 0,
  availableRooms: 0,
  pendingTests: 0,
  criticalAlerts: 0
};

interface Trends {
  days: number;
  labels: string[];
  patients: { series: number[]; total: number; previous: number };
  appointments: { series: number[]; total: number; previous: number };
  revenue: { series: number[]; total: number; previous: number };
  appointmentStatus: { scheduled: number; completed: number; cancelled: number; 'no-show': number };
  rooms: { total: number; available: number; occupied: number; maintenance: number; reserved: number };
  staffByRole: { role: string; count: number }[];
}

function StatCard({
  label,
  value,
  icon,
  href,
  loading,
  series,
  delta,
  tone = 'primary',
  footer,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  href: string;
  loading: boolean;
  series?: number[];
  delta?: { current: number; previous: number } | null;
  tone?: Tone;
  footer?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Card
      isPressable
      className="w-full transition-colors hover:bg-default-50"
      onPress={() => router.push(href)}
   >
      <CardBody className="gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-500">{label}</span>
          <span className="text-foreground-400">{icon}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="truncate text-2xl font-semibold tabular-nums">
            {loading ? <Skeleton className="h-8 w-16 rounded-md" /> : value}
          </div>
          {!loading && delta && <Delta current={delta.current} previous={delta.previous} />}
        </div>
        {series && <Sparkline className={TONE[tone].text} data={series} />}
        {footer}
      </CardBody>
    </Card>
  );
}

function AttentionCard({
  label,
  value,
  caption,
  icon,
  tone,
  loading,
  onPress,
}: {
  label: string;
  value: number;
  caption: string;
  icon: React.ReactNode;
  tone: Tone;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Card isPressable className="w-full transition-colors hover:bg-default-50" onPress={onPress}>
      <CardBody className="flex-row items-center gap-4 p-5">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
            tone === 'default' ? 'bg-default-100 text-foreground-500' : `${TONE[tone].bg}/10 ${TONE[tone].text}`
          }`}
       >
          {icon}
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm text-foreground-500">{label}</p>
          <div className="text-2xl font-semibold tabular-nums">
            {loading ? <Skeleton className="h-8 w-10 rounded-md" /> : value}
          </div>
        </div>
        <span className="hidden text-xs text-foreground-400 sm:block lg:hidden xl:block">{caption}</span>
      </CardBody>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen: isEmergencyOpen, onOpen: onEmergencyOpen, onClose: onEmergencyClose } = useDisclosure();
  const [emergencyType, setEmergencyType] = useState('');
  const [emergencyDescription, setEmergencyDescription] = useState('');

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, activityResponse, trendsResponse] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity(),
          dashboardAPI.getTrends().catch(() => null)
        ]);
        
        setStats(statsResponse.data);
        setRecentActivity(activityResponse.data);
        setTrends(trendsResponse?.data ?? null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep initial empty state on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Chart data
  const rooms = trends?.rooms;
  const roomOccupancy = rooms && rooms.total ? Math.round((rooms.occupied / rooms.total) * 100) : 0;
  const roomSegments: Segment[] = [
    { label: t('home.occupied'), value: rooms?.occupied ?? 0, tone: 'primary' },
    { label: t('home.available'), value: rooms?.available ?? 0, tone: 'success' },
    { label: t('home.reserved'), value: rooms?.reserved ?? 0, tone: 'warning' },
    { label: t('home.maintenance'), value: rooms?.maintenance ?? 0, tone: 'default' },
  ];
  const appointmentSegments: Segment[] = [
    { label: t('home.completed'), value: trends?.appointmentStatus.completed ?? 0, tone: 'success' },
    { label: t('home.scheduled'), value: trends?.appointmentStatus.scheduled ?? 0, tone: 'primary' },
    { label: t('home.cancelled'), value: trends?.appointmentStatus.cancelled ?? 0, tone: 'warning' },
    { label: t('home.no_show'), value: trends?.appointmentStatus['no-show'] ?? 0, tone: 'danger' },
  ];
  const staffTones: Tone[] = ['primary', 'success', 'warning'];
  const staffSegments: Segment[] = (trends?.staffByRole ?? []).slice(0, 3).map((r, i) => ({
    label: r.role,
    value: r.count,
    tone: staffTones[i],
  }));

  // Only offer what this person is allowed to do
  const { can } = useAuth();
  const quickActions = [
    { key: 'new-patient', label: t('home.add_patient'), icon: <UserPlus size={16} />, allowed: can('patients.create') },
    { key: 'new-appointment', label: t('home.schedule_appointment'), icon: <CalendarPlus size={16} />, allowed: can('appointments.create') },
    { key: 'new-record', label: t('home.new_record'), icon: <FileText size={16} />, allowed: can('treatments.create') },
    { key: 'check-rooms', label: t('home.check_rooms'), icon: <Bed size={16} />, allowed: can('rooms.view') },
  ].filter((a) => a.allowed);

  // Quick Actions handlers
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-patient':
        router.push('/dashboard/patients?action=new');
        break;
      case 'new-appointment':
        router.push('/dashboard/appointments?action=new');
        break;
      case 'new-record':
        router.push('/dashboard/medical-records?action=new');
        break;
      case 'check-rooms':
        router.push('/dashboard/rooms');
        break;
      case 'staff-schedule':
        router.push('/dashboard/staff');
        break;
      case 'reports':
        toast.success('Reports functionality coming soon!');
        break;
      default:
        break;
    }
  };

  const handleEmergencyAlert = () => {
    onEmergencyOpen();
  };

  const handleEmergencySubmit = async () => {
    try {
      await dashboardAPI.sendEmergencyAlert({
        type: emergencyType,
        description: emergencyDescription
      });
      
      toast.success('Emergency alert sent successfully to all staff!');
      setEmergencyType('');
      setEmergencyDescription('');
      onEmergencyClose();
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      toast.error('Failed to send emergency alert. Please try again.');
    }
  };

  const handleViewAllAlerts = () => {
    router.push('/dashboard/alerts');
  };

  const handleReviewTests = () => {
    router.push('/dashboard/tests');
  };

  const handleViewAllActivity = () => {
    router.push('/dashboard/activity');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'urgent': return 'danger';
      default: return 'default';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="text-foreground-500" size={16} />;
      case 'admission': return <Users className="text-foreground-500" size={16} />;
      case 'discharge': return <TrendingUp className="text-foreground-500" size={16} />;
      case 'emergency': return <AlertTriangle className="text-danger" size={16} />;
      default: return <Activity className="text-foreground-500" size={16} />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t('home.welcome').replace('{name}', user?.username ?? '')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('home.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button color="primary" variant="flat" size="sm" className="w-full sm:w-auto">
                <Clock className="mr-2" size={16} />
                {t('home.quick_actions')}
                <ChevronDown className="ml-2" size={14} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Quick Actions">
              {quickActions.map((action) => (
                <DropdownItem key={action.key} startContent={action.icon} onPress={() => handleQuickAction(action.key)}>
                  {action.label}
                </DropdownItem>
              )) as any}
            </DropdownMenu>
          </Dropdown>
          <Button color="danger" size="sm" className="w-full sm:w-auto" onPress={handleEmergencyAlert}>
            <AlertTriangle className="mr-2" size={16} />
            {t('home.emergency_alert')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        <StatCard
          delta={trends && { current: trends.patients.total, previous: trends.patients.previous }}
          href="/dashboard/patients"
          icon={<Users size={18} />}
          label={t('home.total_patients')}
          loading={loading}
          series={trends?.patients.series}
          tone="primary"
          value={formatNumber(stats.totalPatients)}
        />
        <StatCard
          delta={trends && { current: trends.appointments.total, previous: trends.appointments.previous }}
          href="/dashboard/appointments"
          icon={<Calendar size={18} />}
          label={t('home.appointments_today')}
          loading={loading}
          series={trends?.appointments.series}
          tone="success"
          value={stats.appointmentsToday}
        />
        <StatCard
          footer={
            <div className="space-y-2.5">
              <SegmentBar segments={staffSegments} />
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {staffSegments.map((s) => (
                  <span key={s.label} className="flex items-center gap-1.5 text-xs text-foreground-500">
                    <span className={`h-2 w-2 rounded-full ${TONE[s.tone].bg}`} />
                    {s.label}
                    <span className="font-medium tabular-nums text-foreground">{s.value}</span>
                  </span>
                ))}
              </div>
            </div>
          }
          href="/dashboard/staff"
          icon={<Stethoscope size={18} />}
          label={t('home.active_staff')}
          loading={loading}
          value={stats.totalStaff}
        />
        <StatCard
          delta={trends && { current: trends.revenue.total, previous: trends.revenue.previous }}
          href="/dashboard/analytics?tab=financial"
          icon={<DollarSign size={18} />}
          label={t('home.monthly_revenue')}
          loading={loading}
          series={trends?.revenue.series}
          tone="warning"
          value={formatCurrency(stats.totalRevenue)}
        />
      </div>

      {/* Appointments + rooms */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 sm:gap-4">
        <Card className="w-full lg:col-span-2">
          <CardBody className="gap-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">{t('home.appointments')}</h3>
                <p className="text-xs text-foreground-500">{t('home.last_days').replace('{n}', String(trends?.days ?? 14))}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold tabular-nums">{trends?.appointments.total ?? 0}</span>
                {trends && (
                  <Delta current={trends.appointments.total} previous={trends.appointments.previous} />
                )}
              </div>
            </div>

            {trends ? (
              <BarChart data={trends.appointments.series} labels={trends.labels} locale={language} />
            ) : (
              <Skeleton className="h-52 w-full rounded-xl" />
            )}

            <div className="space-y-3 border-t border-divider pt-4">
              <SegmentBar segments={appointmentSegments} />
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {appointmentSegments.map((s) => (
                  <span key={s.label} className="flex items-center gap-2 text-xs text-foreground-500">
                    <span className={`h-2 w-2 rounded-full ${TONE[s.tone].bg}`} />
                    {s.label}
                    <span className="font-medium tabular-nums text-foreground">{s.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card
          isPressable
          className="w-full transition-colors hover:bg-default-50"
          onPress={() => router.push('/dashboard/rooms')}
       >
          <CardBody className="gap-5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">{t('home.room_occupancy')}</h3>
                <p className="text-xs text-foreground-500">{t('home.rooms_total').replace('{n}', String(trends?.rooms.total ?? 0))}</p>
              </div>
              <span className="text-foreground-400">
                <Bed size={18} />
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
              <Donut segments={roomSegments}>
                <span className="text-3xl font-semibold tabular-nums">{roomOccupancy}%</span>
                <span className="text-xs text-foreground-500">{t('home.occupied_label')}</span>
              </Donut>
              <div className="w-full min-w-0 max-w-[12rem]">
                <Legend segments={roomSegments} />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Activity + attention */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 sm:gap-4">
        <Card className="w-full lg:col-span-2">
          <CardBody className="p-0">
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-base font-semibold">{t('home.recent_activity')}</h3>
              <Button size="sm" variant="bordered" onPress={handleViewAllActivity}>
                {t('home.view_all')}
              </Button>
            </div>
            <div className="border-t border-divider">
              {loading ? (
                <div className="space-y-4 p-5">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <ul className="divide-y divide-divider">
                  {recentActivity.slice(0, 6).map((activity) => (
                    <li key={activity.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-default-100">
                        {getActivityIcon(activity.type)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{activity.patient}</p>
                          <Chip color={getStatusColor(activity.status)} size="sm" variant="flat">
                            {activity.status}
                          </Chip>
                        </div>
                        <p className="truncate text-xs text-foreground-500">{activity.reason ? `${activity.reason} · ${activity.staff ?? ''}` : activity.description}</p>
                      </div>
                      <span className="shrink-0 text-xs text-foreground-400">{activity.timestamp ? relativeTime(activity.timestamp, language) : activity.time}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                  <Activity className="mb-3 text-foreground-400" size={22} />
                  <p className="text-sm font-medium">{t('home.no_activity')}</p>
                  <p className="mt-1 text-xs text-foreground-500">
                    {t('home.no_activity_desc')}
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 lg:content-start">
          <AttentionCard
            caption={stats.criticalAlerts > 0 ? t('home.needs_attention') : t('home.all_clear')}
            icon={<AlertTriangle size={18} />}
            label={t('home.critical_alerts')}
            loading={loading}
            tone={stats.criticalAlerts > 0 ? 'danger' : 'default'}
            value={stats.criticalAlerts}
            onPress={handleViewAllAlerts}
          />
          <AttentionCard
            caption={t('home.awaiting_review')}
            icon={<Clock size={18} />}
            label={t('home.pending_tests')}
            loading={loading}
            tone={stats.pendingTests > 0 ? 'warning' : 'default'}
            value={stats.pendingTests}
            onPress={handleReviewTests}
          />

          {quickActions.length > 0 && (
            <Card className="w-full sm:col-span-2 lg:col-span-1">
              <CardBody className="p-2">
                <p className="px-3 pb-1 pt-3 text-sm font-semibold">{t('home.quick_actions')}</p>
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground-600 transition-colors hover:bg-default-100 hover:text-foreground"
                    type="button"
                    onClick={() => handleQuickAction(action.key)}
                 >
                    <span className="text-foreground-400">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Emergency Alert Modal */}
      <Modal isOpen={isEmergencyOpen} onClose={onEmergencyClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Emergency Alert</h2>
                <p className="text-sm text-muted-foreground">Send an emergency notification to all staff</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Emergency Type</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg bg-background text-foreground"
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
               >
                  <option value="">Select emergency type...</option>
                  <option value="medical">Medical Emergency</option>
                  <option value="fire">Fire Emergency</option>
                  <option value="security">Security Alert</option>
                  <option value="evacuation">Evacuation Required</option>
                  <option value="system">System Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg bg-background text-foreground min-h-[100px]"
                  placeholder="Describe the emergency situation in detail..."
                  value={emergencyDescription}
                  onChange={(e) => setEmergencyDescription(e.target.value)}
                />
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={16} />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Warning</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      This will send an immediate notification to all hospital staff. Only use for genuine emergencies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onEmergencyClose}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={handleEmergencySubmit}
              isDisabled={!emergencyType || !emergencyDescription.trim()}
           >
              <AlertTriangle className="mr-2" size={16} />
              Send Emergency Alert
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}