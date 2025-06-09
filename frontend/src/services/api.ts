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
    const authState = useAuthStore.getState();
    const token = authState.token;
    
    // Debug logging
    console.log('=== API INTERCEPTOR DEBUG ===');
    console.log('Auth state:', {
      isAuthenticated: authState.isAuthenticated,
      tokenExists: !!token,
      tokenStart: token ? token.substring(0, 20) + '...' : 'null',
      userEmail: authState.user?.email || 'no user'
    });
    console.log('Request URL:', config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Using real JWT token');
    } else {
      // TEMPORAL: Agregar un token dummy para development/testing
      console.warn('❌ No hay token de autenticación, usando token dummy para desarrollo');
      config.headers.Authorization = `Bearer dummy-token-for-development`;
    }
    console.log('Final Authorization header:', config.headers.Authorization?.substring(0, 30) + '...');
    console.log('==============================');
    
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
export interface ApiResponse<T = unknown> {
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
  getMe: () => api.get<ApiResponse<unknown>>('/auth/me'),
  logout: () => api.post<ApiResponse<unknown>>('/auth/logout'),
  refreshToken: () => api.post<ApiResponse<{ token: string; expiresIn: string }>>('/auth/refresh'),
};

// Servicios de casos de uso
export const useCaseService = {
  getAll: (status?: string) => 
    api.get<ApiResponse<unknown[]>>('/use-cases', { params: { status } }),
  
  getById: (id: string) => 
    api.get<ApiResponse<unknown>>(`/use-cases/${id}`),
  
  create: (data: { 
    title: string; 
    description: string; 
    originalText: string;
    objective?: string;
    actors?: {
      primary: string[];
      secondary: string[];
      systems: string[];
    };
    prerequisites?: string[];
    mainFlow?: Array<{
      step: number;
      actor: string;
      action: string;
      description: string;
    }>;
    alternativeFlows?: Array<{
      name: string;
      condition: string;
      steps: Array<{
        step: number;
        actor: string;
        action: string;
        description: string;
      }>;
    }>;
    postconditions?: string[];
    businessRules?: string[];
    nonFunctionalRequirements?: {
      performance?: string;
      security?: string;
      usability?: string;
      availability?: string;
    };
    assumptions?: string[];
    constraints?: string[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
    complexity?: 'low' | 'medium' | 'high';
    estimatedEffort?: string;
  }) =>
    api.post<ApiResponse<unknown>>('/use-cases', data),
  
  update: (id: string, data: Partial<Record<string, unknown>>) =>
    api.put<ApiResponse<unknown>>(`/use-cases/${id}`, data),
  
  delete: (id: string) =>
    api.delete<ApiResponse<unknown>>(`/use-cases/${id}`),
  
  selectDomains: (id: string, domains: string[]) =>
    api.post<ApiResponse<unknown>>(`/use-cases/${id}/domains`, { domains }),
  
  selectApis: (id: string, apis: string[]) =>
    api.post<ApiResponse<unknown>>(`/use-cases/${id}/apis`, { apis }),

  analyzeWithAI: (useCaseData: {
    title: string;
    description: string;
    objective: string;
    actors: any;
    prerequisites: string[];
    mainFlow: any[];
    postconditions: string[];
    businessRules: string[];
  }) =>
    api.post<ApiResponse<unknown>>('/use-cases/analyze-ai', useCaseData),

  // Nuevos endpoints de AI
  aiSuggestContent: (data: { title: string; description?: string; objective?: string }) =>
    api.post<ApiResponse<any>>('/use-cases/ai-suggest-content', data),

  aiSuggestApis: (data: { domains: string[]; useCaseContext: string }) =>
    api.post<ApiResponse<any>>('/use-cases/ai-suggest-apis', data),

  recommendDomains: (useCaseText: string) =>
    api.post<ApiResponse<unknown>>('/use-cases/recommend-domains', { useCaseText }),

  // Nuevos endpoints para OpenAPI y testing
  getOpenApiSpec: (id: string) =>
    api.get<ApiResponse<any>>(`/use-cases/${id}/openapi-spec`),

  testApi: (id: string, testData: {
    apiName: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    payload?: any;
    headers?: Record<string, string>;
    baseUrl?: string;
  }) =>
    api.post<ApiResponse<any>>(`/use-cases/${id}/test-api`, testData),
};

// Servicios de dominios BIAN
export const bianService = {
  getDomains: (search?: string) =>
    api.get<ApiResponse<unknown[]>>('/bian/domains', { params: { search } }),
  
  getDomainByName: (name: string) =>
    api.get<ApiResponse<unknown>>(`/bian/domains/${name}`),
  
  getApisForDomains: (domains: string[], useCaseContext?: string) =>
    api.post<ApiResponse<{ domains: string[]; suggestedApis: unknown[]; count: number }>>('/bian/apis', {
      domains,
      useCaseContext,
    }),
  
  getApiDetails: (apiName: string) =>
    api.get<ApiResponse<unknown>>(`/bian/apis/${apiName}`),
  
  validateDomains: (domains: string[], useCaseText: string) =>
    api.post<ApiResponse<unknown>>('/bian/validate-domains', { domains, useCaseText }),
};

// Servicios de schemas personalizados
export const schemaService = {
  // CRUD básico para schemas
  getAll: () =>
    api.get<ApiResponse<unknown[]>>('/schemas'),
  
  getById: (id: string) =>
    api.get<ApiResponse<unknown>>(`/schemas/${id}`),
  
  create: (data: { name: string; description: string; schema: any }) =>
    api.post<ApiResponse<unknown>>('/schemas', data),
  
  update: (id: string, data: { name?: string; description?: string; schema?: any }) =>
    api.put<ApiResponse<unknown>>(`/schemas/${id}`, data),
  
  delete: (id: string) =>
    api.delete<ApiResponse<unknown>>(`/schemas/${id}`),

  // Generación con IA
  generate: (description: string, apiContext?: string) =>
    api.post<ApiResponse<unknown>>('/schemas/generate', { description, apiContext }),
  
  // Métodos para casos de uso (mantener compatibilidad)
  addToUseCase: (useCaseId: string, schema: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>(`/schemas/use-case/${useCaseId}`, schema),
  
  getFromUseCase: (useCaseId: string) =>
    api.get<ApiResponse<unknown[]>>(`/schemas/use-case/${useCaseId}`),
  
  updateInUseCase: (useCaseId: string, schemaIndex: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<unknown>>(`/schemas/use-case/${useCaseId}/${schemaIndex}`, data),
  
  deleteFromUseCase: (useCaseId: string, schemaIndex: number) =>
    api.delete<ApiResponse<unknown>>(`/schemas/use-case/${useCaseId}/${schemaIndex}`),
};

// Servicios de fuentes de datos
export const dataSourceService = {
  // CRUD básico para fuentes de datos
  getAll: () =>
    api.get<ApiResponse<unknown[]>>('/data-sources'),
  
  getById: (id: string) =>
    api.get<ApiResponse<unknown>>(`/data-sources/${id}`),
  
  create: (data: { name: string; description: string; type: string; connectionConfig: any }) =>
    api.post<ApiResponse<unknown>>('/data-sources', data),
  
  update: (id: string, data: { name?: string; description?: string; type?: string; connectionConfig?: any }) =>
    api.put<ApiResponse<unknown>>(`/data-sources/${id}`, data),
  
  delete: (id: string) =>
    api.delete<ApiResponse<unknown>>(`/data-sources/${id}`),

  // Validación de conexión
  validateConnection: (connection: { dataSourceId?: string; apiUrl: string; method: string; payload?: Record<string, unknown>; headers?: Record<string, string> }) =>
    api.post<ApiResponse<unknown>>('/data-sources/validate-connection', connection),

  // Métodos para casos de uso (mantener compatibilidad)
  addToUseCase: (useCaseId: string, dataSource: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>(`/data-sources/use-case/${useCaseId}`, dataSource),
  
  getFromUseCase: (useCaseId: string) =>
    api.get<ApiResponse<unknown[]>>(`/data-sources/use-case/${useCaseId}`),
  
  updateInUseCase: (useCaseId: string, dataSourceIndex: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<unknown>>(`/data-sources/use-case/${useCaseId}/${dataSourceIndex}`, data),
  
  deleteFromUseCase: (useCaseId: string, dataSourceIndex: number) =>
    api.delete<ApiResponse<unknown>>(`/data-sources/use-case/${useCaseId}/${dataSourceIndex}`),
};

// Servicios de empresa
export const companyService = {
  getCurrent: () =>
    api.get<ApiResponse<unknown>>('/companies/current'),
  
  updateCurrent: (data: Record<string, unknown>) =>
    api.put<ApiResponse<unknown>>('/companies/current', data),
  
  getUsers: () =>
    api.get<ApiResponse<unknown[]>>('/companies/current/users'),
  
  updateUserRole: (userId: string, role: 'admin' | 'user') =>
    api.put<ApiResponse<unknown>>(`/companies/current/users/${userId}/role`, { role }),
  
  updateUserStatus: (userId: string, isActive: boolean) =>
    api.put<ApiResponse<unknown>>(`/companies/current/users/${userId}/status`, { isActive }),
};

// Servicios de personalización de APIs
export const apiCustomizationService = {
  // Obtener personalización específica
  get: (useCaseId: string, apiName: string) =>
    api.get<ApiResponse<any>>(`/api-customizations/${useCaseId}/${encodeURIComponent(apiName)}`),
  
  getCustomization: (useCaseId: string, apiName: string) =>
    api.get<ApiResponse<any>>(`/api-customizations/${useCaseId}/${encodeURIComponent(apiName)}`).then(res => res.data.data),

  // Guardar/actualizar personalización
  save: (data: {
    useCaseId: string;
    apiName: string;
    customPayload?: any;
    customHeaders?: Record<string, string>;
    customParameters?: any;
    notes?: string;
    testingConfig?: any;
  }) =>
    api.post<ApiResponse<any>>('/api-customizations', data),

  saveCustomization: (data: {
    useCaseId: string;
    apiName: string;
    customPayload?: any;
    customHeaders?: Record<string, string>;
    customParameters?: any;
    notes?: string;
    testingConfig?: any;
  }) =>
    api.post<ApiResponse<any>>('/api-customizations', data).then(res => res.data.data),

  // Ejecutar test con personalización
  test: (useCaseId: string, apiName: string, testData: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    useCustomData?: boolean;
    overridePayload?: any;
    overrideHeaders?: Record<string, string>;
  }) =>
    api.post<ApiResponse<any>>(`/api-customizations/${useCaseId}/${encodeURIComponent(apiName)}/test`, testData),

  testApi: (useCaseId: string, apiName: string, testData: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    useCustomData?: boolean;
    overridePayload?: any;
    overrideHeaders?: Record<string, string>;
  }) =>
    api.post<ApiResponse<any>>(`/api-customizations/${useCaseId}/${encodeURIComponent(apiName)}/test`, testData).then(res => res.data.data),

  // Resetear personalización
  reset: (useCaseId: string, apiName: string) =>
    api.post<ApiResponse<any>>(`/api-customizations/${useCaseId}/${encodeURIComponent(apiName)}/reset`, {}),

  // Eliminar personalización
  delete: (useCaseId: string, apiName: string) =>
    api.delete<ApiResponse<any>>(`/api-customizations/${useCaseId}/${encodeURIComponent(apiName)}`),

  // Obtener todas las personalizaciones de un caso de uso
  getByUseCase: (useCaseId: string) =>
    api.get<ApiResponse<any[]>>(`/api-customizations/${useCaseId}`),
};

// Servicios de API individual (página dedicada)
export const singleApiService = {
  // Obtener información completa de una API específica
  get: (useCaseId: string, apiName: string) =>
    api.get<ApiResponse<{
      useCase: { id: string; title: string; description: string };
      api: any;
      customization: any | null;
      openApiSpec: any;
      hasCustomization: boolean;
      availableOperations: string[];
    }>>(`/single-api/${useCaseId}/${encodeURIComponent(apiName)}`),

  getApiData: (useCaseId: string, apiName: string) =>
    api.get<ApiResponse<{
      useCase: { id: string; title: string; description: string };
      api: any;
      customization: any | null;
      openApiSpec: any;
      hasCustomization: boolean;
      availableOperations: string[];
    }>>(`/single-api/${useCaseId}/${encodeURIComponent(apiName)}`).then(res => res.data.data),

  // Obtener especificación OpenAPI únicamente
  getOpenApiSpec: (useCaseId: string, apiName: string, includeCustomizations = true) =>
    api.get<ApiResponse<any>>(`/single-api/${useCaseId}/${encodeURIComponent(apiName)}/openapi-spec`, {
      params: { includeCustomizations }
    }),

  // Obtener APIs relacionadas
  getRelatedApis: (useCaseId: string, apiName: string) =>
    api.get<ApiResponse<{
      currentApi: { name: string; domain: string };
      relatedApis: any[];
      count: number;
      groupedByDomain: Record<string, any[]>;
    }>>(`/single-api/${useCaseId}/${encodeURIComponent(apiName)}/related-apis`),
};

export default api; 