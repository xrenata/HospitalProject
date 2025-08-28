// User and Authentication Types
export interface User {
  id: number;
  username: string;
  permLevel: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  permLevel: number;
}

// Icon Types
export interface IconSvgProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}

// Patient Types
export interface Patient {
  patient_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  
  // Support both naming conventions
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  tc_number?: string;
  tcNumber?: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  
  name?: string;
  age?: number;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergencyContactName?: string;
  emergency_contact_phone?: string;
  emergencyContactPhone?: string;
  blood_type?: string;
  bloodType?: string;
  allergies?: string;
  medical_history?: string;
  medicalHistory?: string;
  insurance_info?: string;
  insuranceInfo?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Appointment Types
export interface Appointment {
  appointment_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  
  // Support both naming conventions
  patient_id?: string;
  patientId?: string;
  staff_id?: string;
  staffId?: string;
  department_id?: string;
  departmentId?: string;
  appointment_date?: string;
  appointmentDate?: string;
  appointment_time?: string;
  appointmentTime?: string;
  
  reason?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Staff Types
export interface Staff {
  staff_id?: string;
  _id?: string; // MongoDB ID
  name?: string;
  role?: string;
  department_id?: string;
  departmentId?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  hire_date?: string;
  hireDate?: string;
  salary?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Department Types
export interface Department {
  department_id: string;
  name: string;
  description?: string;
  head_staff_id?: string;
  budget?: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

// Room Types
export interface Room {
  room_id: string;
  room_number: string;
  room_type: 'general' | 'private' | 'icu' | 'operation' | 'emergency';
  department_id: string;
  capacity: number;
  current_occupancy: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  equipment?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Medication Types
export interface Medication {
  medication_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  name?: string;
  description?: string;
  dosage?: string;
  manufacturer?: string;
  expiry_date?: string;
  stock_quantity?: number;
  price?: number;
  category?: string;
  side_effects?: string;
  created_at?: string;
  updated_at?: string;
}

// Treatment Types
export interface Treatment {
  treatment_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  patient_id?: string;
  staff_id?: string;
  treatment_type?: string;
  treatment_description?: string;
  description?: string;
  diagnosis?: string;
  medication?: string;
  treatment_date?: string;
  start_date?: string;
  end_date?: string;
  status?: 'ongoing' | 'completed' | 'cancelled';
  cost?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Test Types
export interface Test {
  test_id: string;
  patient_id: string;
  staff_id: string;
  test_type: string;
  test_date: string;
  results?: string;
  status: 'pending' | 'completed' | 'cancelled';
  cost: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Equipment Types
export interface Equipment {
  equipment_id: string;
  name: string;
  description?: string;
  department_id: string;
  room_id?: string;
  manufacturer: string;
  model: string;
  purchase_date: string;
  warranty_expiry?: string;
  maintenance_schedule?: string;
  status: 'operational' | 'maintenance' | 'out-of-order' | 'retired';
  cost: number;
  created_at?: string;
  updated_at?: string;
}

// Visit Types
export interface Visit {
  visit_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  patient_id?: string;
  patientId?: string;
  staff_id?: string;
  staffId?: string;
  visit_date?: string;
  visit_time?: string;
  reason?: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_date?: string;
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  cost?: number;
  notes?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Prescription Types
export interface Prescription {
  prescription_id: string;
  patient_id: string;
  staff_id: string;
  medication_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  date_prescribed: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

// Surgery Types
export interface Surgery {
  surgery_id: string;
  patient_id: string;
  primary_surgeon_id: string;
  surgery_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  room_id: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  pre_op_notes?: string;
  post_op_notes?: string;
  complications?: string;
  cost: number;
  created_at?: string;
  updated_at?: string;
}

// Complaint Types
export interface Complaint {
  complaint_id: string;
  patient_id: string;
  complaint_text: string;
  category: 'service' | 'billing' | 'medical' | 'facility' | 'staff' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assigned_to?: string;
  resolution?: string;
  created_at?: string;
  updated_at?: string;
}

// Feedback Types
export interface Feedback {
  feedback_id: string;
  patient_id: string;
  rating: number; // 1-5 stars
  category: 'overall' | 'service' | 'cleanliness' | 'staff' | 'facilities';
  comments?: string;
  anonymous: boolean;
  created_at?: string;
  updated_at?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

// Dashboard Types
export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalStaff: number;
  totalRevenue: number;
  appointmentsToday: number;
  availableRooms: number;
  pendingTests: number;
  criticalAlerts: number;
}

// Department Types
export interface Department {
  department_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  name?: string;
  description?: string;
  head_staff_id?: string | Staff;
  head_staff?: Staff; // For populated data
  staff?: Staff[]; // For populated data
  staffCount?: number;
  location?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  budget?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Shift Types
export interface Shift {
  shift_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  staff_id?: string;
  staffId?: string;
  date?: string;
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  break_start?: string;
  breakStart?: string;
  break_end?: string;
  breakEnd?: string;
  hours_worked?: number;
  hoursWorked?: number;
  overtime_hours?: number;
  overtimeHours?: number;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Surgery Team Types
export interface SurgeryTeam {
  surgery_team_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  surgery_id?: string;
  surgeryId?: string;
  staff_id?: string;
  staffId?: string;
  role?: 'primary_surgeon' | 'assistant_surgeon' | 'anesthesiologist' | 'nurse' | 'technician';
  notes?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Insurance Types
export interface Insurance {
  insurance_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  patient_id?: string;
  patientId?: string;
  company_name?: string;
  companyName?: string;
  policy_number?: string;
  policyNumber?: string;
  coverage_type?: string;
  coverageType?: string;
  coverage_amount?: number;
  coverageAmount?: number;
  deductible?: number;
  expiry_date?: string;
  expiryDate?: string;
  status?: 'active' | 'inactive' | 'expired';
  notes?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Hospital Information Types
export interface HospitalInfo {
  hospital_id?: string;
  _id?: string; // MongoDB ID
  id?: number; // For compatibility
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  established_date?: string;
  establishedDate?: string;
  bed_capacity?: number;
  bedCapacity?: number;
  staff_count?: number;
  staffCount?: number;
  departments?: Department[];
  services?: string[];
  accreditation?: string[];
  director_name?: string;
  directorName?: string;
  description?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Permission Levels
export enum PermissionLevel {
  NURSE = 1,
  DOCTOR = 2,
  ADMIN = 3
}