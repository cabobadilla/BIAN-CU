import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IApiCustomization extends Document {
  useCaseId: mongoose.Types.ObjectId;
  apiName: string;
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  
  // Personalizaciones del usuario
  customPayload?: Record<string, any>;
  customHeaders?: Record<string, string> | Map<string, string>;
  customParameters?: Record<string, any>;
  notes?: string;
  
  // Configuración de testing
  testingConfig?: {
    baseUrl?: string;
    timeout?: number;
    retries?: number;
  };
  
  // Historial de tests (últimos 10)
  testHistory?: Array<{
    timestamp: Date;
    method: string;
    endpoint: string;
    status?: number;
    responseTime?: number;
    success: boolean;
    errorMessage?: string;
  }>;
  
  // Metadatos
  isActive: boolean;
  lastModified: Date;
  version: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Interface para métodos estáticos
export interface IApiCustomizationModel extends Model<IApiCustomization> {
  findByUseCase(useCaseId: string, userId?: string): Promise<IApiCustomization[]>;
  findByApiAndUser(useCaseId: string, apiName: string, userId: string): Promise<IApiCustomization | null>;
  getRecentActivity(companyId: string, limit?: number): Promise<IApiCustomization[]>;
}

const apiCustomizationSchema = new Schema<IApiCustomization>({
  useCaseId: {
    type: Schema.Types.ObjectId,
    ref: 'UseCase',
    required: true,
    index: true
  },
  apiName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  
  // Personalizaciones
  customPayload: {
    type: Schema.Types.Mixed,
    default: null
  },
  customHeaders: {
    type: Map,
    of: String,
    default: new Map()
  },
  customParameters: {
    type: Schema.Types.Mixed,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  // Configuración de testing
  testingConfig: {
    baseUrl: {
      type: String,
      trim: true
    },
    timeout: {
      type: Number,
      min: 1000,
      max: 60000,
      default: 10000
    },
    retries: {
      type: Number,
      min: 0,
      max: 5,
      default: 1
    }
  },
  
  // Historial de tests
  testHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    },
    endpoint: {
      type: String,
      required: true
    },
    status: Number,
    responseTime: Number,
    success: {
      type: Boolean,
      required: true
    },
    errorMessage: String
  }],
  
  // Metadatos
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  }
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
apiCustomizationSchema.index({ useCaseId: 1, apiName: 1, userId: 1 }, { unique: true });
apiCustomizationSchema.index({ companyId: 1, lastModified: -1 });
apiCustomizationSchema.index({ userId: 1, lastModified: -1 });

// Middleware para actualizar lastModified
apiCustomizationSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('lastModified')) {
    this.lastModified = new Date();
    this.version += 1;
  }
  next();
});

// Middleware para limpiar historial (mantener solo últimos 10)
apiCustomizationSchema.pre('save', function(next) {
  if (this.testHistory && this.testHistory.length > 10) {
    this.testHistory = this.testHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }
  next();
});

// Métodos estáticos
apiCustomizationSchema.statics.findByUseCase = function(useCaseId: string, userId?: string) {
  const query: any = { useCaseId, isActive: true };
  if (userId) query.userId = userId;
  return this.find(query).sort({ lastModified: -1 });
};

apiCustomizationSchema.statics.findByApiAndUser = function(useCaseId: string, apiName: string, userId: string) {
  return this.findOne({ useCaseId, apiName, userId, isActive: true });
};

apiCustomizationSchema.statics.getRecentActivity = function(companyId: string, limit: number = 20) {
  return this.find({ companyId, isActive: true })
    .populate('userId', 'name email')
    .populate('useCaseId', 'title')
    .sort({ lastModified: -1 })
    .limit(limit);
};

// Métodos de instancia
apiCustomizationSchema.methods.addTestResult = function(testResult: {
  method: string;
  endpoint: string;
  status?: number;
  responseTime?: number;
  success: boolean;
  errorMessage?: string;
}) {
  if (!this.testHistory) {
    this.testHistory = [];
  }
  
  this.testHistory.unshift({
    timestamp: new Date(),
    ...testResult
  });
  
  // Mantener solo los últimos 10
  if (this.testHistory.length > 10) {
    this.testHistory = this.testHistory.slice(0, 10);
  }
  
  return this.save();
};

apiCustomizationSchema.methods.updateCustomization = function(updates: {
  customPayload?: Record<string, any>;
  customHeaders?: Record<string, string>;
  customParameters?: Record<string, any>;
  notes?: string;
  testingConfig?: any;
}) {
  Object.assign(this, updates);
  return this.save();
};

apiCustomizationSchema.methods.resetToDefaults = function() {
  this.customPayload = null;
  this.customHeaders = new Map();
  this.customParameters = null;
  this.notes = '';
  return this.save();
};

export const ApiCustomization = mongoose.model<IApiCustomization, IApiCustomizationModel>('ApiCustomization', apiCustomizationSchema); 