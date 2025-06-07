import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Crear instancia de Axios
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos para las respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    stack?: string;
  };
}

// Servicios de autenticación
export const authService = {
  getMe: () => api.get<ApiResponse<any>>('/auth/me'),
  logout: () => api.post<ApiResponse<any>>('/auth/logout'),
  refreshToken: () => api.post<ApiResponse<{ token: string; expiresIn: string }>>('/auth/refresh'),
};

// Servicios de casos de uso
export const useCaseService = {
  getAll: (status?: string) => 
    api.get<ApiResponse<any[]>>('/use-cases', { params: { status } }),
  
  getById: (id: string) => 
    api.get<ApiResponse<any>>(`/use-cases/${id}`),
  
  create: (data: { title: string; description: string; originalText: string }) =>
    api.post<ApiResponse<any>>('/use-cases', data),
  
  update: (id: string, data: Partial<any>) =>
    api.put<ApiResponse<any>>(`/use-cases/${id}`, data),
  
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/use-cases/${id}`),
  
  selectDomains: (id: string, domains: string[]) =>
    api.post<ApiResponse<any>>(`/use-cases/${id}/domains`, { domains }),
  
  selectApis: (id: string, apis: string[]) =>
    api.post<ApiResponse<any>>(`/use-cases/${id}/apis`, { apis }),
};

// Servicios de dominios BIAN
export const bianService = {
  getDomains: (search?: string) =>
    api.get<ApiResponse<any[]>>('/bian/domains', { params: { search } }),
  
  getDomainByName: (name: string) =>
    api.get<ApiResponse<any>>(`/bian/domains/${name}`),
  
  getApisForDomains: (domains: string[], useCaseContext?: string) =>
    api.post<ApiResponse<{ domains: string[]; suggestedApis: any[]; count: number }>>('/bian/apis', {
      domains,
      useCaseContext,
    }),
  
  getApiDetails: (apiName: string) =>
    api.get<ApiResponse<any>>(`/bian/apis/${apiName}`),
  
  validateDomains: (domains: string[], useCaseText: string) =>
    api.post<ApiResponse<any>>('/bian/validate-domains', { domains, useCaseText }),
};

// Servicios de schemas personalizados
export const schemaService = {
  generate: (description: string, apiContext?: string) =>
    api.post<ApiResponse<any>>('/schemas/generate', { description, apiContext }),
  
  addToUseCase: (useCaseId: string, schema: any) =>
    api.post<ApiResponse<any>>(`/schemas/use-case/${useCaseId}`, schema),
  
  getFromUseCase: (useCaseId: string) =>
    api.get<ApiResponse<any[]>>(`/schemas/use-case/${useCaseId}`),
  
  update: (useCaseId: string, schemaIndex: number, data: any) =>
    api.put<ApiResponse<any>>(`/schemas/use-case/${useCaseId}/${schemaIndex}`, data),
  
  delete: (useCaseId: string, schemaIndex: number) =>
    api.delete<ApiResponse<any>>(`/schemas/use-case/${useCaseId}/${schemaIndex}`),
};

// Servicios de fuentes de datos
export const dataSourceService = {
  addToUseCase: (useCaseId: string, dataSource: any) =>
    api.post<ApiResponse<any>>(`/data-sources/use-case/${useCaseId}`, dataSource),
  
  getFromUseCase: (useCaseId: string) =>
    api.get<ApiResponse<any[]>>(`/data-sources/use-case/${useCaseId}`),
  
  update: (useCaseId: string, dataSourceIndex: number, data: any) =>
    api.put<ApiResponse<any>>(`/data-sources/use-case/${useCaseId}/${dataSourceIndex}`, data),
  
  delete: (useCaseId: string, dataSourceIndex: number) =>
    api.delete<ApiResponse<any>>(`/data-sources/use-case/${useCaseId}/${dataSourceIndex}`),
  
  validateConnection: (connection: { apiUrl: string; method: string; payload?: any; headers?: any }) =>
    api.post<ApiResponse<any>>('/data-sources/validate-connection', connection),
};

// Servicios de empresa
export const companyService = {
  getCurrent: () =>
    api.get<ApiResponse<any>>('/companies/current'),
  
  updateCurrent: (data: any) =>
    api.put<ApiResponse<any>>('/companies/current', data),
  
  getUsers: () =>
    api.get<ApiResponse<any[]>>('/companies/current/users'),
  
  updateUserRole: (userId: string, role: 'admin' | 'user') =>
    api.put<ApiResponse<any>>(`/companies/current/users/${userId}/role`, { role }),
  
  updateUserStatus: (userId: string, isActive: boolean) =>
    api.put<ApiResponse<any>>(`/companies/current/users/${userId}/status`, { isActive }),
};

export default api; 