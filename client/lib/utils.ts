import { format, parseISO, isValid } from 'date-fns';
import { PermissionLevel } from '@/types';

// Date formatting utilities
export const formatDate = (date: string | Date, formatStr: string = 'PPP'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

// Convert ISO date string to YYYY-MM-DD format for @internationalized/date
export const toDateString = (date: string | Date | null): string | null => {
  if (!date) return null;
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return null;
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    return null;
  }
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'PPP p');
};

export const formatTime = (date: string | Date): string => {
  return formatDate(date, 'p');
};

// Permission utilities
export const getPermissionLabel = (level: number, t?: (key: string) => string): string => {
  if (t) {
    switch (level) {
      case PermissionLevel.NURSE:
        return t('utils.permission_levels.nurse');
      case PermissionLevel.DOCTOR:
        return t('utils.permission_levels.doctor');
      case PermissionLevel.ADMIN:
        return t('utils.permission_levels.admin');
      default:
        return t('utils.permission_levels.unknown');
    }
  }
  
  // Fallback to English if no translation function provided
  switch (level) {
    case PermissionLevel.NURSE:
      return 'Nurse';
    case PermissionLevel.DOCTOR:
      return 'Doctor';
    case PermissionLevel.ADMIN:
      return 'Admin';
    default:
      return 'Unknown';
  }
};

export const getPermissionLevel = (user: any): number => {
  return user?.permLevel || 1;
};

export const hasPermission = (userLevel: number, requiredLevel: number): boolean => {
  return userLevel >= requiredLevel;
};

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Status color utilities
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'available':
    case 'operational':
    case 'completed':
    case 'resolved':
      return 'success';
    case 'inactive':
    case 'occupied':
    case 'maintenance':
    case 'in-progress':
    case 'ongoing':
      return 'warning';
    case 'cancelled':
    case 'out-of-order':
    case 'retired':
    case 'closed':
      return 'danger';
    case 'pending':
    case 'scheduled':
    case 'reserved':
      return 'primary';
    default:
      return 'default';
  }
};

// Number formatting utilities
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\\+]?[1-9][\\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\\s\\-\\(\\)]/g, ''));
};

// Array utilities
export const sortByField = <T>(array: T[], field: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const filterBySearch = <T>(array: T[], searchTerm: string, fields: (keyof T)[]): T[] => {
  if (!searchTerm.trim()) return array;
  
  const term = searchTerm.toLowerCase();
  return array.filter(item => 
    fields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(term);
    })
  );
};

// Local storage utilities
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key \"${key}\":`, error);
    return defaultValue;
  }
};

export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key \"${key}\":`, error);
  }
};

export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key \"${key}\":`, error);
  }
};

// Error handling utilities
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

// ID generation utility
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};