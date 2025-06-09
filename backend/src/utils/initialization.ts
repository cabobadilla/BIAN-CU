import { Company } from '../models/Company';
import { logger } from './logger';

export async function initializeDefaultData() {
  try {
    logger.info('🔧 Iniciando verificación de datos por defecto...');

    // Verificar y crear empresa para dominios gmail.com
    await ensureCompanyExists('gmail.com', 'Gmail Company');
    
    // Verificar y crear empresa para dominios genéricos
    await ensureCompanyExists('example.com', 'Default Company');
    
    logger.info('✅ Verificación de datos por defecto completada');
  } catch (error) {
    logger.error('❌ Error al inicializar datos por defecto:', error);
  }
}

async function ensureCompanyExists(domain: string, name: string) {
  try {
    // Buscar si ya existe una empresa para este dominio
    const existingCompany = await Company.findOne({ domain });
    
    if (!existingCompany) {
      logger.info(`📝 Creando empresa por defecto para dominio: ${domain}`);
      
      const company = new Company({
        name,
        domain,
        description: `Empresa por defecto para usuarios con dominio ${domain}`,
        settings: {
          allowedDomains: [domain],
          maxUsers: 100,
          features: {
            useCaseGeneration: true,
            apiGeneration: true,
            schemaGeneration: true,
            collaboration: true
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await company.save();
      logger.info(`✅ Empresa creada: ${name} (${domain})`);
    } else {
      logger.info(`ℹ️ Empresa ya existe para dominio: ${domain} -> ${existingCompany.name}`);
    }
  } catch (error) {
    logger.error(`❌ Error al crear empresa para dominio ${domain}:`, error);
  }
} 