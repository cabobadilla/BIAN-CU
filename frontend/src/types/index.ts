export interface UseCase {
  _id: string;
  title: string;
  description: string;
  originalText: string;
  // Campos estructurados del caso de uso
  objective: string;
  actors: {
    primary: string[];
    secondary: string[];
    systems: string[];
  };
  prerequisites: string[];
  mainFlow: {
    step: number;
    actor: string;
    action: string;
    description: string;
  }[];
  alternativeFlows?: {
    name: string;
    condition: string;
    steps: {
      step: number;
      actor: string;
      action: string;
      description: string;
    }[];
  }[];
  postconditions: string[];
  businessRules: string[];
  nonFunctionalRequirements?: {
    performance?: string;
    security?: string;
    usability?: string;
    availability?: string;
  };
  assumptions: string[];
  constraints: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'low' | 'medium' | 'high';
  estimatedEffort?: string;
  status: 'draft' | 'analyzing' | 'analyzed' | 'domains_selected' | 'apis_selected' | 'completed';
  aiAnalysis?: {
    summary: string;
    keyEntities: string[];
    businessProcesses: string[];
    suggestedDomains: string[];
    complexity: 'low' | 'medium' | 'high';
    confidence: number;
  };
  selectedDomains: string[];
  selectedApis: string[];
  suggestedApis?: BianApi[];
  customSchemas: CustomSchema[];
  dataSources: DataSource[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BianDomain {
  name: string;
  description: string;
  businessArea: string;
  keyCapabilities: string[];
  relatedDomains: string[];
}

export interface BianApi {
  name: string;
  domain: string;
  description: string;
  version: string;
  operationType: 'CR' | 'UP' | 'RQ' | 'BQ';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  availableMethods?: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  parameters?: {
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }[];
  requestSchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  reason?: string;
}

export interface CustomSchema {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  generatedBy: 'ai' | 'manual';
  createdAt: string;
}

export interface DataSource {
  name: string;
  type: 'api' | 'database' | 'file';
  connection: {
    apiUrl?: string;
    method?: string;
    headers?: Record<string, string>;
    payload?: Record<string, unknown>;
    databaseUrl?: string;
    filePath?: string;
  };
  isValidated: boolean;
  lastValidated?: string;
  createdAt: string;
}

export interface Company {
  _id: string;
  name: string;
  domain?: string;
  settings: {
    allowedDomains: string[];
    maxUseCases: number;
    features: {
      aiAnalysis: boolean;
      customSchemas: boolean;
      dataSources: boolean;
    };
  };
  users: CompanyUser[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  _id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: string;
  joinedAt: string;
}

export interface DashboardStats {
  totalUseCases: number;
  completedUseCases: number;
  inProgressUseCases: number;
  totalDomains: number;
  totalApis: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'use_case_created' | 'use_case_completed' | 'domain_selected' | 'api_selected';
  title: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    picture?: string;
  };
}

// Nuevos tipos para personalización de APIs
export interface ApiCustomization {
  _id: string;
  useCaseId: string;
  apiName: string;
  userId: string;
  companyId: string;
  
  customPayload?: Record<string, any>;
  customHeaders?: Record<string, string>;
  customParameters?: Record<string, any>;
  notes?: string;
  
  testingConfig?: {
    baseUrl?: string;
    timeout?: number;
    retries?: number;
  };
  
  testHistory?: ApiTestResult[];
  
  isActive: boolean;
  lastModified: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTestResult {
  timestamp: string;
  method: string;
  endpoint: string;
  status?: number;
  responseTime?: number;
  success: boolean;
  errorMessage?: string;
}

export interface SingleApiPageData {
  useCase: {
    id: string;
    title: string;
    description: string;
  };
  api: {
    name: string;
    domain: string;
    description: string;
    endpoints: Array<{
      path: string;
      method: string;
      operation: string;
      description: string;
    }>;
    coverage: string[];
    limitations: string[];
  };
  customization: ApiCustomization | null;
  openApiSpec: any;
  hasCustomization: boolean;
  availableOperations: string[];
}

export interface RelatedApisData {
  currentApi: {
    name: string;
    domain: string;
  };
  relatedApis: Array<{
    name: string;
    domain: string;
    description: string;
    hasCustomization: boolean;
  }>;
  count: number;
  groupedByDomain: Record<string, Array<{
    name: string;
    domain: string;
    description: string;
    hasCustomization: boolean;
  }>>;
} 