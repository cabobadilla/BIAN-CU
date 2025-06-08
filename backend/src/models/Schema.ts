import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';

export interface ISchema extends Document {
  name: string;
  description: string;
  schema: any;
  companyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schemaSchema = new MongooseSchema<ISchema>({
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
  schema: {
    type: MongooseSchema.Types.Mixed,
    required: true
  },
  companyId: {
    type: MongooseSchema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices
schemaSchema.index({ companyId: 1, name: 1 });
schemaSchema.index({ createdBy: 1 });

export const Schema = mongoose.model<ISchema>('Schema', schemaSchema); 