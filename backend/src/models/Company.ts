import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  description?: string;
  domain?: string;
  isActive: boolean;
  settings: {
    allowedDomains: string[];
    maxUsers: number;
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowedDomains: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    maxUsers: {
      type: Number,
      default: 10
    },
    features: [{
      type: String,
      enum: ['use-cases', 'bian-analysis', 'api-generation', 'custom-schemas', 'data-sources']
    }]
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

// Índices
companySchema.index({ name: 1, isActive: 1 });
companySchema.index({ domain: 1, isActive: 1 });

// Middleware pre-save
companySchema.pre('save', function(next) {
  if (this.isModified('domain') && this.domain) {
    this.domain = this.domain.toLowerCase();
  }
  if (this.isModified('settings.allowedDomains')) {
    this.settings.allowedDomains = this.settings.allowedDomains.map(domain => domain.toLowerCase());
  }
  next();
});

// Métodos estáticos
companySchema.statics.findByDomain = function(domain: string) {
  return this.findOne({ 
    $or: [
      { domain: domain.toLowerCase() },
      { 'settings.allowedDomains': domain.toLowerCase() }
    ],
    isActive: true 
  });
};

companySchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Métodos de instancia
companySchema.methods.canUserJoin = function(userEmail: string) {
  const emailDomain = userEmail.split('@')[1];
  return this.domain === emailDomain || this.settings.allowedDomains.includes(emailDomain);
};

companySchema.methods.hasFeature = function(feature: string) {
  return this.settings.features.includes(feature);
};

export const Company = mongoose.model<ICompany>('Company', companySchema); 