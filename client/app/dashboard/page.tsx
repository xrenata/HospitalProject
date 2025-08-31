"use client";

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Chip, Progress, Dropdown, DropdownTrigger,
  DropdownMenu, DropdownItem, Modal, ModalContent, ModalHeader, 
  ModalBody, ModalFooter, useDisclosure
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { dashboardAPI } from '@/lib/api';
import {
  Users, Calendar, Check, DollarSign, Bell, Clock,
  Bed, TrendingUp, Activity, Settings, AlertTriangle,
  Plus, UserPlus, CalendarPlus, FileText, Stethoscope,
  MessageCircle, Phone, Mail, ChevronDown
} from 'lucide-react';

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

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen: isEmergencyOpen, onOpen: onEmergencyOpen, onClose: onEmergencyClose } = useDisclosure();
  const [emergencyType, setEmergencyType] = useState('');
  const [emergencyDescription, setEmergencyDescription] = useState('');

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, activityResponse] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity()
        ]);
        
        setStats(statsResponse.data);
        setRecentActivity(activityResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep initial empty state on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate room occupancy percentage
  const roomOccupancy = Math.round(((45 - stats.availableRooms) / 45) * 100);

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
        alert('Reports functionality coming soon!');
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
      
      alert('Emergency alert sent successfully to all staff!');
      setEmergencyType('');
      setEmergencyDescription('');
      onEmergencyClose();
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      alert('Failed to send emergency alert. Please try again.');
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
      case 'appointment': return <Calendar className="text-blue-500" size={16} />;
      case 'admission': return <Users className="text-green-500" size={16} />;
      case 'discharge': return <TrendingUp className="text-purple-500" size={16} />;
      case 'emergency': return <AlertTriangle className="text-red-500" size={16} />;
      default: return <Activity className="text-gray-500" size={16} />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Here's what's happening at your hospital today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button color="primary" variant="flat" size="sm" className="w-full sm:w-auto">
                <Clock className="mr-2" size={16} />
                Quick Actions
                <ChevronDown className="ml-2" size={14} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Quick Actions">
              <DropdownItem
                key="new-patient"
                startContent={<UserPlus size={16} />}
                onPress={() => handleQuickAction('new-patient')}
              >
                Add New Patient
              </DropdownItem>
              <DropdownItem
                key="new-appointment"
                startContent={<CalendarPlus size={16} />}
                onPress={() => handleQuickAction('new-appointment')}
              >
                Schedule Appointment
              </DropdownItem>
              <DropdownItem
                key="new-record"
                startContent={<FileText size={16} />}
                onPress={() => handleQuickAction('new-record')}
              >
                New Medical Record
              </DropdownItem>
              <DropdownItem
                key="check-rooms"
                startContent={<Bed size={16} />}
                onPress={() => handleQuickAction('check-rooms')}
              >
                Check Room Availability
              </DropdownItem>
              <DropdownItem
                key="staff-schedule"
                startContent={<Stethoscope size={16} />}
                onPress={() => handleQuickAction('staff-schedule')}
              >
                Staff Schedule
              </DropdownItem>
              <DropdownItem
                key="reports"
                startContent={<FileText size={16} />}
                onPress={() => handleQuickAction('reports')}
              >
                Generate Reports
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Button color="danger" size="sm" className="w-full sm:w-auto" onPress={handleEmergencyAlert}>
            <AlertTriangle className="mr-2" size={16} />
            Emergency Alert
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Card 
          className="w-full cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          isPressable
          onPress={() => router.push('/dashboard/patients')}
        >
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Patients</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  {loading ? '...' : formatNumber(stats.totalPatients)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card 
          className="w-full cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          isPressable
          onPress={() => router.push('/dashboard/appointments')}
        >
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Appointments Today</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {loading ? '...' : stats.appointmentsToday}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card 
          className="w-full cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          isPressable
          onPress={() => router.push('/dashboard/staff')}
        >
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Active Staff</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {loading ? '...' : stats.totalStaff}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card 
          className="w-full cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          isPressable
          onPress={() => router.push('/dashboard/analytics?tab=financial')}
        >
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="text-yellow-600 dark:text-yellow-400" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  {loading ? '...' : formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        <Card 
          className="w-full cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          isPressable
          onPress={() => router.push('/dashboard/rooms')}
        >
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Room Occupancy</h3>
              <Chip color={roomOccupancy > 80 ? 'danger' : roomOccupancy > 60 ? 'warning' : 'success'} size="sm">
                {roomOccupancy}%
              </Chip>
            </div>
            <Progress
              value={roomOccupancy}
              color={roomOccupancy > 80 ? 'danger' : roomOccupancy > 60 ? 'warning' : 'success'}
              className="mb-2"
            />
            <p className="text-xs sm:text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${stats.availableRooms} of 45 rooms available`}
            </p>
          </CardBody>
        </Card>

        <Card className="w-full">
          <CardBody className="p-4 sm:p-6">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1">Critical Alerts</h3>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {loading ? '...' : stats.criticalAlerts}
              </p>
              <Button size="sm" color="danger" variant="flat" className="w-full sm:w-auto" onPress={handleViewAllAlerts}>
                View All
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="w-full md:col-span-2 xl:col-span-1">
          <CardBody className="p-4 sm:p-6">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1">Pending Tests</h3>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {loading ? '...' : stats.pendingTests}
              </p>
              <Button size="sm" color="warning" variant="flat" className="w-full sm:w-auto" onPress={handleReviewTests}>
                Review
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="w-full">
        <CardBody className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-0">Recent Activity</h3>
            <Button size="sm" variant="flat" className="w-full sm:w-auto" onPress={handleViewAllActivity}>
              View All
            </Button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="text-muted-foreground animate-pulse" size={24} />
                </div>
                <p className="text-sm text-muted-foreground">Loading recent activity...</p>
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-background rounded-full flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">
                        {activity.patient}
                      </p>
                      <Chip size="sm" color={getStatusColor(activity.status)}>
                        {activity.status}
                      </Chip>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                    {activity.time}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="text-muted-foreground" size={24} />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">No Recent Activity</h4>
                <p className="text-sm text-muted-foreground">
                  There are currently no recent activities to display.
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Emergency Alert Modal */}
      <Modal isOpen={isEmergencyOpen} onClose={onEmergencyClose} size="2xl">
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