"use client";

import React, { useState, useEffect } from "react";
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Select, 
  SelectItem, 
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
  Tooltip,
  Badge,
  Avatar
} from "@heroui/react";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  Users,
  UserCheck,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  RefreshCw,
  TrendingUp,
  Activity
} from "lucide-react";
import { departmentsAPI, staffAPI } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import toast from "react-hot-toast";

interface Department {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  head_staff_id?: string | {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  budget?: number;
  location?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  status: 'active' | 'inactive';
  staffCount?: number;
  statistics?: {
    totalStaff: number;
    activeStaff: number;
    doctorCount: number;
    nurseCount: number;
  };
  staff?: any[];
  createdAt: string;
  updatedAt: string;
}

interface Staff {
  _id: string;
  name: string;
  email: string;
  role: string;
  specialization?: string;
  department_id?: string;
  departmentId?: string;
}

interface DepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  totalStaff: number;
  assignedStaff: number;
  unassignedStaff: number;
  topDepartments: Array<{
    name: string;
    count: number;
    id?: string;
  }>;
}

const DepartmentsPage = () => {
  const { t } = useI18n();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const itemsPerPage = 10;
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    head_staff_id: "",
    budget: "",
    location: "",
    phone: "",
    email: "",
    capacity: "",
    status: "active" as 'active' | 'inactive'
  });

  const statuses = [
    { key: "active", label: t("departments.active") || "Active", color: "success" },
    { key: "inactive", label: t("departments.inactive") || "Inactive", color: "danger" }
  ];

  // Load data
  useEffect(() => {
    loadDepartments();
    loadStaff();
    loadStats();
  }, [currentPage, searchTerm, selectedStatus]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;

      const response = await departmentsAPI.getAll(params);
      const data = response.data;
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Departments API Response:', data);
        console.log('Data type:', typeof data);
        console.log('Is Array:', Array.isArray(data));
      }
      
      // Handle different response formats like staff API
      let departmentsData = [];
      if (Array.isArray(data)) {
        // Direct array response (old format)
        departmentsData = data;
        setTotalPages(Math.ceil(data.length / itemsPerPage));
        setTotalDepartments(data.length);
      } else if (data && data.departments && Array.isArray(data.departments)) {
        // Wrapped response with pagination (new format)
        departmentsData = data.departments;
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalDepartments(data.pagination?.totalItems || 0);
      } else if (data && data.data && Array.isArray(data.data)) {
        // Another possible format
        departmentsData = data.data;
        setTotalPages(data.pagination?.totalPages || Math.ceil(data.data.length / itemsPerPage));
        setTotalDepartments(data.pagination?.totalItems || data.data.length);
      } else {
        // Fallback - try to use data directly or empty array
        console.warn('Unexpected response format:', data);
        departmentsData = data && typeof data === 'object' && !Array.isArray(data) ? [] : (data || []);
        setTotalPages(1);
        setTotalDepartments(0);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Processed departments data:', departmentsData);
      }
      setDepartments(departmentsData);
      
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error(t("departments.error_loading") || "Error loading departments");
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      const staffData = response.data.data || response.data || [];
      if (process.env.NODE_ENV === 'development') {
        console.log('Staff API Response:', response.data);
      }
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaff([]); // Ensure staff is always an array
    }
  };

  const loadStats = async () => {
    try {
      const response = await departmentsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      head_staff_id: "",
      budget: "",
      location: "",
      phone: "",
      email: "",
      capacity: "",
      status: "active"
    });
    setSelectedDepartment(null);
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error(t("departments.required_fields") || "Please fill in required fields");
        return;
      }

      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        head_staff_id: formData.head_staff_id || undefined
      };

      if (isEditing && selectedDepartment) {
        await departmentsAPI.update(selectedDepartment._id, submitData);
        toast.success(t("departments.department_updated") || "Department updated successfully");
      } else {
        await departmentsAPI.create(submitData);
        toast.success(t("departments.department_created") || "Department created successfully");
      }

      resetForm();
      onClose();
      loadDepartments();
      loadStats();
    } catch (error: any) {
      console.error('Error saving department:', error);
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(errorMessage || (isEditing ? 
        (t("departments.error_updating") || "Error updating department") : 
        (t("departments.error_creating") || "Error creating department")));
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditing(true);
    
    setFormData({
      name: department.name,
      description: department.description || "",
      head_staff_id: typeof department.head_staff_id === 'string' ? department.head_staff_id : department.head_staff_id?._id || "",
      budget: department.budget?.toString() || "",
      location: department.location || "",
      phone: department.phone || "",
      email: department.email || "",
      capacity: department.capacity?.toString() || "",
      status: department.status
    });
    
    onOpen();
  };

  const handleDelete = async (departmentId: string) => {
    if (!confirm(t("departments.delete_confirmation") || "Are you sure you want to delete this department?")) return;
    
    try {
      await departmentsAPI.delete(departmentId);
      toast.success(t("departments.department_deleted") || "Department deleted successfully");
      loadDepartments();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(errorMessage || (t("departments.error_deleting") || "Error deleting department"));
    }
  };

  const getHeadStaffName = (head_staff: Department['head_staff_id']) => {
    if (!head_staff) return '-';
    if (typeof head_staff === 'string') {
      if (!Array.isArray(staff)) return 'Unknown Staff';
      const found = staff.find(s => s._id === head_staff);
      return found ? found.name : 'Unknown Staff';
    }
    return head_staff.name || 'Unknown Staff';
  };

  const renderCell = (department: Department, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            <Avatar
              icon={<Building2 size={20} />}
              className="bg-primary-100 text-primary-600"
              size="sm"
            />
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize">{department.name}</p>
              <p className="text-bold text-xs capitalize text-default-400">
                {department.location || 'No location'}
              </p>
            </div>
          </div>
        );
      case "head_staff":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">{getHeadStaffName(department.head_staff_id)}</p>
            {typeof department.head_staff_id === 'object' && department.head_staff_id?.role && (
              <p className="text-xs text-default-400">{department.head_staff_id.role}</p>
            )}
          </div>
        );
      case "staff_count":
        return (
          <div className="flex items-center gap-2">
            <Users size={16} className="text-default-400" />
            <span className="text-sm font-medium">{department.staffCount || 0}</span>
          </div>
        );
      case "capacity":
        return (
          <div className="flex items-center gap-2">
            <Badge content={department.capacity || 0} color="primary" size="sm">
              <Building2 size={16} className="text-default-400" />
            </Badge>
          </div>
        );
      case "budget":
        return (
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-default-400" />
            <span className="text-sm">
              {department.budget ? `₺${department.budget.toLocaleString()}` : '-'}
            </span>
          </div>
        );
      case "status":
        const status = statuses.find(s => s.key === department.status);
        return (
          <Chip
            className="capitalize"
            color={status?.color as any}
            size="sm"
            variant="flat"
          >
            {status?.label}
          </Chip>
        );
      case "contact":
        return (
          <div className="flex flex-col gap-1">
            {department.phone && (
              <div className="flex items-center gap-1">
                <Phone size={12} className="text-default-400" />
                <span className="text-xs">{department.phone}</span>
              </div>
            )}
            {department.email && (
              <div className="flex items-center gap-1">
                <Mail size={12} className="text-default-400" />
                <span className="text-xs">{department.email}</span>
              </div>
            )}
            {!department.phone && !department.email && (
              <span className="text-xs text-default-400">No contact</span>
            )}
          </div>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content={t("departments.view") || "View"}>
              <Button size="sm" variant="flat" color="primary" isIconOnly>
                <Eye size={16} />
              </Button>
            </Tooltip>
            <Tooltip content={t("departments.edit") || "Edit"}>
              <Button 
                size="sm" 
                variant="flat" 
                color="warning" 
                isIconOnly
                onPress={() => handleEdit(department)}
              >
                <Edit size={16} />
              </Button>
            </Tooltip>
            <Dropdown>
              <DropdownTrigger>
                <Button size="sm" variant="flat" isIconOnly>
                  <MoreVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Trash2 size={16} />}
                  onPress={() => handleDelete(department._id)}
                >
                  {t("departments.delete") || "Delete"}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return null;
    }
  };

  const filteredDepartments = Array.isArray(departments) ? departments : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("departments.title") || "Department Management"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("departments.subtitle") || "Manage hospital departments and their staff"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="flat"
            color="primary"
            onPress={() => {
              loadDepartments();
              loadStats();
            }}
            isLoading={loading}
            startContent={!loading && <RefreshCw size={16} />}
          >
            {t("departments.refresh") || "Refresh"}
          </Button>
          <Button
            color="primary"
            onPress={() => {
              resetForm();
              onOpen();
            }}
            startContent={<Plus size={16} />}
          >
            {t("departments.add_department") || "Add Department"}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDepartments}</p>
                  <p className="text-sm text-default-500">{t("departments.total_departments") || "Total Departments"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-success-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeDepartments}</p>
                  <p className="text-sm text-default-500">{t("departments.active_departments") || "Active Departments"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Users className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStaff}</p>
                  <p className="text-sm text-default-500">{t("departments.total_staff") || "Total Staff"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-secondary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.assignedStaff}</p>
                  <p className="text-sm text-default-500">{t("departments.assigned_staff") || "Assigned Staff"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder={t("departments.search_placeholder") || "Search departments..."}
                value={searchTerm}
                onValueChange={setSearchTerm}
                startContent={<Search size={16} />}
                className="sm:max-w-xs"
                isClearable
              />
              
              <Select
                label={t("departments.status") || "Status"}
                placeholder={t("departments.select_status") || "Select status"}
                selectedKeys={selectedStatus ? [selectedStatus] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setSelectedStatus(key || "");
                }}
                className="sm:max-w-xs"
                isClearable
              >
                {statuses.map((status) => (
                  <SelectItem key={status.key}>
                    {status.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || selectedStatus) && (
              <div className="flex justify-end">
                <Button
                  variant="flat"
                  color="default"
                  size="sm"
                  onPress={() => {
                    setSearchTerm('');
                    setSelectedStatus('');
                  }}
                >
                  {t("common.clear_filters") || "Clear Filters"}
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>



      {/* Departments Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">{t('departments.loading') || 'Loading departments...'}</p>
              </div>
            </div>
          ) : (
            <Table aria-label="Departments table">
              <TableHeader>
                <TableColumn key="name">{t("departments.name") || "Name"}</TableColumn>
                <TableColumn key="head_staff">{t("departments.head_staff") || "Head Staff"}</TableColumn>
                <TableColumn key="staff_count">{t("departments.staff_count") || "Staff"}</TableColumn>
                <TableColumn key="capacity">{t("departments.capacity") || "Capacity"}</TableColumn>
                <TableColumn key="budget">{t("departments.budget") || "Budget"}</TableColumn>
                <TableColumn key="contact">{t("departments.contact") || "Contact"}</TableColumn>
                <TableColumn key="status">{t("departments.status") || "Status"}</TableColumn>
                <TableColumn key="actions">{t("departments.actions") || "Actions"}</TableColumn>
              </TableHeader>
              <TableBody emptyContent={
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t("departments.no_departments") || "No departments found"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("departments.no_departments_message") || "No departments have been created yet."}
                  </p>
                </div>
              }>
                {filteredDepartments.map((department) => (
                  <TableRow key={department._id}>
                    {(columnKey) => (
                      <TableCell>{renderCell(department, columnKey)}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {filteredDepartments.length > 0 && (
            <div className="flex justify-center p-4">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Department Modal */}
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
            {isEditing ? 
              (t("departments.edit_department") || "Edit Department") : 
              (t("departments.add_department") || "Add Department")}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("departments.name") || "Department Name"}
                placeholder={t("departments.enter_name") || "Enter department name"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />

              <Select
                label={t("departments.head_staff") || "Head Staff"}
                placeholder={t("departments.select_head_staff") || "Select head staff"}
                selectedKeys={formData.head_staff_id ? [formData.head_staff_id] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({ ...formData, head_staff_id: selectedKey || "" });
                }}
              >
                {Array.isArray(staff) ? staff.map((member) => (
                  <SelectItem key={member._id}>
                    {member.name} - {member.role}
                  </SelectItem>
                )) : []}
              </Select>

              <Input
                label={t("departments.location") || "Location"}
                placeholder={t("departments.enter_location") || "Enter location"}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />

              <Input
                label={t("departments.capacity") || "Capacity"}
                type="number"
                placeholder={t("departments.enter_capacity") || "Enter capacity"}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />

              <Input
                label={t("departments.phone") || "Phone"}
                placeholder={t("departments.enter_phone") || "Enter phone"}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Input
                label={t("departments.email") || "Email"}
                type="email"
                placeholder={t("departments.enter_email") || "Enter email"}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Input
                label={t("departments.budget") || "Budget"}
                type="number"
                placeholder={t("departments.enter_budget") || "Enter budget"}
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                startContent={<span>₺</span>}
              />

              <Select
                label={t("departments.status") || "Status"}
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({ ...formData, status: selectedKey as 'active' | 'inactive' });
                }}
              >
                {statuses.map((status) => (
                  <SelectItem key={status.key}>
                    {status.label}
                  </SelectItem>
                ))}
              </Select>

              <div className="md:col-span-2">
                <Textarea
                  label={t("departments.description") || "Description"}
                  placeholder={t("departments.enter_description") || "Enter department description"}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  minRows={3}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              {t("departments.cancel") || "Cancel"}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isEditing ? 
                (t("departments.update") || "Update") : 
                (t("departments.add") || "Add")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;