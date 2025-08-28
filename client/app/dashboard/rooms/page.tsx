"use client";

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Input, Table, TableHeader, TableColumn, 
  TableBody, TableRow, TableCell, Chip, Pagination, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem,
  Textarea, Progress, Spinner, Tooltip, Badge, Avatar
} from '@heroui/react';
import { 
  Edit, Trash2, Plus, Search, Building2, CheckCircle, Users, BarChart3, 
  RefreshCw, Stethoscope, ShieldCheck, Wrench, Clock, AlertTriangle, 
  BedDouble, Eye, MoreVertical, Filter, Activity, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { roomsAPI, departmentsAPI } from '@/lib/api';
import { Room, Department } from '@/types';
import { getPermissionLevel } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';
import toast from 'react-hot-toast';

interface RoomStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  totalCapacity: number;
  totalOccupancy: number;
  occupancyRate: number;
  averageCapacity: number;
}

export default function RoomsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<RoomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for adding/editing rooms
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'general' as 'general' | 'private' | 'icu' | 'operation' | 'emergency',
    department_id: '',
    capacity: '',
    equipment: '',
    notes: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance' | 'reserved'
  });



  useEffect(() => {
    loadRooms();
    loadDepartments();
    loadStats();
  }, [currentPage, searchTerm, typeFilter, statusFilter, departmentFilter]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        departmentId: departmentFilter !== 'all' ? departmentFilter : undefined,
      };

      const response = await roomsAPI.getAll(params);
      console.log('Rooms API response:', response.data);
      
      // Handle different response formats
      let roomsData = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        roomsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        roomsData = response.data;
      } else {
        console.warn('Unexpected rooms response format:', response.data);
        roomsData = [];
      }
      
      setRooms(roomsData);
      setTotalPages(Math.ceil(roomsData.length / 10));
    } catch (error) {
      console.error('Failed to load rooms:', error);
      toast.error(t("rooms.error_loading") || "Error loading rooms");
      // Fallback to empty array
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll();
      console.log('Departments API response:', response.data);
      
      // Handle different response formats
      let departmentsData = [];
      if (response.data?.departments && Array.isArray(response.data.departments)) {
        departmentsData = response.data.departments;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        departmentsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        departmentsData = response.data;
      } else {
        console.warn('Unexpected departments response format:', response.data);
        departmentsData = [];
      }
      
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Failed to load departments:', error);
      setDepartments([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await roomsAPI.getStats();
      console.log('Room stats response:', response.data);
      
      if (response.data?.data) {
        setStats(response.data.data);
      } else if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load room stats:', error);
    }
  };

  const handleAddRoom = () => {
    setIsAddMode(true);
    setSelectedRoom(null);
    setFormData({
      room_number: '',
      room_type: 'general',
      department_id: '',
      capacity: '',
      equipment: '',
      notes: '',
      status: 'available'
    });
    onOpen();
  };

  const handleEditRoom = (room: Room) => {
    setIsAddMode(false);
    setSelectedRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      department_id: room.department_id,
      capacity: room.capacity.toString(),
      equipment: room.equipment || '',
      notes: room.notes || '',
      status: room.status
    });
    onOpen();
  };

  const resetForm = () => {
    setFormData({
      room_number: '',
      room_type: 'general',
      department_id: '',
      capacity: '',
      equipment: '',
      notes: '',
      status: 'available'
    });
    setSelectedRoom(null);
    setIsAddMode(false);
  };

  const handleSubmit = async () => {
    if (!formData.room_number.trim()) {
      toast.error(t("rooms.required_fields") || "Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        room_number: formData.room_number,
        room_type: formData.room_type,
        department_id: formData.department_id,
        capacity: parseInt(formData.capacity) || 1,
        equipment: formData.equipment,
        notes: formData.notes,
        status: formData.status
      };
      
      if (isAddMode) {
        await roomsAPI.create(submitData);
        toast.success(t("rooms.room_created") || "Room created successfully");
      } else {
        await roomsAPI.update(selectedRoom!.room_id, submitData);
        toast.success(t("rooms.room_updated") || "Room updated successfully");
      }
      
      resetForm();
      onClose();
      loadRooms();
      loadStats();
    } catch (error: any) {
      console.error('Failed to save room:', error);
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(errorMessage || (isAddMode ? 
        (t("rooms.error_creating") || "Error creating room") : 
        (t("rooms.error_updating") || "Error updating room")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm(t("rooms.delete_confirmation") || "Are you sure you want to delete this room?")) return;
    
    try {
      await roomsAPI.delete(roomId);
      toast.success(t("rooms.room_deleted") || "Room deleted successfully");
      loadRooms();
      loadStats();
    } catch (error: any) {
      console.error('Failed to delete room:', error);
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(errorMessage || (t("rooms.error_deleting") || "Error deleting room"));
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: 'available' | 'occupied' | 'maintenance' | 'reserved') => {
    try {
      await roomsAPI.update(roomId, { status: newStatus });
      toast.success(t("rooms.status_updated") || `Room status updated to ${newStatus}`);
      loadRooms();
      loadStats();
    } catch (error: any) {
      console.error('Failed to update room status:', error);
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(errorMessage || (t("rooms.error_status_update") || "Failed to update room status"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'warning';
      case 'maintenance': return 'danger';
      case 'reserved': return 'primary';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'general': return 'default';
      case 'private': return 'secondary';
      case 'icu': return 'danger';
      case 'operation': return 'warning';
      case 'emergency': return 'primary';
      default: return 'default';
    }
  };

  const getDepartmentName = (departmentId: string | any) => {
    if (!departmentId || !Array.isArray(departments)) {
      return 'Unknown Department';
    }
    
    // If departmentId is already populated object with name
    if (typeof departmentId === 'object' && departmentId.name) {
      return departmentId.name;
    }
    
    // Extract string ID from object or use as string
    const idString = typeof departmentId === 'object' ? departmentId._id || departmentId.department_id : departmentId;
    
    // Try both _id and department_id fields for compatibility
    const department = departments.find(d => 
      d._id === idString || 
      d.department_id === idString
    );
    
    return department?.name || 'Unknown Department';
  };

  const getOccupancyPercentage = (room: Room) => {
    return Math.round((room.current_occupancy / room.capacity) * 100);
  };

  const renderCell = (room: Room, columnKey: React.Key) => {
    switch (columnKey) {
      case 'room_info':
        return (
          <div className="flex items-center gap-3">
            <Avatar
              icon={<BedDouble size={20} />}
              className="bg-primary-100 text-primary-600"
              size="sm"
            />
            <div className="flex flex-col">
              <p className="text-bold text-sm">{room.room_number}</p>
              <Chip color={getTypeColor(room.room_type)} size="sm" variant="flat">
                {room.room_type.toUpperCase()}
              </Chip>
            </div>
          </div>
        );
      case 'department':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">{getDepartmentName(room.department_id)}</p>
            <p className="text-xs text-default-400">Department</p>
          </div>
        );
      case 'capacity':
        const occupancyPercentage = getOccupancyPercentage(room);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-default-400" />
              <span className="text-sm font-medium">{room.current_occupancy}/{room.capacity}</span>
            </div>
            <Progress 
              value={occupancyPercentage} 
              color={occupancyPercentage > 80 ? 'danger' : occupancyPercentage > 50 ? 'warning' : 'success'}
              size="sm"
              className="max-w-md"
            />
          </div>
        );
      case 'equipment':
        return (
          <div className="max-w-xs">
            <p className="text-sm truncate" title={room.equipment}>
              {room.equipment || (t("rooms.no_equipment") || "No equipment listed")}
            </p>
          </div>
        );
      case 'status':
        return (
          <Chip color={getStatusColor(room.status)} size="sm" variant="flat">
            {room.status?.charAt(0).toUpperCase() + room.status?.slice(1)}
          </Chip>
        );
      case 'actions':
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content={t("rooms.view") || "View"}>
              <Button size="sm" variant="flat" color="primary" isIconOnly>
                <Eye size={16} />
              </Button>
            </Tooltip>
            <Tooltip content={t("rooms.edit") || "Edit"}>
              <Button 
                size="sm" 
                variant="flat" 
                color="warning" 
                isIconOnly
                onPress={() => handleEditRoom(room)}
              >
                <Edit size={16} />
              </Button>
            </Tooltip>
            {getPermissionLevel(user) >= 3 && (
              <Tooltip content={t("rooms.delete") || "Delete"}>
                <Button 
                  size="sm" 
                  variant="flat" 
                  color="danger" 
                  isIconOnly
                  onPress={() => handleDeleteRoom(room.room_id)}
                >
                  <Trash2 size={16} />
                </Button>
              </Tooltip>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const columns = [
    { key: 'room_info', label: (t("rooms.room_type") || "ROOM & TYPE").toUpperCase() },
    { key: 'department', label: (t("rooms.department") || "DEPARTMENT").toUpperCase() },
    { key: 'capacity', label: (t("rooms.occupancy") || "OCCUPANCY").toUpperCase() },
    { key: 'equipment', label: (t("rooms.equipment") || "EQUIPMENT").toUpperCase() },
    { key: 'status', label: (t("rooms.status") || "STATUS").toUpperCase() },
    { key: 'actions', label: (t("rooms.actions") || "ACTIONS").toUpperCase() }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("rooms.title") || "Room Management"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("rooms.subtitle") || "Manage hospital rooms and track occupancy"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="flat"
            color="primary"
            onPress={() => {
              loadRooms();
              loadStats();
            }}
            isLoading={loading}
            startContent={!loading && <RefreshCw size={16} />}
          >
            {t("rooms.refresh") || "Refresh"}
          </Button>
          {getPermissionLevel(user) >= 2 && (
            <Button
              color="primary"
              onPress={() => {
                resetForm();
                setIsAddMode(true);
                onOpen();
              }}
              startContent={<Plus size={16} />}
            >
              {t("rooms.add_room") || "Add Room"}
            </Button>
          )}
        </div>
      </div>

      {/* Room Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalRooms}</p>
                  <p className="text-sm text-default-500">{t("rooms.total_rooms") || "Total Rooms"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.availableRooms}</p>
                  <p className="text-sm text-default-500">{t("rooms.available_rooms") || "Available Rooms"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <BedDouble className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.occupiedRooms}</p>
                  <p className="text-sm text-default-500">{t("rooms.occupied_rooms") || "Occupied Rooms"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Activity className="h-6 w-6 text-secondary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.occupancyRate}%</p>
                  <p className="text-sm text-default-500">{t("rooms.occupancy_rate") || "Occupancy Rate"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder={t("rooms.search_placeholder") || "Search rooms..."}
                value={searchTerm}
                onValueChange={setSearchTerm}
                startContent={<Search size={16} />}
                className="sm:max-w-xs"
                isClearable
              />
              
              <Select
                label={t("rooms.room_type") || "Type"}
                placeholder={t("rooms.select_type") || "Select type"}
                selectedKeys={typeFilter !== 'all' ? [typeFilter] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setTypeFilter(key || 'all');
                }}
                className="sm:max-w-xs"
                isClearable
              >
                <SelectItem key="general">{t("rooms.general") || "General"}</SelectItem>
                <SelectItem key="private">{t("rooms.private") || "Private"}</SelectItem>
                <SelectItem key="icu">{t("rooms.icu") || "ICU"}</SelectItem>
                <SelectItem key="operation">{t("rooms.operation") || "Operation"}</SelectItem>
                <SelectItem key="emergency">{t("rooms.emergency") || "Emergency"}</SelectItem>
              </Select>
              
              <Select
                label={t("rooms.status") || "Status"}
                placeholder={t("rooms.select_status") || "Select status"}
                selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setStatusFilter(key || 'all');
                }}
                className="sm:max-w-xs"
                isClearable
              >
                <SelectItem key="available">{t("rooms.available") || "Available"}</SelectItem>
                <SelectItem key="occupied">{t("rooms.occupied") || "Occupied"}</SelectItem>
                <SelectItem key="maintenance">{t("rooms.maintenance") || "Maintenance"}</SelectItem>
                <SelectItem key="reserved">{t("rooms.reserved") || "Reserved"}</SelectItem>
              </Select>
              
              <Select
                label={t("rooms.department") || "Department"}
                placeholder={t("rooms.select_department") || "Select department"}
                selectedKeys={departmentFilter !== 'all' ? [departmentFilter] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setDepartmentFilter(key || 'all');
                }}
                className="sm:max-w-xs"
                isClearable
              >
                {Array.isArray(departments) ? departments.map((department) => (
                  <SelectItem key={department._id || department.department_id || Math.random().toString()}>
                    {department.name}
                  </SelectItem>
                )) : []}
              </Select>
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all') && (
              <div className="flex justify-end">
                <Button
                  variant="flat"
                  color="default"
                  size="sm"
                  onPress={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                  }}
                >
                  {t("common.clear_filters") || "Clear Filters"}
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Rooms Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("rooms.no_rooms") || "No rooms found"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("rooms.no_rooms_message") || "No rooms match your search criteria."}
              </p>
            </div>
          ) : (
            <Table aria-label="Rooms table" removeWrapper>
              <TableHeader>
                {columns.map((column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                ))}
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.room_id}>
                    {(columnKey) => (
                      <TableCell>{renderCell(room, columnKey)}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      {/* Add/Edit Room Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => {
          resetForm();
          onClose();
        }} 
        size="2xl" 
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {isAddMode ? 
              (t("rooms.add_room") || "Add Room") : 
              (t("rooms.edit_room") || "Edit Room")}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("rooms.room_number") || "Room Number"}
                placeholder={t("rooms.enter_room_number") || "Enter room number"}
                value={formData.room_number}
                onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                isRequired
              />
              
              <Select
                label={t("rooms.room_type") || "Room Type"}
                placeholder={t("rooms.select_type") || "Select room type"}
                selectedKeys={[formData.room_type]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, room_type: selectedKey as any});
                }}
                isRequired
              >
                <SelectItem key="general">{t("rooms.general") || "General"}</SelectItem>
                <SelectItem key="private">{t("rooms.private") || "Private"}</SelectItem>
                <SelectItem key="icu">{t("rooms.icu") || "ICU"}</SelectItem>
                <SelectItem key="operation">{t("rooms.operation") || "Operation"}</SelectItem>
                <SelectItem key="emergency">{t("rooms.emergency") || "Emergency"}</SelectItem>
              </Select>
              
              <Select
                label={t("rooms.department") || "Department"}
                placeholder={t("rooms.select_department") || "Select department"}
                selectedKeys={formData.department_id ? [formData.department_id] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, department_id: selectedKey || ""});
                }}
                isRequired
              >
                {Array.isArray(departments) ? departments.map((department) => (
                  <SelectItem key={department._id || department.department_id || Math.random().toString()}>
                    {department.name}
                  </SelectItem>
                )) : []}
              </Select>
              
              <Input
                label={t("rooms.capacity") || "Capacity"}
                type="number"
                placeholder={t("rooms.enter_capacity") || "Enter capacity"}
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                isRequired
                min="1"
              />
              
              <Select
                label={t("rooms.status") || "Status"}
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, status: selectedKey as any});
                }}
              >
                <SelectItem key="available">{t("rooms.available") || "Available"}</SelectItem>
                <SelectItem key="occupied">{t("rooms.occupied") || "Occupied"}</SelectItem>
                <SelectItem key="maintenance">{t("rooms.maintenance") || "Maintenance"}</SelectItem>
                <SelectItem key="reserved">{t("rooms.reserved") || "Reserved"}</SelectItem>
              </Select>
              
              <div className="md:col-span-2">
                <Textarea
                  label={t("rooms.equipment") || "Equipment"}
                  placeholder={t("rooms.enter_equipment") || "List available equipment in this room"}
                  value={formData.equipment}
                  onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                  minRows={2}
                />
              </div>
              
              <div className="md:col-span-2">
                <Textarea
                  label={t("rooms.notes") || "Notes"}
                  placeholder={t("rooms.enter_notes") || "Additional notes about this room"}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  minRows={2}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose} isDisabled={submitting}>
              {t("rooms.cancel") || "Cancel"}
            </Button>
            <Button color="primary" onPress={handleSubmit} isLoading={submitting}>
              {isAddMode ? 
                (t("rooms.add") || "Add") : 
                (t("rooms.update") || "Update")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}