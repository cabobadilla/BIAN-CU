export interface UseCase {
  _id: string;
  title: string;
  description: string;
  originalText: string;
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
  requestSchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
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