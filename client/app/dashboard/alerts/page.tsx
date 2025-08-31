"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Pagination,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Tooltip,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Bell, 
  Settings,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { notificationsAPI, dashboardAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'system' | 'appointment' | 'patient' | 'staff' | 'inventory' | 'security';
  sender?: {
    name: string;
    role: string;
    avatar?: string;
  };
  actionUrl?: string;
  data?: any;
  expiresAt?: string;
}

interface AlertsResponse {
  alerts: Alert[];
  totalCount: number;
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AlertsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadAlerts();
  }, [selectedTab, currentPage]);

  const loadAlerts = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      // Try dashboard API first for real alerts
      let response;
      try {
        response = await dashboardAPI.getAlerts();
        console.log('Dashboard API alerts response:', response.data);
        
        // Transform dashboard alerts to expected format
        const dashboardAlerts = response.data.alerts || [];
        
        // Filter based on selected tab
        let filteredAlerts = dashboardAlerts;
        if (selectedTab === 'unread') {
          filteredAlerts = dashboardAlerts.filter((alert: any) => !alert.isRead);
        } else if (selectedTab === 'critical') {
          filteredAlerts = dashboardAlerts.filter((alert: any) => alert.type === 'critical');
        }
        
        // Pagination for dashboard alerts
        const startIndex = (currentPage - 1) * 10;
        const endIndex = startIndex + 10;
        const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);
        
        setAlerts(paginatedAlerts);
        setTotalPages(Math.ceil(filteredAlerts.length / 10));
        setTotalCount(filteredAlerts.length);
        setUnreadCount(dashboardAlerts.filter((alert: any) => !alert.isRead).length);
        
      } catch (dashboardError) {
        console.log('Dashboard API failed, trying notifications API:', dashboardError);
        
        // Fallback to notifications API
        response = await notificationsAPI.getAll({
          page: currentPage,
          limit: 10,
          filter: selectedTab as 'all' | 'unread' | 'critical',
        });
        
        setAlerts(response.data.alerts);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCount(response.data.totalCount);
        setUnreadCount(response.data.unreadCount);
      }
      
    } catch (error: any) {
      console.error('Error loading alerts from both APIs:', error);
      
      // Fallback to mock data if both APIs fail
      console.log('Falling back to mock data...');
      const mockResponse = getMockAlerts();
      setAlerts(mockResponse.alerts);
      setTotalPages(mockResponse.pagination.totalPages);
      setTotalCount(mockResponse.totalCount);
      setUnreadCount(mockResponse.unreadCount);
      
      toast.error(t("alerts.fallback_demo_data"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
  };

  const markAsRead = async (alertId: string) => {
    try {
      // Use the appropriate API based on alert ID format
      if (alertId.startsWith('notification_') || alertId.startsWith('treatment_') || alertId.startsWith('appointment_')) {
        // Dashboard alerts - use dashboard API
        await dashboardAPI.markAlertAsRead(alertId);
      } else {
        // Notification alerts - use notifications API  
        await notificationsAPI.markAsRead(alertId);
      }
      
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success(t("alerts.success_marked_read"));
      
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error(t("alerts.error_marking_read"));
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => ({ ...alert, isRead: true }))
      );
      
      setUnreadCount(0);
      toast.success(t("alerts.success_marked_all_read"));
      
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      toast.error(t("alerts.error_marking_all_read"));
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await notificationsAPI.delete(alertId);
      
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
      setTotalCount(prev => prev - 1);
      toast.success(t("alerts.success_deleted"));
      
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error(t("alerts.error_deleting"));
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getCategoryIcon = (category: Alert['category']) => {
    switch (category) {
      case 'appointment':
        return '📅';
      case 'patient':
        return '👤';
      case 'staff':
        return '👥';
      case 'inventory':
        return '📦';
      case 'security':
        return '🔒';
      default:
        return '⚙️';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t("alerts.time_ago.now");
    if (diffInMinutes < 60) return t("alerts.time_ago.minutes_ago", { minutes: diffInMinutes.toString() });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t("alerts.time_ago.hours_ago", { hours: diffInHours.toString() });
    
    const diffInDays = Math.floor(diffInHours / 24);
    return t("alerts.time_ago.days_ago", { days: diffInDays.toString() });
  };

  const getMockAlerts = (): AlertsResponse => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'critical',
        title: 'Kritik Sistem Uyarısı',
        message: 'Sunucu kapasitesi %95 seviyesine ulaştı. Acil müdahale gerekebilir.',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        isRead: false,
        priority: 'high',
        category: 'system',
        sender: {
          name: 'Sistem',
          role: 'Otomatik',
          avatar: ''
        }
      },
      {
        id: '2',
        type: 'warning',
        title: 'Randevu Hatırlatması',
        message: 'Dr. Mehmet Öz ile 15:30 randevunuz yaklaşıyor.',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        isRead: false,
        priority: 'medium',
        category: 'appointment',
        sender: {
          name: 'Randevu Sistemi',
          role: 'Otomatik',
          avatar: ''
        }
      },
      {
        id: '3',
        type: 'info',
        title: 'Yeni Hasta Kaydı',
        message: 'Ahmet Yılmaz adlı hasta sisteme kaydedildi.',
        timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        isRead: true,
        priority: 'low',
        category: 'patient',
        sender: {
          name: 'Hemşire Ayşe',
          role: 'Hemşire',
          avatar: ''
        }
      },
      {
        id: '4',
        type: 'success',
        title: 'Envanter Güncellendi',
        message: 'Tıbbi malzeme envanteri başarıyla güncellendi.',
        timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
        isRead: true,
        priority: 'low',
        category: 'inventory'
      }
    ];

    const filtered = mockAlerts.filter(alert => {
      if (selectedTab === 'unread') return !alert.isRead;
      if (selectedTab === 'critical') return alert.type === 'critical';
      return true;
    });

    return {
      alerts: filtered,
      totalCount: mockAlerts.length,
      unreadCount: mockAlerts.filter(a => !a.isRead).length,
      pagination: {
        page: currentPage,
        limit: 10,
        totalPages: Math.ceil(filtered.length / 10)
      }
    };
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("alerts.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("alerts.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="flat"
            color="primary"
            onPress={handleRefresh}
            isLoading={refreshing}
            startContent={!refreshing && <RefreshCw size={16} />}
          >
            {t("alerts.refresh")}
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="flat"
              color="secondary"
              onPress={markAllAsRead}
              startContent={<CheckCircle size={16} />}
            >
              {t("alerts.mark_all_read")}
            </Button>
          )}
          
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat" isIconOnly>
                <Settings size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="settings">{t("alerts.settings")}</DropdownItem>
              <DropdownItem key="preferences">{t("alerts.preferences")}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex flex-row items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("alerts.total_alerts")}</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="flex flex-row items-center space-x-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Eye className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("alerts.unread_alerts")}</p>
              <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="flex flex-row items-center space-x-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("alerts.critical_alerts")}</p>
              <p className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.type === 'critical').length}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardBody>
          <Tabs 
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary-500",
              tab: "max-w-fit px-0 h-12",
            }}
          >
            <Tab
              key="all"
              title={
                <div className="flex items-center space-x-2">
                  <span>{t("alerts.all")}</span>
                  <Chip size="sm" variant="flat">{totalCount}</Chip>
                </div>
              }
            />
            <Tab
              key="unread"
              title={
                <div className="flex items-center space-x-2">
                  <span>{t("alerts.unread")}</span>
                  {unreadCount > 0 && (
                    <Chip size="sm" color="warning" variant="flat">{unreadCount}</Chip>
                  )}
                </div>
              }
            />
            <Tab
              key="critical"
              title={
                <div className="flex items-center space-x-2">
                  <span>{t("alerts.critical")}</span>
                  <Chip size="sm" color="danger" variant="flat">
                    {alerts.filter(a => a.type === 'critical').length}
                  </Chip>
                </div>
              }
            />
          </Tabs>
        </CardBody>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("alerts.no_alerts")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTab === 'all' 
                  ? t("alerts.no_alerts_message")
                  : selectedTab === 'unread' 
                    ? t("alerts.no_unread_alerts")
                    : t("alerts.no_critical_alerts")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    !alert.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Category Icon */}
                      <div className="text-2xl">{getCategoryIcon(alert.category)}</div>
                      
                      {/* Alert Icon */}
                      <div className="mt-1">{getAlertIcon(alert.type)}</div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-sm font-semibold ${
                            !alert.isRead 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {alert.title}
                          </h3>
                          
                          {!alert.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(alert.timestamp)}
                          </div>
                          
                          <Chip
                            size="sm"
                            color={getPriorityColor(alert.priority) as any}
                            variant="flat"
                          >
                            {t("alerts.priority_label", { 
                              priority: t(`alerts.priority.${alert.priority}`)
                            })}
                          </Chip>
                          
                          {alert.sender && (
                            <div className="flex items-center text-xs text-gray-500">
                              <span>{alert.sender.name}</span>
                              <span className="mx-1">•</span>
                              <span>{alert.sender.role}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {!alert.isRead && (
                        <Tooltip content={t("alerts.mark_as_read")}>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            isIconOnly
                            onPress={() => markAsRead(alert.id)}
                          >
                            <Eye size={16} />
                          </Button>
                        </Tooltip>
                      )}
                      
                      <Dropdown>
                        <DropdownTrigger>
                          <Button size="sm" variant="flat" isIconOnly>
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          {!alert.isRead && (
                            <DropdownItem
                              key="mark-read"
                              startContent={<Eye size={16} />}
                              onPress={() => markAsRead(alert.id)}
                            >
                              {t("alerts.mark_as_read")}
                            </DropdownItem>
                          )}
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash2 size={16} />}
                            onPress={() => deleteAlert(alert.id)}
                          >
                            {t("alerts.delete")}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
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
}