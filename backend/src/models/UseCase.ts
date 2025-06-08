import mongoose, { Document, Schema } from 'mongoose';

export interface IUseCase extends Document {
  title: string;
  description: string;
  originalText: string;
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'draft' | 'analyzing' | 'completed' | 'archived';
  
  // Campos estructurados del caso de uso
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
  
  // Análisis de ChatGPT
  analysis: {
    businessObjectives: string[];
    actors: string[];
    events: string[];
    flows: string[];
    suggestedDomains: string[];
    confidence: number;
  };
  
  // Dominios BIAN seleccionados
  selectedDomains: string[];
  
  // APIs semánticas sugeridas
  suggestedApis: Array<{
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
    yamlFile?: string;
  }>;
  
  // APIs seleccionadas por el usuario
  selectedApis: string[];
  
  // Schemas personalizados
  customSchemas: Array<{
    name: string;
    description: string;
    schema: Record<string, any>;
    apiAssociation?: string;
  }>;
  
  // Fuentes de datos
  dataSources: Array<{
    name: string;
    systemName: string;
    apiUrl: string;
    method: string;
    payload: Record<string, any>;
    associatedApi: string;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

const useCaseSchema = new Schema<IUseCase>({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  originalText: {
    type: String,
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'analyzing', 'completed', 'archived'],
    default: 'draft',
    index: true
  },
  
  // Campos estructurados del caso de uso
  objective: {
    type: String,
    trim: true
  },
  actors: {
    primary: [String],
    secondary: [String],
    systems: [String]
  },
  prerequisites: [String],
  mainFlow: [{
    step: { type: Number, required: true },
    actor: { type: String, required: true },
    action: { type: String, required: true },
    description: { type: String, required: true }
  }],
  alternativeFlows: [{
    name: { type: String, required: true },
    condition: { type: String, required: true },
    steps: [{
      step: { type: Number, required: true },
      actor: { type: String, required: true },
      action: { type: String, required: true },
      description: { type: String, required: true }
    }]
  }],
  postconditions: [String],
  businessRules: [String],
  nonFunctionalRequirements: {
    performance: String,
    security: String,
    usability: String,
    availability: String
  },
  assumptions: [String],
  constraints: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  complexity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  estimatedEffort: {
    type: String,
    trim: true
  },
  analysis: {
    businessObjectives: [String],
    actors: [String],
    events: [String],
    flows: [String],
    suggestedDomains: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },
  selectedDomains: [String],
  suggestedApis: [{
    name: { type: String, required: true },
    domain: { type: String, required: true },
    description: String,
    endpoints: [{
      path: String,
      method: String,
      operation: String,
      description: String
    }],
    coverage: [String],
    limitations: [String],
    yamlFile: String
  }],
  selectedApis: [String],
  customSchemas: [{
    name: { type: String, required: true },
    description: String,
    schema: Schema.Types.Mixed,
    apiAssociation: String
  }],
  dataSources: [{
    name: { type: String, required: true },
    systemName: { type: String, required: true },
    apiUrl: { type: String, required: true },
    method: { type: String, required: true },
    payload: Schema.Types.Mixed,
    associatedApi: { type: String, required: true }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Índices compuestos
useCaseSchema.index({ companyId: 1, status: 1 });
useCaseSchema.index({ userId: 1, status: 1 });
useCaseSchema.index({ companyId: 1, createdAt: -1 });

// Métodos estáticos
useCaseSchema.statics.findByCompany = function(companyId: string, status?: string) {
  const query: any = { companyId };
  if (status) query.status = status;
  return this.find(query).populate('userId', 'name email').sort({ createdAt: -1 });
};

useCaseSchema.statics.findByUser = function(userId: string, status?: string) {
  const query: any = { userId };
  if (status) query.status = status;
  return this.find(query).populate('companyId', 'name').sort({ createdAt: -1 });
};

// Métodos de instancia
useCaseSchema.methods.updateStatus = function(newStatus: string) {
  this.status = newStatus;
  return this.save();
};

useCaseSchema.methods.addCustomSchema = function(schema: any) {
  this.customSchemas.push(schema);
  return this.save();
};

useCaseSchema.methods.addDataSource = function(dataSource: any) {
  this.dataSources.push(dataSource);
  return this.save();
};

export const UseCase = mongoose.model<IUseCase>('UseCase', useCaseSchema); 