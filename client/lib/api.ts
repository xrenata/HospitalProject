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
  getAll: () => api.get('/staff'),
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