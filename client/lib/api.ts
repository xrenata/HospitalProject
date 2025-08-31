import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { username: string; password: string; permLevel: number }) =>
    api.post('/auth/register', userData),
};

// Patients API
export const patientsAPI = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    gender?: string;
    bloodType?: string;
    minAge?: string;
    maxAge?: string;
    hasAllergies?: string;
    hasInsurance?: string;
    city?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.gender) queryParams.append('gender', params.gender);
    if (params?.bloodType) queryParams.append('bloodType', params.bloodType);
    if (params?.minAge) queryParams.append('minAge', params.minAge);
    if (params?.maxAge) queryParams.append('maxAge', params.maxAge);
    if (params?.hasAllergies) queryParams.append('hasAllergies', params.hasAllergies);
    if (params?.hasInsurance) queryParams.append('hasInsurance', params.hasInsurance);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    return api.get(`/patients${queryString ? `?${queryString}` : ''}`);
  },
  search: (query: string, limit?: number) => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (limit) queryParams.append('limit', limit.toString());
    return api.get(`/patients/search?${queryParams.toString()}`);
  },
  getById: (id: string) => api.get(`/patients/${id}`),
  create: (data: any) => api.post('/patients', data),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
  delete: (id: string) => api.delete(`/patients/${id}`),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    status?: string;
    date?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    return api.get(`/appointments${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments', data),
  update: (id: string, data: any) => api.put(`/appointments/${id}`, data),
  delete: (id: string) => api.delete(`/appointments/${id}`),
};

// Staff API
export const staffAPI = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    role?: string;
    status?: string;
    department_id?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.department_id) queryParams.append('department_id', params.department_id);
    
    const queryString = queryParams.toString();
    return api.get(`/staff${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/staff/${id}`),
  create: (data: any) => api.post('/staff', data),
  update: (id: string, data: any) => api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

// Departments API
export const departmentsAPI = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    return api.get(`/departments${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (data: {
    name: string;
    description?: string;
    head_staff_id?: string;
    budget?: number;
    location?: string;
    phone?: string;
    email?: string;
    capacity?: number;
    status?: 'active' | 'inactive';
  }) => api.post('/departments', data),
  update: (id: string, data: any) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
  getStats: () => api.get('/departments/stats'),
};

// Rooms API
export const roomsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    departmentId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);

    const queryString = queryParams.toString();
    return api.get(`/rooms${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/rooms/${id}`),
  create: (data: {
    room_number: string;
    room_type: 'general' | 'private' | 'icu' | 'operation' | 'emergency';
    department_id: string;
    capacity: number;
    equipment?: string;
    notes?: string;
    status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
  }) => api.post('/rooms', data),
  update: (id: string, data: any) => api.put(`/rooms/${id}`, data),
  delete: (id: string) => api.delete(`/rooms/${id}`),
  getStats: () => api.get('/rooms/stats'),
};

// Tests API
export const testsAPI = {
  getAll: () => api.get('/tests'),
  getById: (id: string) => api.get(`/tests/${id}`),
  create: (data: any) => api.post('/tests', data),
  update: (id: string, data: any) => api.put(`/tests/${id}`, data),
  delete: (id: string) => api.delete(`/tests/${id}`),
  getStats: () => api.get('/tests/stats'),
};

// Visits API
export const visitsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    patientId?: string;
    staffId?: string;
    date?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.patientId) queryParams.append('patientId', params.patientId);
    if (params?.staffId) queryParams.append('staffId', params.staffId);
    if (params?.date) queryParams.append('date', params.date);

    const queryString = queryParams.toString();
    return api.get(`/visits${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/visits/${id}`),
  create: (data: any) => api.post('/visits', data),
  update: (id: string, data: any) => api.put(`/visits/${id}`, data),
  delete: (id: string) => api.delete(`/visits/${id}`),
};

// Treatments API
export const treatmentsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    patientId?: string;
    staffId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.patientId) queryParams.append('patientId', params.patientId);
    if (params?.staffId) queryParams.append('staffId', params.staffId);

    const queryString = queryParams.toString();
    return api.get(`/treatments${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/treatments/${id}`),
  create: (data: any) => api.post('/treatments', data),
  update: (id: string, data: any) => api.put(`/treatments/${id}`, data),
  delete: (id: string) => api.delete(`/treatments/${id}`),
};

// Prescriptions API
export const prescriptionsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    patientId?: string;
    staffId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.patientId) queryParams.append('patientId', params.patientId);
    if (params?.staffId) queryParams.append('staffId', params.staffId);

    const queryString = queryParams.toString();
    return api.get(`/prescriptions${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/prescriptions/${id}`),
  create: (data: any) => api.post('/prescriptions', data),
  update: (id: string, data: any) => api.put(`/prescriptions/${id}`, data),
  delete: (id: string) => api.delete(`/prescriptions/${id}`),
};

// Surgeries API
export const surgeriesAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    patientId?: string;
    surgeonId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.patientId) queryParams.append('patientId', params.patientId);
    if (params?.surgeonId) queryParams.append('surgeonId', params.surgeonId);

    const queryString = queryParams.toString();
    return api.get(`/surgeries${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/surgeries/${id}`),
  create: (data: any) => api.post('/surgeries', data),
  update: (id: string, data: any) => api.put(`/surgeries/${id}`, data),
  delete: (id: string) => api.delete(`/surgeries/${id}`),
};

