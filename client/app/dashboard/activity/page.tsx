"use client";

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Chip, Input, Select, SelectItem,
  Pagination, Spinner, Tabs, Tab, Divider
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { dashboardAPI } from '@/lib/api';
import {
  Activity, Calendar, Users, TrendingUp, AlertTriangle,
  Search, Filter, RefreshCw, Clock, ArrowLeft,
  UserPlus, CalendarCheck, FileText, Stethoscope,
  Bell, Eye, MoreHorizontal
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'appointment' | 'admission' | 'discharge' | 'emergency' | 'test' | 'treatment';
  patient: string;
  description: string;
  time: string;
  status: 'completed' | 'pending' | 'urgent' | 'cancelled';
  category?: string;
  staffMember?: string;
  details?: any;
}

const ActivityPage = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  
  // State
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  // Activity types
  const activityTypes = [
    { key: 'appointment', label: t('activity.activity_types.appointment'), icon: Calendar, color: 'primary' },
    { key: 'admission', label: t('activity.activity_types.admission'), icon: UserPlus, color: 'success' },
    { key: 'discharge', label: t('activity.activity_types.discharge'), icon: TrendingUp, color: 'secondary' },
    { key: 'emergency', label: t('activity.activity_types.emergency'), icon: AlertTriangle, color: 'danger' },
    { key: 'test', label: t('activity.activity_types.test'), icon: FileText, color: 'warning' },
    { key: 'treatment', label: t('activity.activity_types.treatment'), icon: Stethoscope, color: 'primary' }
  ];

  const statusTypes = [
    { key: 'completed', label: t('activity.status_types.completed'), color: 'success' },
    { key: 'pending', label: t('activity.status_types.pending'), color: 'warning' },
    { key: 'urgent', label: t('activity.status_types.urgent'), color: 'danger' },
    { key: 'cancelled', label: t('activity.status_types.cancelled'), color: 'default' }
  ];

  useEffect(() => {
    loadActivities();
  }, [currentPage, searchTerm, typeFilter, statusFilter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // Simulate API call with more comprehensive data
      const response = await dashboardAPI.getRecentActivity(50);
      const allActivities = response.data || [];
      
      // Apply filters
      let filteredActivities = allActivities.filter((activity: ActivityItem) => {
        const matchesSearch = !searchTerm || 
          activity.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = typeFilter === 'all' || activity.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
      });

      // Add some mock data for better demonstration
      const mockActivities = generateMockActivities();
      filteredActivities = [...filteredActivities, ...mockActivities].slice(0, 50);
      
      // Pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedActivities = filteredActivities.slice(startIndex, endIndex);
      
      setActivities(paginatedActivities);
      setTotalItems(filteredActivities.length);
      setTotalPages(Math.ceil(filteredActivities.length / itemsPerPage));
      
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockActivities = (): ActivityItem[] => {
    const mockData = [
      {
        id: 'mock-1',
        type: 'admission' as const,
        patient: 'Mehmet Yılmaz',
        description: 'Emergency admission to ICU',
        time: '2 hours ago',
        status: 'completed' as const,
        staffMember: 'Dr. Ayşe Kaya'
      },
      {
        id: 'mock-2',
        type: 'test' as const,
        patient: 'Fatma Demir',
        description: 'Blood test results ready',
        time: '4 hours ago',
        status: 'completed' as const,
        staffMember: 'Dr. Ali Özkan'
      },
      {
        id: 'mock-3',
        type: 'discharge' as const,
        patient: 'Ahmet Çelik',
        description: 'Patient discharged after surgery',
        time: '6 hours ago',
        status: 'completed' as const,
        staffMember: 'Dr. Zeynep Aslan'
      },
      {
        id: 'mock-4',
        type: 'emergency' as const,
        patient: 'Elif Şahin',
        description: 'Emergency response - cardiac arrest',
        time: '8 hours ago',
        status: 'urgent' as const,
        staffMember: 'Dr. Murat Güven'
      },
      {
        id: 'mock-5',
        type: 'treatment' as const,
        patient: 'Osman Kara',
        description: 'Physical therapy session completed',
        time: '1 day ago',
        status: 'completed' as const,
        staffMember: 'Physiotherapist Seda Yıldız'
      }
    ];

    return mockData;
  };

  const getActivityIcon = (type: string) => {
    const activityType = activityTypes.find(t => t.key === type);
    if (!activityType) return <Activity className="text-gray-500" size={20} />;
    
    const IconComponent = activityType.icon;
    const colorClass = getTypeColor(type);
    
    return <IconComponent className={colorClass} size={20} />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'text-blue-500';
      case 'admission': return 'text-green-500';
      case 'discharge': return 'text-purple-500';
      case 'emergency': return 'text-red-500';
      case 'test': return 'text-orange-500';
      case 'treatment': return 'text-teal-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'urgent': return 'danger';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadActivities();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="flat"
            isIconOnly
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('activity.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('activity.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="flat"
            color="primary"
            onPress={handleRefresh}
            isLoading={loading}
            startContent={!loading && <RefreshCw size={16} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activityTypes.slice(0, 4).map((type) => {
          const count = activities.filter(a => a.type === type.key).length;
          const IconComponent = type.icon;
          
          return (
            <Card key={type.key} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${type.color}-100 dark:bg-${type.color}-900/20`}>
                    <IconComponent className={`text-${type.color}-600 dark:text-${type.color}-400`} size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{type.label}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder={t('activity.search_placeholder')}
                value={searchTerm}
                onValueChange={setSearchTerm}
                startContent={<Search size={16} />}
                className="sm:max-w-xs"
                isClearable
              />
              
              <Select
                placeholder={t('activity.activity_type_placeholder')}
                selectedKeys={typeFilter ? [typeFilter] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setTypeFilter(key || "all");
                }}
                className="sm:max-w-xs"
              >
                <SelectItem key="all">{t('activity.all_types')}</SelectItem>
                {activityTypes.map((type) => (
                  <SelectItem key={type.key}>{type.label}</SelectItem>
                ))}
              </Select>
              
              <Select
                placeholder={t('activity.status_placeholder')}
                selectedKeys={statusFilter ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setStatusFilter(key || "all");
                }}
                className="sm:max-w-xs"
              >
                <SelectItem key="all">{t('activity.all_status')}</SelectItem>
                {statusTypes.map((status) => (
                  <SelectItem key={status.key}>{status.label}</SelectItem>
                ))}
              </Select>
              
              <Button
                variant="flat"
                onPress={handleClearFilters}
                className="sm:w-auto"
              >
                {t('activity.clear_filters')}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('activity.showing_activities', { count: activities.length.toString(), total: totalItems.toString() })}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('activity.no_activities_found')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? t('activity.no_activities_message')
                  : t('activity.try_different_filters')}
              </p>
              {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="flat"
                  onPress={handleClearFilters}
                  className="mt-4"
                >
                  {t('activity.clear_filters')}
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity, index) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Timeline indicator */}
                    <div className="relative">
                      <div className="w-10 h-10 bg-background border-2 border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      {index < activities.length - 1 && (
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-200 dark:bg-gray-700"></div>
                      )}
                    </div>
                    
                    {/* Activity content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {activity.patient}
                            </h3>
                            <Chip
                              size="sm"
                              color={getStatusColor(activity.status) as any}
                              variant="flat"
                            >
                              {t(`activity.status_types.${activity.status}`)}
                            </Chip>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              {activity.time}
                            </div>
                            {activity.staffMember && (
                              <div className="flex items-center gap-1">
                                <Users size={14} />
                                {activity.staffMember}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="flat"
                          size="sm"
                          isIconOnly
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            showShadow
            color="primary"
          />
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
