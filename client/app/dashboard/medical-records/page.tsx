"use client";

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Input, Table, TableHeader, TableColumn, 
  TableBody, TableRow, TableCell, Chip, Pagination, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem,
  Textarea, Tabs, Tab
} from '@heroui/react';
import { DatePicker } from '@heroui/date-picker';
import { parseDate, CalendarDate } from '@internationalized/date';
import { FileText, DollarSign, Trash2, Clock, CheckCircle, Search, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { treatmentsAPI, patientsAPI, staffAPI, medicationsAPI } from '@/lib/api';
import { Treatment, Patient, Staff, Medication } from '@/types';
import { formatDate, getPermissionLevel, formatCurrency, toDateString } from '@/lib/utils';

export default function MedicalRecordsPage() {
  const { user } = useAuth();
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
        alert('Treatment record created successfully!');
      } else {
        await treatmentsAPI.update(selectedTreatment!.treatment_id || selectedTreatment!.id?.toString() || '', submitData);
        alert('Treatment record updated successfully!');
      }
      onClose();
      loadTreatments();
    } catch (error: any) {
      console.error('Failed to save treatment:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Failed to save treatment record: ${errorMessage}`);
    }
  };

  const handleDeleteTreatment = async (treatmentId: string) => {
    if (confirm('Are you sure you want to delete this treatment record?')) {
      try {
        await treatmentsAPI.delete(treatmentId);
        alert('Treatment record deleted successfully!');
        loadTreatments();
      } catch (error: any) {
        console.error('Failed to delete treatment:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
        alert(`Failed to delete treatment record: ${errorMessage}`);
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
            <Chip color={getTreatmentTypeColor((treatment as any).treatmentType || treatment.treatment_type || '')} size="sm">
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
          <Chip color={getStatusColor(treatment.status || 'ongoing')} size="sm">
            {treatment.status || 'ongoing'}
          </Chip>
        );
      case 'actions':
        return (
          <div className="flex gap-2">
            <Button size="sm" color="primary" variant="flat" onPress={() => handleEditTreatment(treatment)}>
              <Edit size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteTreatment(treatment.treatment_id || (treatment as any)._id || treatment.id?.toString() || 'unknown')}>
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
    { key: 'patient', label: 'Patient' },
    { key: 'staff', label: 'Treating Physician' },
    { key: 'treatment_info', label: 'Diagnosis & Type' },
    { key: 'description', label: 'Description' },
    { key: 'duration', label: 'Duration' },
    { key: 'cost', label: 'Cost' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Medical Records & Treatments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage patient treatment records and medical history
          </p>
        </div>
        {getPermissionLevel(user) >= 2 && (
          <Button color="primary" onPress={handleAddTreatment}>
            <FileText className="mr-2" size={20} />
            Add Treatment Record
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-2xl mb-2"><FileText size={32} /></div>
            <h3 className="text-lg font-semibold">Total Treatments</h3>
            <p className="text-2xl font-bold text-blue-600">{totalTreatments}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-2xl mb-2"><Clock size={32} /></div>
            <h3 className="text-lg font-semibold">Ongoing</h3>
            <p className="text-2xl font-bold text-yellow-600">{ongoingTreatments}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-2xl mb-2"><CheckCircle size={32} /></div>
            <h3 className="text-lg font-semibold">Completed</h3>
            <p className="text-2xl font-bold text-green-600">{completedTreatments}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-2xl mb-2"><DollarSign size={32} /></div>
            <h3 className="text-lg font-semibold">Total Cost</h3>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCost)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              placeholder="Search treatments by diagnosis, type, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:col-span-1"
              startContent={<Search size={16} />}
            />
            <Select
              placeholder="Filter by status"
              selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setStatusFilter(selectedKey || 'all');
              }}
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="ongoing">Ongoing</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="cancelled">Cancelled</SelectItem>
            </Select>
                          <Select
                placeholder="Filter by patient"
                selectedKeys={patientFilter !== 'all' ? [patientFilter] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setPatientFilter(selectedKey || 'all');
                }}
              >
                <SelectItem key="all">All Patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.patient_id || (patient as any)._id}>
                    {patient.name || `${(patient as any).firstName} ${(patient as any).lastName}`}
                  </SelectItem>
                ))}
              </Select>
          </div>
        </CardBody>
      </Card>

      {/* Treatments Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Treatments table">
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
            {isAddMode ? 'Add New Treatment Record' : 'Edit Treatment Record'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Patient"
                placeholder="Select a patient"
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
              
              <Select
                label="Treating Physician"
                placeholder="Select a physician"
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
              
              <Input
                label="Treatment Type"
                value={formData.treatment_type}
                onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
                placeholder="e.g., Medication, Surgery, Physical Therapy"
                isRequired
              />
              
              <Input
                label="Diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                placeholder="Primary diagnosis"
                isRequired
              />
              
              <div className="md:col-span-2">
                <Textarea
                  label="Treatment Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed description of the treatment"
                  rows={3}
                  isRequired
                />
              </div>
              
              <Input
                label="Medication/Prescription"
                value={formData.medication}
                onChange={(e) => setFormData({...formData, medication: e.target.value})}
                placeholder="Prescribed medications and dosage"
              />
              
              <Input
                label="Cost"
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
              
              <DatePicker
                label="Start Date"
                value={formData.start_date ? parseDate(toDateString(formData.start_date) || '') : null}
                onChange={(value: any) => {
                  const dateString = value ? value.toString() : '';
                  setFormData({...formData, start_date: dateString});
                }}
                isRequired
                description="Treatment start date"
                className="w-full"
              />
              
              <DatePicker
                label="End Date"
                value={formData.end_date ? parseDate(toDateString(formData.end_date) || '') : null}
                onChange={(value: any) => {
                  const dateString = value ? value.toString() : '';
                  setFormData({...formData, end_date: dateString});
                }}
                description="Treatment end date (optional)"
                className="w-full"
              />
              
              <Select
                label="Status"
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({...formData, status: selectedKey as 'ongoing' | 'completed' | 'cancelled'});
                }}
              >
                <SelectItem key="ongoing">Ongoing</SelectItem>
                <SelectItem key="completed">Completed</SelectItem>
                <SelectItem key="cancelled">Cancelled</SelectItem>
              </Select>
              
              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes about the treatment"
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
              {isAddMode ? 'Create Treatment Record' : 'Update Treatment Record'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}