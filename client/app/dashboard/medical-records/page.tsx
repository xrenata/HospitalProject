"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
  Tabs,
  Tab
} from '@heroui/react';
import { Chip } from '@/components/Chip';
import { DatePicker } from '@heroui/date-picker';
import { parseDate, CalendarDate } from '@internationalized/date';
import { FileText, DollarSign, Trash2, Clock, CheckCircle, Search, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { treatmentsAPI, patientsAPI, staffAPI, medicationsAPI } from '@/lib/api';
import { Treatment, Patient, Staff, Medication } from '@/types';
import { formatDate, getPermissionLevel, formatCurrency, toDateString } from '@/lib/utils';

import DataSummary from "@/components/DataSummary";
import { useConfirm } from '@/components/ConfirmDialog';
import toast from 'react-hot-toast';
import { useI18n } from '@/contexts/I18nContext';
export default function MedicalRecordsPage() {
  const { t } = useI18n();
  const confirmAction = useConfirm();
  const { user, can, canWrite } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // Form state for adding/editing treatments
  const [formData, setFormData] = useState({
    patient_id: '',
    staff_id: '',
    treatment_type: '',
    description: '',
    diagnosis: '',
    medication: '',
    start_date: '',
    end_date: '',
    cost: '',
    notes: '',
    status: 'ongoing' as 'ongoing' | 'completed' | 'cancelled'
  });

  // Mock data for demonstration
  const mockTreatments: Treatment[] = [
    {
      treatment_id: '1',
      id: 1,
      patient_id: '1',
      staff_id: '1',
      treatment_type: 'Medication',
      description: 'Hypertension treatment with ACE inhibitors',
      diagnosis: 'Essential Hypertension',
      medication: 'Lisinopril 10mg daily',
      treatment_date: '2024-01-15T10:00:00Z',
      start_date: '2024-01-15',
      end_date: '2024-04-15',
      status: 'ongoing',
      cost: 250.00,
      notes: 'Patient responding well to treatment. Monitor blood pressure weekly.',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      treatment_id: '2',
      id: 2,
      patient_id: '2',
      staff_id: '2',
      treatment_type: 'Surgery',
      description: 'Arthroscopic knee surgery for torn meniscus',
      diagnosis: 'Torn Meniscus - Right Knee',
      medication: 'Post-operative pain management',
      treatment_date: '2024-01-20T14:00:00Z',
      start_date: '2024-01-20',
      end_date: '2024-03-20',
      status: 'completed',
      cost: 15000.00,
      notes: 'Surgery successful. Patient discharged same day. Follow-up in 2 weeks.',
      created_at: '2024-01-20T14:00:00Z',
      updated_at: '2024-02-15T10:00:00Z'
    },
    {
      treatment_id: '3',
      id: 3,
      patient_id: '3',
      staff_id: '3',
      treatment_type: 'Physical Therapy',
      description: 'Post-stroke rehabilitation program',
      diagnosis: 'Post-Stroke Hemiparesis',
      medication: 'Muscle relaxants as needed',
      treatment_date: '2024-02-01T09:00:00Z',
      start_date: '2024-02-01',
      end_date: '2024-05-01',
      status: 'ongoing',
      cost: 3500.00,
      notes: 'Patient showing gradual improvement in motor function. Continue therapy 3x/week.',
      created_at: '2024-02-01T09:00:00Z',
      updated_at: '2024-02-15T10:00:00Z'
    },
    {
      treatment_id: '4',
      id: 4,
      patient_id: '1',
      staff_id: '4',
      treatment_type: 'Diagnostic',
      description: 'Cardiac stress test and echocardiogram',
      diagnosis: 'Chest Pain Evaluation',
      medication: 'None',
      treatment_date: '2024-02-10T11:00:00Z',
      start_date: '2024-02-10',
      end_date: '2024-02-10',
      status: 'completed',
      cost: 800.00,
      notes: 'Test results normal. No signs of coronary artery disease.',
      created_at: '2024-02-10T11:00:00Z',
      updated_at: '2024-02-10T15:00:00Z'
    }
  ];

  const mockPatients: Patient[] = [
    {
      patient_id: '1',
      name: 'John Doe',
      email: 'john.doe@email.com',
      age: 39
    },
    {
      patient_id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      age: 32
    },
    {
      patient_id: '3',
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      age: 46
    }
  ];

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
      status: 'active'
    },
    {
      staff_id: '2',
      name: 'Dr. Michael Johnson',
      role: 'Doctor',
      department_id: '3',
      email: 'dr.michael.johnson@hospital.com',
      phone: '+1-555-0101',
      specialization: 'Orthopedics',
      hire_date: '2019-03-20',
      status: 'active'
    },
    {
      staff_id: '3',
      name: 'Dr. Emily Davis',
      role: 'Doctor',
      department_id: '2',
      email: 'dr.emily.davis@hospital.com',
      phone: '+1-555-0102',
      specialization: 'Neurology',
      hire_date: '2021-06-10',
      status: 'active'
    },
    {
      staff_id: '4',
      name: 'Dr. Robert Brown',
      role: 'Doctor',
      department_id: '1',
      email: 'dr.robert.brown@hospital.com',
      phone: '+1-555-0103',
      specialization: 'Cardiology',
      hire_date: '2018-09-15',
      status: 'active'
    }
  ];

  const mockMedications: Medication[] = [
    {
      medication_id: '1',
      name: 'Lisinopril',
      description: 'ACE inhibitor for hypertension',
      dosage: '10mg',
      manufacturer: 'Generic Pharma',
      expiry_date: '2025-12-31',
      stock_quantity: 500,
      price: 15.99,
      category: 'Cardiovascular'
    },
    {
      medication_id: '2',
      name: 'Ibuprofen',
      description: 'Pain reliever and anti-inflammatory',
      dosage: '400mg',
      manufacturer: 'MediCorp',
      expiry_date: '2025-06-30',
      stock_quantity: 1000,
      price: 8.99,
      category: 'Pain Management'
    }
  ];

  useEffect(() => {
    loadTreatments();
    loadPatients();
    loadStaff();
    loadMedications();
  }, [currentPage, searchTerm, statusFilter, patientFilter]);

  // Reset to first page when filters change (except when only page changes)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter, patientFilter]);

  // Handle URL action parameter (e.g., from Quick Actions)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      handleAddTreatment();
      // Clear the URL parameter
      router.replace('/dashboard/medical-records');
    }
  }, [searchParams]);

  const loadTreatments = async () => {
    setLoading(true);
    try {
      // Use treatmentsAPI with pagination parameters
      const params = {
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(patientFilter !== 'all' && { patientId: patientFilter }),
      };
      
      const response = await treatmentsAPI.getAll(params);
      console.log('Treatments API response:', response.data);
      
      // Handle backend response with pagination
      if (response.data?.data && Array.isArray(response.data.data)) {
        let treatmentsData = response.data.data;
        
        // Apply search filter client-side for now (could be moved to backend later)
        if (searchTerm) {
          treatmentsData = treatmentsData.filter((treatment: any) => 
            treatment.treatmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            treatment.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            treatment.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setTreatments(treatmentsData);
        
        // Use backend pagination info if available
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        } else {
          setTotalPages(Math.ceil(treatmentsData.length / 10));
        }
      } else {
        // Fallback to handling as array
        const treatmentsData = Array.isArray(response.data) ? response.data : [];
        setTreatments(treatmentsData);
        setTotalPages(Math.ceil(treatmentsData.length / 10));
      }
    } catch (error) {
      console.error('Failed to load treatments:', error);
      // Fallback to mock data if API fails
      let filteredTreatments = [...mockTreatments];
      
      // Apply client-side filters to mock data for testing
      if (searchTerm) {
        filteredTreatments = filteredTreatments.filter(treatment => 
          treatment.treatment_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          treatment.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          treatment.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter !== 'all') {
        filteredTreatments = filteredTreatments.filter(treatment => 
          treatment.status === statusFilter
        );
      }
      
      if (patientFilter !== 'all') {
        filteredTreatments = filteredTreatments.filter(treatment => 
          treatment.patient_id === patientFilter
        );
      }
      
      // Apply pagination to mock data
      const startIndex = (currentPage - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedMockData = filteredTreatments.slice(startIndex, endIndex);
      
      setTreatments(paginatedMockData);
      setTotalPages(Math.ceil(filteredTreatments.length / 10));
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientsAPI.getAll({ limit: 1000 }); // Get all patients for dropdown
      const patientsData = response.data?.data || response.data || [];
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error('Failed to load patients:', error);
      // Fallback to mock data
      setPatients(mockPatients);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffAPI.getAll({ limit: 1000 }); // Get all staff for dropdown
      const staffData = response.data?.data || response.data || [];
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (error) {
      console.error('Failed to load staff:', error);
      // Fallback to mock data
      setStaff(mockStaff);
    }
  };

  const loadMedications = async () => {
    try {
      const response = await medicationsAPI.getAll({ limit: 1000 }); // Get all medications for dropdown
      const medicationsData = response.data?.data || response.data || [];
      setMedications(Array.isArray(medicationsData) ? medicationsData : []);
    } catch (error) {
      console.error('Failed to load medications:', error);
      // Fallback to mock data
      setMedications(mockMedications);
    }
  };

  const handleAddTreatment = () => {
    setIsAddMode(true);
    setSelectedTreatment(null);
    setFormData({
      patient_id: '',
      staff_id: '',
      treatment_type: '',
      description: '',
      diagnosis: '',
      medication: '',
      start_date: '',
      end_date: '',
      cost: '',
      notes: '',
      status: 'ongoing'
    });
    onOpen();
  };

  const handleEditTreatment = (treatment: Treatment) => {
    setIsAddMode(false);
    setSelectedTreatment(treatment);
    setFormData({
      patient_id: (treatment as any).patientId || treatment.patient_id || '',
      staff_id: (treatment as any).staffId || treatment.staff_id || '',
      treatment_type: (treatment as any).treatmentType || treatment.treatment_type || '',
      description: treatment.description || '',
      diagnosis: treatment.diagnosis || '',
      medication: treatment.medication || '',
      start_date: (treatment as any).startDate || treatment.start_date || '',
      end_date: (treatment as any).endDate || treatment.end_date || '',
      cost: treatment.cost?.toString() || '',
      notes: treatment.notes || '',
      status: treatment.status || 'ongoing'
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        // Map frontend field names to backend field names
        patientId: formData.patient_id,
        staffId: formData.staff_id,
        treatmentType: formData.treatment_type,
        startDate: formData.start_date,
        endDate: formData.end_date
      };
      
      if (isAddMode) {
        await treatmentsAPI.create(submitData);
        toast.success(t('records.created'));
      } else {
        await treatmentsAPI.update(selectedTreatment!.treatment_id || selectedTreatment!.id?.toString() || '', submitData);
        toast.success(t('records.updated'));
      }
      onClose();
      loadTreatments();
    } catch (error: any) {
      console.error('Failed to save treatment:', error);
      const errorMessage = error.response?.data?.error || error.message || t('records.unknown_error');
      toast.error(`Failed to save treatment record: ${errorMessage}`);
    }
  };

  const handleDeleteTreatment = async (treatmentId: string) => {
    if (await confirmAction(t('records.delete_confirm'))) {
      try {
        await treatmentsAPI.delete(treatmentId);
        toast.success(t('records.deleted'));
        loadTreatments();
      } catch (error: any) {
        console.error('Failed to delete treatment:', error);
        const errorMessage = error.response?.data?.error || error.message || t('records.unknown_error');
        toast.error(`Failed to delete treatment record: ${errorMessage}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const getTreatmentTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'medication': return 'secondary';
      case 'surgery': return 'danger';
      case 'physical therapy': return 'warning';
      case 'diagnostic': return 'primary';
      default: return 'default';
    }
  };

  const getPatientName = (patientId: string | any) => {
    // Check if already populated (object with name)
    if (typeof patientId === 'object' && patientId?.firstName) {
      return `${patientId.firstName} ${patientId.lastName}`;
    }
    
    // Find in patients array
    const patient = patients.find(p => p.patient_id === patientId || p._id === patientId);
    return patient?.name || patient?.firstName ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getStaffName = (staffId: string | any) => {
    // Check if already populated (object with name)
    if (typeof staffId === 'object' && staffId?.name) {
      return staffId.name;
    }
    
    // Find in staff array
    const staffMember = staff.find(s => s.staff_id === staffId || s._id === staffId);
    return staffMember?.name || 'Unknown Staff';
  };

  const renderCell = (treatment: Treatment, columnKey: string) => {
    switch (columnKey) {
      case 'patient':
        return getPatientName((treatment as any).patientId || treatment.patient_id);
      case 'staff':
        return getStaffName((treatment as any).staffId || treatment.staff_id);
      case 'treatment_info':
        return (
          <div>
            <p className="font-medium">{treatment.diagnosis}</p>
            <Chip variant="flat" color={getTreatmentTypeColor((treatment as any).treatmentType || treatment.treatment_type || '')} size="sm">
              {(treatment as any).treatmentType || treatment.treatment_type}
            </Chip>
          </div>
        );
      case 'description':
        return (
          <div className="max-w-xs">
            <p className="text-sm truncate" title={treatment.description}>
              {treatment.description}
            </p>
          </div>
        );
      case 'duration':
        return (
          <div>
            <p>{formatDate((treatment as any).startDate || treatment.start_date)}</p>
            {((treatment as any).endDate || treatment.end_date) && (
              <p className="text-sm text-gray-500">to {formatDate((treatment as any).endDate || treatment.end_date)}</p>
            )}
          </div>
        );
      case 'cost':
        return treatment.cost ? formatCurrency(treatment.cost) : 'N/A';
      case 'status':
        return (
          <Chip variant="flat" color={getStatusColor(treatment.status || 'ongoing')} size="sm">
            {treatment.status || 'ongoing'}
          </Chip>
        );
      case 'actions':
        return (
          <div className="flex gap-2">
            <Button isIconOnly size="sm" variant="light" className="text-foreground-500 hover:text-primary" onPress={() => handleEditTreatment(treatment)}>
              <Edit size={16} />
            </Button>
            {canWrite('treatments') && (
              <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleDeleteTreatment(treatment.treatment_id || (treatment as any)._id || treatment.id?.toString() || 'unknown')}>
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        );
      default:
        return treatment[columnKey as keyof Treatment];
    }
  };

  const columns = [
    { key: 'patient', label: t('records.patient') },
    { key: 'staff', label: t('records.physician') },
    { key: 'treatment_info', label: t('records.diagnosis_type') },
    { key: 'description', label: t('records.description') },
    { key: 'duration', label: t('records.duration') },
    { key: 'cost', label: t('records.cost') },
    { key: 'status', label: t('records.status') },
    { key: 'actions', label: t('records.actions') }
  ];

  // Calculate statistics
  const totalTreatments = treatments.length;
  const ongoingTreatments = treatments.filter(t => t.status === 'ongoing').length;
  const completedTreatments = treatments.filter(t => t.status === 'completed').length;
  const totalCost = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('records.title')}
          </h1>
          <p className="text-sm text-foreground-500 mt-1">
            {t('records.subtitle')}
          </p>
        </div>
        {canWrite('treatments') && (
          <Button color="primary" onPress={handleAddTreatment}>
            <FileText className="mr-2" size={20} />
            {t('records.add')}
          </Button>
        )}
      </div>

      <DataSummary entity="treatments" loading={loading} />

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              placeholder={t('records.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:col-span-1"
              startContent={<Search size={16} />}
            />
            <Select
              placeholder={t('records.filter_status')}
              selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setStatusFilter(selectedKey || 'all');
              }}
           >
              <SelectItem key="all">{t('records.all_status')}</SelectItem>
              <SelectItem key="ongoing">{t('records.ongoing')}</SelectItem>
              <SelectItem key="completed">{t('records.completed')}</SelectItem>
              <SelectItem key="cancelled">{t('records.cancelled')}</SelectItem>
            </Select>
                          <Select
                placeholder={t('records.filter_patient')}
                selectedKeys={patientFilter !== 'all' ? [patientFilter] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setPatientFilter(selectedKey || 'all');
                }}
             >
                <SelectItem key="all">{t('records.all_patients')}</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.patient_id || (patient as any)._id}>
                    {patient.name || `${(patient as any).firstName} ${(patient as any).lastName}`}
                  </SelectItem>
                )) as any}
              </Select>
          </div>
        </CardBody>
      </Card>

      {/* Treatments Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Treatments table" removeWrapper isHeaderSticky classNames={{ base: "overflow-x-auto", table: "min-w-[44rem]", th: "h-10 bg-default-50 text-xs font-medium text-foreground-500 first:rounded-none last:rounded-none", td: "py-3 border-b border-divider group-data-[last=true]:border-b-0", tr: "transition-colors hover:bg-default-50" }}>
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {treatments.map((treatment) => (
                <TableRow key={treatment.id || treatment.treatment_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(treatment, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {treatments.length > 0 && (
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

      {/* Add/Edit Treatment Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t('records.add_title') : t('records.edit_title')}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select labelPlacement="outside" variant="bordered"
                label={t('records.patient')}
                placeholder={t('records.select_patient')}
                selectedKeys={formData.patient_id ? [formData.patient_id] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, patient_id: selectedKey});
                }}
                isRequired
             >
                {patients.map((patient) => (
                  <SelectItem key={patient.patient_id || (patient as any)._id}>
                    {patient.name || `${(patient as any).firstName} ${(patient as any).lastName}`}
                  </SelectItem>
                ))}
              </Select>
              
              <Select labelPlacement="outside" variant="bordered"
                label={t('records.physician')}
                placeholder={t('records.select_physician')}
                selectedKeys={formData.staff_id ? [formData.staff_id] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, staff_id: selectedKey});
                }}
                isRequired
             >
                {staff.filter(s => s.role === 'Doctor' || s.role === 'doctor').map((staffMember) => (
                  <SelectItem key={staffMember.staff_id || (staffMember as any)._id}>
                    {staffMember.name} - {staffMember.specialization || 'General'}
                  </SelectItem>
                ))}
              </Select>
              
              <Input labelPlacement="outside" variant="bordered"
                label={t('records.treatment_type')}
                value={formData.treatment_type}
                onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
                placeholder={t('records.type_placeholder')}
                isRequired
              />
              
              <Input labelPlacement="outside" variant="bordered"
                label={t('records.diagnosis')}
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                placeholder={t('records.diagnosis_placeholder')}
                isRequired
              />
              
              <div className="md:col-span-2">
                <Textarea minRows={3} labelPlacement="outside" variant="bordered"
                  label={t('records.treatment_description')}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={t('records.description_placeholder')}
                  rows={3}
                  isRequired
                />
              </div>
              
              <Input labelPlacement="outside" variant="bordered"
                label={t('records.medication')}
                value={formData.medication}
                onChange={(e) => setFormData({...formData, medication: e.target.value})}
                placeholder={t('records.medication_placeholder')}
              />
              
              <Input labelPlacement="outside" variant="bordered"
                label={t('records.cost')}
                type="number"
                value={formData.cost}
                onChange={(e) => {
                  // Sadece rakam ve nokta karakterine izin ver
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setFormData({...formData, cost: value});
                }}
                startContent={<span>$</span>}
                placeholder="0.00"
              />
              
              <DatePicker labelPlacement="outside" variant="bordered"
                label={t('records.start_date')}
                value={formData.start_date ? parseDate(toDateString(formData.start_date) || '') : null}
                onChange={(value: any) => {
                  const dateString = value ? value.toString() : '';
                  setFormData({...formData, start_date: dateString});
                }}
                isRequired
                description={t('records.start_hint')}
                className="w-full"
              />
              
              <DatePicker labelPlacement="outside" variant="bordered"
                label={t('records.end_date')}
                value={formData.end_date ? parseDate(toDateString(formData.end_date) || '') : null}
                onChange={(value: any) => {
                  const dateString = value ? value.toString() : '';
                  setFormData({...formData, end_date: dateString});
                }}
                description={t('records.end_hint')}
                className="w-full"
              />
              
              <Select placeholder=" " labelPlacement="outside" variant="bordered"
                label={t('records.status')}
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, status: selectedKey as 'ongoing' | 'completed' | 'cancelled'});
                }}
             >
                <SelectItem key="ongoing">{t('records.ongoing')}</SelectItem>
                <SelectItem key="completed">{t('records.completed')}</SelectItem>
                <SelectItem key="cancelled">{t('records.cancelled')}</SelectItem>
              </Select>
              
              <div className="md:col-span-2">
                <Textarea minRows={3} labelPlacement="outside" variant="bordered"
                  label={t('records.notes')}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder={t('records.notes_placeholder')}
                  rows={2}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? t('records.create') : t('records.update')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}