// Shifts API
export const shiftsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    staffId?: string;
    date?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.staffId) queryParams.append('staffId', params.staffId);
    if (params?.date) queryParams.append('date', params.date);

    const queryString = queryParams.toString();
    return api.get(`/shifts${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/shifts/${id}`),
  create: (data: any) => api.post('/shifts', data),
  update: (id: string, data: any) => api.put(`/shifts/${id}`, data),
  delete: (id: string) => api.delete(`/shifts/${id}`),
};

// Surgery Teams API
export const surgeryTeamsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    surgeryId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.surgeryId) queryParams.append('surgeryId', params.surgeryId);

    const queryString = queryParams.toString();
    return api.get(`/surgery-team${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/surgery-team/${id}`),
  create: (data: any) => api.post('/surgery-team', data),
  update: (id: string, data: any) => api.put(`/surgery-team/${id}`, data),
  delete: (id: string) => api.delete(`/surgery-team/${id}`),
};

// Medications API
export const medicationsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return api.get(`/medications${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/medications/${id}`),
  create: (data: any) => api.post('/medications', data),
  update: (id: string, data: any) => api.put(`/medications/${id}`, data),
  delete: (id: string) => api.delete(`/medications/${id}`),
};

// Equipment API
export const equipmentAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return api.get(`/equipment${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/equipment/${id}`),
  create: (data: any) => api.post('/equipment', data),
  update: (id: string, data: any) => api.put(`/equipment/${id}`, data),
  delete: (id: string) => api.delete(`/equipment/${id}`),
};

// Complaints API
export const complaintsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    priority?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.priority) queryParams.append('priority', params.priority);

    const queryString = queryParams.toString();
    return api.get(`/complaints${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/complaints/${id}`),
  create: (data: any) => api.post('/complaints', data),
  update: (id: string, data: any) => api.put(`/complaints/${id}`, data),
  delete: (id: string) => api.delete(`/complaints/${id}`),
};

// Feedback API
export const feedbackAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    rating?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.rating) queryParams.append('rating', params.rating.toString());

    const queryString = queryParams.toString();
    return api.get(`/feedback${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/feedback/${id}`),
  create: (data: any) => api.post('/feedback', data),
  update: (id: string, data: any) => api.put(`/feedback/${id}`, data),
  delete: (id: string) => api.delete(`/feedback/${id}`),
};

// Insurance API
export const insuranceAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return api.get(`/insurance${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => api.get(`/insurance/${id}`),
  create: (data: any) => api.post('/insurance', data),
  update: (id: string, data: any) => api.put(`/insurance/${id}`, data),
  delete: (id: string) => api.delete(`/insurance/${id}`),
};

// Hospital API
export const hospitalAPI = {
  getAll: () => api.get('/hospitals'),
  getById: (id: string) => api.get(`/hospitals/${id}`),
  create: (data: any) => api.post('/hospitals', data),
  update: (id: string, data: any) => api.put(`/hospitals/${id}`, data),
  delete: (id: string) => api.delete(`/hospitals/${id}`),
  getStats: () => api.get('/hospitals/stats'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    filter?: 'all' | 'unread' | 'critical';
    category?: string;
    type?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.filter) queryParams.append('filter', params.filter);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);

    const queryString = queryParams.toString();
    return api.get(`/notifications${queryString ? `?${queryString}` : ''}`);
  },
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  getStats: () => api.get('/notifications/stats'),
};

// Analytics API
export const analyticsAPI = {
  getOverview: (params?: {
    period?: '7d' | '30d' | '90d' | '1y';
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    return api.get(`/analytics/overview${queryString ? `?${queryString}` : ''}`);
  },
  getPatientAnalytics: (params?: { period?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    
    const queryString = queryParams.toString();
    return api.get(`/analytics/patients${queryString ? `?${queryString}` : ''}`);
  },
  getAppointmentAnalytics: (params?: { period?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    
    const queryString = queryParams.toString();
    return api.get(`/analytics/appointments${queryString ? `?${queryString}` : ''}`);
  },
  getStaffAnalytics: () => api.get('/analytics/staff'),
  getFinancialAnalytics: (params?: { period?: string; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    return api.get(`/analytics/financial${queryString ? `?${queryString}` : ''}`);
  },
  getResourceAnalytics: () => api.get('/analytics/resources'),
  generateReport: (data: {
    reportType: 'comprehensive' | 'patients' | 'appointments' | 'financial';
    startDate: string;
    endDate: string;
    departments?: string[];
    metrics?: string[];
  }) => api.post('/analytics/report', data),
};

// Reports API
export const reportsAPI = {
  getTemplates: () => api.get('/reports/templates'),
  generatePatientReport: (data: {
    startDate: string;
    endDate: string;
    departments?: string[];
    ageGroups?: string[];
    includeFields?: string[];
  }) => api.post('/reports/patient', data),
  generateAppointmentReport: (data: {
    startDate: string;
    endDate: string;
    departments?: string[];
  }) => api.post('/reports/appointment', data),
  generateFinancialReport: (data: {
    startDate: string;
    endDate: string;
  }) => api.post('/reports/financial', data),
  generateStaffReport: (data: {
    startDate: string;
    endDate: string;
    departments?: string[];
  }) => api.post('/reports/staff', data),
  generateInventoryReport: () => api.post('/reports/inventory'),
  generateComprehensiveReport: (data: {
    startDate: string;
    endDate: string;
  }) => api.post('/reports/comprehensive', data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getOverview: () => api.get('/dashboard/overview'),
  getAlerts: () => api.get('/dashboard/alerts'),
  markAlertAsRead: (id: string) => api.patch(`/dashboard/alerts/${id}/read`),
  sendEmergencyAlert: (data: { type: string; description: string }) => api.post('/dashboard/emergency-alert', data),
  getTests: () => api.get('/dashboard/tests'),
};

export default api;