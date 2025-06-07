import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  companyId: mongoose.Types.ObjectId;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  picture: {
    type: String,
    trim: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
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
userSchema.index({ companyId: 1, email: 1 });
userSchema.index({ companyId: 1, isActive: 1 });

// Middleware pre-save
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Métodos de instancia
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.__v;
  return userObject;
};

// Métodos estáticos
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

userSchema.statics.findByGoogleId = function(googleId: string) {
  return this.findOne({ googleId, isActive: true });
};

userSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true }).populate('companyId');
};

export const User = mongoose.model<IUser>('User', userSchema); 