"use client";

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Input, Table, TableHeader, TableColumn, 
  TableBody, TableRow, TableCell, Chip, Pagination, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem
} from '@heroui/react';
import { DatePicker } from '@heroui/date-picker';
import { parseDate } from '@internationalized/date';
import { Edit, Trash2, Plus, Search, Users, Stethoscope, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { staffAPI, departmentsAPI } from '@/lib/api';
import { Staff, Department, PermissionLevel } from '@/types';
import { formatDate, getPermissionLevel, hasPermission, getErrorMessage, toDateString } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useI18n } from '@/contexts/I18nContext';

export default function StaffPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Permission checks
  const userPermLevel = getPermissionLevel(user);
  const canViewStaff = hasPermission(userPermLevel, PermissionLevel.NURSE);
  const canEditStaff = hasPermission(userPermLevel, PermissionLevel.DOCTOR);
  const canManageStaff = hasPermission(userPermLevel, PermissionLevel.ADMIN);

  // Form state for adding/editing staff
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department_id: '',
    email: '',
    phone: '',
    specialization: '',
    hire_date: '',
    salary: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Mock data for demonstration
  const mockStaff: Staff[] = [
    {
      staff_id: '1',
      name: 'Dr. Sarah Wilson',
      role: 'Doctor',
      department_id: '1',
      email: 'dr.sarah.wilson@hospital.com',
      phone: '+1-555-0100',
      specialization: 'Cardiology',
      hire_date: '2020-01-15',
      salary: 150000,
      status: 'active',
      created_at: '2020-01-15T09:00:00Z',
      updated_at: '2024-01-15T09:00:00Z'
    },
    {
      staff_id: '2',
      name: 'Dr. Michael Johnson',
      role: 'Doctor',
      department_id: '2',
      email: 'dr.michael.johnson@hospital.com',
      phone: '+1-555-0101',
      specialization: 'Neurology',
      hire_date: '2019-03-20',
      salary: 160000,
      status: 'active',
      created_at: '2019-03-20T09:00:00Z',
      updated_at: '2024-01-15T09:00:00Z'
    },
    {
      staff_id: '3',
      name: 'Nurse Emily Davis',
      role: 'Nurse',
      department_id: '1',
      email: 'nurse.emily.davis@hospital.com',
      phone: '+1-555-0102',
      specialization: 'Emergency Care',
      hire_date: '2021-06-10',
      salary: 75000,
      status: 'active',
      created_at: '2021-06-10T09:00:00Z',
      updated_at: '2024-01-15T09:00:00Z'
    },
    {
      staff_id: '4',
      name: 'Dr. Robert Brown',
      role: 'Doctor',
      department_id: '3',
      email: 'dr.robert.brown@hospital.com',
      phone: '+1-555-0103',
      specialization: 'Orthopedics',
      hire_date: '2018-09-15',
      salary: 145000,
      status: 'active',
      created_at: '2018-09-15T09:00:00Z',
      updated_at: '2024-01-15T09:00:00Z'
    },
    {
      staff_id: '5',
      name: 'Admin Lisa Thompson',
      role: 'Administrator',
      department_id: '4',
      email: 'admin.lisa.thompson@hospital.com',
      phone: '+1-555-0104',
      specialization: 'Hospital Administration',
      hire_date: '2017-02-01',
      salary: 85000,
      status: 'active',
      created_at: '2017-02-01T09:00:00Z',
      updated_at: '2024-01-15T09:00:00Z'
    }
  ];

  const mockDepartments: Department[] = [
    {
      department_id: '1',
      name: 'Cardiology',
      description: 'Heart and cardiovascular care',
      status: 'active'
    },
    {
      department_id: '2',
      name: 'Neurology',
      description: 'Brain and nervous system care',
      status: 'active'
    },
    {
      department_id: '3',
      name: 'Orthopedics',
      description: 'Bone and joint care',
      status: 'active'
    },
    {
      department_id: '4',
      name: 'Administration',
      description: 'Hospital administration and management',
      status: 'active'
    }
  ];

  useEffect(() => {
    loadStaff();
    loadDepartments();
  }, [currentPage, searchTerm, roleFilter, statusFilter, departmentFilter]);

  // Reset to first page when filters change (except when only page changes)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, roleFilter, statusFilter, departmentFilter]);

  const loadStaff = async () => {
    if (!canViewStaff) {
      setError(t('staff.no_permission_view'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use staffAPI with pagination parameters
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(departmentFilter !== 'all' && { department_id: departmentFilter }),
      };
      
      const response = await staffAPI.getAll(params);
      console.log('Staff API response:', response.data);
      
      // Handle backend response with pagination
      if (response.data?.data && Array.isArray(response.data.data)) {
        setStaff(response.data.data);
        
        // Use backend pagination info if available
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        } else {
          setTotalPages(Math.ceil(response.data.data.length / 10));
        }
      } else {
        // Fallback to handling as array
        const staffData = Array.isArray(response.data) ? response.data : [];
        setStaff(staffData);
        setTotalPages(Math.ceil(staffData.length / 10));
      }
      
    } catch (error) {
      console.error('Failed to load staff:', error);
      setError(getErrorMessage(error));
      // Fallback to mock data if API fails
      
      // Apply client-side filters to mock data for testing
      let filteredMockData = [...mockStaff];
      
      if (searchTerm) {
        filteredMockData = filteredMockData.filter((staffMember: Staff) => 
          staffMember.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staffMember.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (staffMember.specialization?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      if (roleFilter !== 'all') {
        filteredMockData = filteredMockData.filter((staffMember: Staff) => 
          staffMember.role?.toLowerCase() === roleFilter.toLowerCase()
        );
      }
      
      if (statusFilter !== 'all') {
        filteredMockData = filteredMockData.filter((staffMember: Staff) => 
          staffMember.status === statusFilter
        );
      }
      
      if (departmentFilter !== 'all') {
        filteredMockData = filteredMockData.filter((staffMember: Staff) => 
          staffMember.department_id === departmentFilter
        );
      }
      
      // Apply pagination to mock data
      const startIndex = (currentPage - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedMockData = filteredMockData.slice(startIndex, endIndex);
      
      setStaff(paginatedMockData);
      setTotalPages(Math.ceil(filteredMockData.length / 10));
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
      const data = response.data;
      
      if (Array.isArray(data)) {
        departmentsData = data;
      } else if (data && data.departments && Array.isArray(data.departments)) {
        departmentsData = data.departments;
      } else if (data && data.data && Array.isArray(data.data)) {
        departmentsData = data.data;
      } else {
        console.warn('Unexpected departments response format:', data);
        departmentsData = [];
      }
      
      console.log('Processed departments data:', departmentsData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Failed to load departments:', error);
      // Fallback to mock data
      setDepartments(mockDepartments);
    }
  };

  const handleAddStaff = () => {
    if (!canManageStaff) {
      toast.error(t('staff.no_permission_add'));
      return;
    }
    
    setIsAddMode(true);
    setSelectedStaff(null);
    setFormData({
      name: '',
      role: '',
      department_id: '',
      email: '',
      phone: '',
      specialization: '',
      hire_date: '',
      salary: '',
      status: 'active'
    });
    onOpen();
  };

  const handleEditStaff = (staffMember: Staff) => {
    if (!canEditStaff) {
      toast.error(t('staff.no_permission_edit'));
      return;
    }
    
    setIsAddMode(false);
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      role: staffMember.role || '',
      department_id: staffMember.department_id || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      specialization: staffMember.specialization || '',
      hire_date: staffMember.hire_date || '',
      salary: staffMember.salary?.toString() || '',
      status: staffMember.status || 'active'
    });
    onOpen();
  };

  const handleSubmit = async () => {
    if (!canEditStaff) {
      toast.error(t('staff.no_permission_save'));
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : undefined
      };
      
      if (isAddMode) {
        await staffAPI.create(submitData);
        toast.success(t('staff.staff_added'));
      } else {
        await staffAPI.update(selectedStaff!.staff_id || '', submitData);
        toast.success(t('staff.staff_updated'));
      }
      onClose();
      loadStaff();
    } catch (error) {
      console.error('Failed to save staff member:', error);
      toast.error(`${t('staff.save_error') || 'Failed to save staff member'}: ${getErrorMessage(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!canManageStaff) {
      toast.error(t('staff.no_permission_delete'));
      return;
    }

    if (confirm(t('staff.delete_confirm') || 'Are you sure you want to delete this staff member?')) {
      try {
        await staffAPI.delete(staffId);
        toast.success(t('staff.staff_deleted'));
        loadStaff();
      } catch (error) {
        console.error('Failed to delete staff member:', error);
        toast.error(`${t('staff.delete_error') || 'Failed to delete staff member'}: ${getErrorMessage(error)}`);
      }
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      default: return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'doctor': return 'primary';
      case 'nurse': return 'secondary';
      case 'administrator': 
      case 'admin': return 'warning';
      case 'technician': return 'success';
      case 'pharmacist': return 'secondary';
      case 'receptionist': return 'default';
      default: return 'default';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const normalizedRole = role.toLowerCase();
    return t(`staff.roles.${normalizedRole}`) || role;
  };

  const getDepartmentName = (departmentId: string | any) => {
    console.log('getDepartmentName called with:', { departmentId, type: typeof departmentId });
    
    if (!departmentId || !Array.isArray(departments)) {
      console.log('Early return: no departmentId or departments not array');
      return 'Unknown Department';
    }
    
    // If departmentId is already populated object with name
    if (typeof departmentId === 'object' && departmentId.name) {
      console.log('Found populated department:', departmentId.name);
      return departmentId.name;
    }
    
    // Extract string ID from object or use as string
    const idString = typeof departmentId === 'object' ? departmentId._id || departmentId.department_id : departmentId;
    console.log('Looking for department with ID:', idString);
    
    // Try both _id and department_id fields for compatibility
    const department = departments.find(d => 
      d._id === idString || 
      d.department_id === idString
    );
    
    console.log('Found department:', department);
    return department?.name || 'Unknown Department';
  };

  const renderCell = (staffMember: Staff, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div>
            <p className="font-medium">{staffMember.name}</p>
            <p className="text-sm text-gray-500">{staffMember.email}</p>
          </div>
        );
      case 'role':
        return (
          <Chip color={getRoleColor(staffMember.role || '')} size="sm">
            {getRoleDisplayName(staffMember.role || 'Unknown')}
          </Chip>
        );
      case 'department':
        // Handle both department_id and departmentId fields
        const deptId = staffMember.department_id || (staffMember as any).departmentId;
        return getDepartmentName(deptId);
      case 'contact':
        return (
          <div>
            <p>{staffMember.phone}</p>
            <p className="text-sm text-gray-500">{staffMember.specialization}</p>
          </div>
        );
      case 'hire_date':
        return staffMember.hire_date ? formatDate(staffMember.hire_date) : 'N/A';
      case 'salary':
        return staffMember.salary ? `$${staffMember.salary.toLocaleString()}` : 'N/A';
      case 'status':
        return (
          <Chip color={getStatusColor(staffMember.status || 'active')} size="sm">
            {staffMember.status || 'Active'}
          </Chip>
        );
      case 'actions':
        return (
          <div className="flex gap-2">
            {canEditStaff && (
              <Button size="sm" color="primary" variant="flat" onPress={() => handleEditStaff(staffMember)}>
                <Edit size={16} />
              </Button>
            )}
            {/* Status change removed - only show current status */}
            {canManageStaff && (
              <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteStaff(staffMember.staff_id || '')}>
                <Trash2 size={16} />
              </Button>
            )}
            {!canEditStaff && (
              <Chip size="sm" color="warning" variant="flat">
                <Shield size={12} className="mr-1" />
                {t('staff.view_only_access')}
              </Chip>
            )}
          </div>
        );
      default:
        return staffMember[columnKey as keyof Staff];
    }
  };

  const columns = [
    { key: 'name', label: t('staff.name_email') || 'Name & Email' },
    { key: 'role', label: t('staff.role') || 'Role' },
    { key: 'department', label: t('staff.department') || 'Department' },
    { key: 'contact', label: t('staff.contact_specialization') || 'Contact & Specialization' },
    { key: 'hire_date', label: t('staff.hire_date') || 'Hire Date' },
    { key: 'salary', label: t('staff.salary') || 'Salary' },
    { key: 'status', label: t('staff.status') || 'Status' },
    { key: 'actions', label: t('staff.actions') || 'Actions' }
  ];

  // Permission check for page access
  if (!canViewStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle size={64} className="text-warning" />
        <h2 className="text-2xl font-bold text-foreground">{t('staff.access_denied')}</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {t('staff.no_permission_message')}
        </p>
        <Chip color="warning" variant="flat">
          {t('staff.required_permission')}: {PermissionLevel.NURSE} ({t('staff.roles.nurse')}) {t('staff.or_higher')}
        </Chip>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('staff.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('staff.subtitle')}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Chip size="sm" color="primary" variant="flat">
              <Shield size={12} className="mr-1" />
              {t('staff.your_role')}: {getPermissionLevel(user) === 3 ? t('staff.roles.administrator') : getPermissionLevel(user) === 2 ? t('staff.roles.doctor') : t('staff.roles.nurse')}
            </Chip>
            {!canEditStaff && (
              <Chip size="sm" color="warning" variant="flat">
                {t('staff.view_only_access')}
              </Chip>
            )}
          </div>
        </div>
        {canManageStaff && (
          <Button color="primary" onPress={handleAddStaff}>
            <Plus className="mr-2" size={20} />
            {t('staff.add_staff')}
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder={t("staff.search_placeholder") || "Search staff by name, email, or specialization..."}
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="flex-1"
                startContent={<Search size={16} />}
                isClearable
              />
              
              <Select
                label={t("staff.role") || "Role"}
                placeholder={t("staff.select_role") || "Select role"}
                className="sm:w-48"
                selectedKeys={roleFilter !== 'all' ? [roleFilter] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setRoleFilter(selectedKey || 'all');
                }}
                variant="bordered"
              >
                <SelectItem key="all">{t("staff.all_roles")}</SelectItem>
                <SelectItem key="doctor">{getRoleDisplayName("doctor")}</SelectItem>
                <SelectItem key="nurse">{getRoleDisplayName("nurse")}</SelectItem>
                <SelectItem key="technician">{getRoleDisplayName("technician")}</SelectItem>
                <SelectItem key="administrator">{getRoleDisplayName("administrator")}</SelectItem>
                <SelectItem key="admin">{getRoleDisplayName("admin")}</SelectItem>
                <SelectItem key="pharmacist">{getRoleDisplayName("pharmacist")}</SelectItem>
                <SelectItem key="receptionist">{getRoleDisplayName("receptionist")}</SelectItem>
              </Select>
              
              <Select
                label={t("staff.department") || "Department"}
                placeholder={t("staff.select_department") || "Select department"}
                className="sm:w-48"
                selectedKeys={departmentFilter !== 'all' ? [departmentFilter] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setDepartmentFilter(selectedKey || 'all');
                }}
                variant="bordered"
              >
                <SelectItem key="all">{t("staff.all_departments")}</SelectItem>
                <>
                                  {Array.isArray(departments) ? departments.map((dept) => (
                  <SelectItem key={dept._id || dept.department_id || Math.random().toString()}>
                    {dept.name || 'Unknown Department'}
                  </SelectItem>
                )) : (
                  <SelectItem key="none" isDisabled>{t('staff.no_departments_available')}</SelectItem>
                )}
                </>
              </Select>
              
              <Select
                label={t("staff.status")}
                placeholder={t("staff.select_status")}
                className="sm:w-48"
                selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setStatusFilter(selectedKey || 'all');
                }}
                variant="bordered"
              >
                <SelectItem key="all">{t("staff.all_status")}</SelectItem>
                <SelectItem key="active">{t("staff.active")}</SelectItem>
                <SelectItem key="inactive">{t("staff.inactive")}</SelectItem>
              </Select>
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all') && (
              <div className="flex justify-end">
                <Button
                  variant="flat"
                  color="default"
                  size="sm"
                  onPress={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setDepartmentFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  {t("common.clear_filters")}
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Staff table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody emptyContent={t('staff.no_staff')}>
              {staff.map((staffMember) => (
                <TableRow key={staffMember.staff_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(staffMember, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {staff.length > 0 && (
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

      {/* Add/Edit Staff Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("staff.add_staff") : t("staff.edit_staff")}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("staff.name") || "Full Name"}
                placeholder={t("staff.enter_name") || "Enter name"}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                isRequired
              />
              
              <Select
                label={t("staff.role") || "Role"}
                placeholder={t("staff.select_role") || "Select a role"}
                selectedKeys={formData.role ? [formData.role] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, role: selectedKey});
                }}
                isRequired
                isDisabled={!canManageStaff}
              >
                <SelectItem key="doctor">{getRoleDisplayName("doctor")}</SelectItem>
                <SelectItem key="nurse">{getRoleDisplayName("nurse")}</SelectItem>
                <SelectItem key="administrator">{getRoleDisplayName("administrator")}</SelectItem>
                <SelectItem key="technician">{getRoleDisplayName("technician")}</SelectItem>
                <SelectItem key="pharmacist">{getRoleDisplayName("pharmacist")}</SelectItem>
                <SelectItem key="receptionist">{getRoleDisplayName("receptionist")}</SelectItem>
              </Select>
              
              <Select
                label={t("staff.department") || "Department"}
                placeholder={t("staff.select_department") || "Select a department"}
                selectedKeys={formData.department_id ? [formData.department_id] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, department_id: selectedKey});
                }}
                isRequired
              >
                <>
                  {Array.isArray(departments) ? departments.map((department) => (
                    <SelectItem key={department._id || department.department_id || Math.random().toString()}>
                      {department.name || 'Unknown Department'}
                    </SelectItem>
                  )                  ) : (
                    <SelectItem key="none" isDisabled>{t('staff.no_departments_available')}</SelectItem>
                  )}
                </>
              </Select>
              
              <Input
                label={t("staff.email") || "Email"}
                type="email"
                placeholder={t("staff.enter_email") || "Enter email"}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                isRequired
              />
              
              <Input
                label={t("staff.phone") || "Phone"}
                placeholder={t("staff.enter_phone") || "Enter phone"}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                isRequired
              />
              
              <Input
                label={t("staff.specialization") || "Specialization"}
                placeholder={t("staff.enter_specialization") || "Enter specialization"}
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
              />
              
              <DatePicker
                label={t("staff.hire_date") || "Hire Date"}
                value={formData.hire_date ? parseDate(toDateString(formData.hire_date) || '') : null}
                onChange={(value: any) => {
                  const dateString = value ? value.toString() : '';
                  setFormData({...formData, hire_date: dateString});
                }}
                isRequired
                description={t('staff.hire_date_description') || "Employee's hire date"}
                className="w-full"
              />
              
              <Input
                label={t("staff.salary") || "Salary"}
                type="number"
                placeholder={t("staff.enter_salary") || "Enter salary"}
                value={formData.salary}
                onChange={(e) => {
                  // Sadece rakam ve nokta karakterine izin ver
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setFormData({...formData, salary: value});
                }}
                startContent={<span>$</span>}
              />
              
              <Select
                label={t("staff.status")}
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, status: selectedKey as 'active' | 'inactive'});
                }}
              >
                <SelectItem key="active">{t("staff.active")}</SelectItem>
                <SelectItem key="inactive">{t("staff.inactive")}</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose} isDisabled={submitting}>
              {t("staff.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit} isLoading={submitting}>
              {isAddMode ? t("staff.add_staff") : t("staff.update")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}