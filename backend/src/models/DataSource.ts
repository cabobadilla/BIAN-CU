import mongoose, { Document, Schema } from 'mongoose';

export interface IDataSource extends Document {
  name: string;
  description: string;
  type: 'REST_API' | 'DATABASE' | 'FILE' | 'SOAP' | 'GRAPHQL';
  connectionConfig: {
    apiUrl?: string;
    method?: string;
    headers?: Record<string, string>;
    authentication?: {
      type: 'none' | 'bearer' | 'basic' | 'api_key';
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
    };
  };
  companyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dataSourceSchema = new Schema<IDataSource>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['REST_API', 'DATABASE', 'FILE', 'SOAP', 'GRAPHQL']
  },
  connectionConfig: {
    apiUrl: {
      type: String,
      trim: true
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    headers: {
      type: Schema.Types.Mixed,
      default: {}
    },
    authentication: {
      type: {
        type: String,
        enum: ['none', 'bearer', 'basic', 'api_key'],
        default: 'none'
      },
      token: String,
      username: String,
      password: String,
      apiKey: String
    }
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices
dataSourceSchema.index({ companyId: 1, name: 1 });
dataSourceSchema.index({ createdBy: 1 });
dataSourceSchema.index({ type: 1 });

export const DataSource = mongoose.model<IDataSource>('DataSource', dataSourceSchema); 