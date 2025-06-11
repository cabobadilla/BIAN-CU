import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User, IUser } from '../models/User';
import { Company } from '../models/Company';
import { logger } from '../utils/logger';

// Configuración de Google OAuth Strategy
// Determinar callback URL
const baseUrl = process.env.API_URL || 'https://bian-cu-backend.onrender.com';
const callbackURL = `${baseUrl}/api/v1/auth/google/callback`;
logger.info('Configuración OAuth inicializada');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const name = profile.displayName;
    const picture = profile.photos?.[0]?.value;

    if (!email) {
      logger.error('No se pudo obtener email del perfil de Google');
      return done(new Error('No se pudo obtener el email del perfil de Google'), false);
    }

    // Buscar usuario existente
    let user = await User.findOne({ googleId, isActive: true });
    
    if (user) {
      // Actualizar último login
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Si no existe, buscar por email
    user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    
    if (user) {
      // Vincular cuenta de Google existente
      user.googleId = googleId;
      user.picture = picture;
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Determinar empresa basada en dominio del email
    const emailDomain = email.split('@')[1];
    
    let company = await Company.findOne({ 
      $or: [
        { domain: emailDomain.toLowerCase() },
        { 'settings.allowedDomains': emailDomain.toLowerCase() }
      ],
      isActive: true 
    });

    if (!company) {
      // Crear empresa automáticamente para dominios no registrados
      company = new Company({
        name: `${emailDomain.split('.')[0]} Company`,
        domain: emailDomain,
        settings: {
          allowedDomains: [emailDomain],
          maxUsers: 10,
          features: ['use-cases', 'bian-analysis', 'api-generation']
        }
      });
      await company.save();
      logger.info(`Nueva empresa creada para dominio: ${emailDomain}`);
    }

    // Verificar que la empresa tiene un ID válido
    if (!company._id) {
      throw new Error('No se pudo obtener el ID de la empresa');
    }

    // Crear nuevo usuario
    user = new User({
      googleId,
      email,
      name,
      picture,
      companyId: company._id,
      role: 'admin', // Primer usuario de la empresa es admin
      lastLogin: new Date()
    });

    await user.save();
    logger.info(`Nuevo usuario registrado: ${email}`);
    
    return done(null, user);

  } catch (error) {
    logger.error('Error en Google OAuth Strategy:', error);
    return done(error, false);
  }
}));

// Configuración de JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!,
  issuer: 'bian-cu-platform',
  audience: 'bian-cu-users'
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.sub).populate('companyId');
    
    if (!user || !user.isActive) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    logger.error('Error en JWT Strategy:', error);
    return done(error, false);
  }
}));

// Serialización para sesiones
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).populate('companyId');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport; 