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
  callbackURL: `${process.env.API_URL}/api/v1/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info('=== INICIO GOOGLE OAUTH STRATEGY ===');
    logger.info(`Profile recibido: ${JSON.stringify(profile, null, 2)}`);
    
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const name = profile.displayName;
    const picture = profile.photos?.[0]?.value;

    logger.info(`Datos extraídos - Email: ${email}, GoogleId: ${googleId}, Name: ${name}`);

    if (!email) {
      logger.error('No se pudo obtener email del perfil de Google');
      return done(new Error('No se pudo obtener el email del perfil de Google'), false);
    }

    // Buscar usuario existente
    logger.info(`Buscando usuario existente por googleId: ${googleId}`);
    let user = await User.findOne({ googleId, isActive: true });
    
    if (user) {
      logger.info(`Usuario encontrado por googleId: ${user.email}`);
      // Actualizar último login
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Si no existe, buscar por email
    logger.info(`Usuario no encontrado por googleId, buscando por email: ${email.toLowerCase()}`);
    user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    
    if (user) {
      logger.info(`Usuario encontrado por email: ${user.email}, vinculando cuenta de Google`);
      // Vincular cuenta de Google existente
      user.googleId = googleId;
      user.picture = picture;
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    logger.info('Usuario no encontrado, procediendo a crear nuevo usuario y empresa');

    // Determinar empresa basada en dominio del email
    const emailDomain = email.split('@')[1];
    logger.info(`Buscando empresa para dominio: ${emailDomain}`);
    
    let company = await Company.findOne({ 
      $or: [
        { domain: emailDomain.toLowerCase() },
        { 'settings.allowedDomains': emailDomain.toLowerCase() }
      ],
      isActive: true 
    });
    
    logger.info(`Empresa encontrada: ${company ? company.name : 'No encontrada'}`);

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
      const savedCompany = await company.save();
      logger.info(`Nueva empresa creada automáticamente: ${company.name} con ID: ${company._id}`);
      logger.info(`Empresa guardada, ID verificado: ${savedCompany._id}, tipo: ${typeof savedCompany._id}`);
    }

    // Verificar que la empresa tiene un ID válido
    if (!company._id) {
      throw new Error('No se pudo obtener el ID de la empresa');
    }

    // Crear nuevo usuario
    logger.info(`Creando usuario con companyId: ${company._id}, tipo: ${typeof company._id}`);
    
    user = new User({
      googleId,
      email,
      name,
      picture,
      companyId: company._id,
      role: 'admin', // Primer usuario de la empresa es admin
      lastLogin: new Date()
    });

    logger.info(`Usuario creado en memoria, validando...`);
    await user.save();
    logger.info(`Nuevo usuario registrado: ${email} en empresa: ${company._id}`);
    
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