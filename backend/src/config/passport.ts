import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User, IUser } from '../models/User';
import { Company } from '../models/Company';
import { logger } from '../utils/logger';

// Configuración de Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/api/v1/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const name = profile.displayName;
    const picture = profile.photos?.[0]?.value;

    if (!email) {
      return done(new Error('No se pudo obtener el email del perfil de Google'), null);
    }

    // Buscar usuario existente
    let user = await User.findByGoogleId(googleId);
    
    if (user) {
      // Actualizar último login
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Si no existe, buscar por email
    user = await User.findByEmail(email);
    
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
    let company = await Company.findByDomain(emailDomain);

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
      logger.info(`Nueva empresa creada automáticamente: ${company.name}`);
    }

    // Crear nuevo usuario
    user = new User({
      googleId,
      email,
      name,
      picture,
      companyId: company._id,
      role: 'user',
      lastLogin: new Date()
    });

    await user.save();
    logger.info(`Nuevo usuario registrado: ${email}`);
    
    return done(null, user);

  } catch (error) {
    logger.error('Error en Google OAuth Strategy:', error);
    return done(error, null);
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