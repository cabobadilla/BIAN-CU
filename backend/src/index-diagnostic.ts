// Configurar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('=== DIAGNOSTIC SERVER START ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI configured:', !!process.env.MONGODB_URI);
console.log('Google OAuth configured:', !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET);

try {
  console.log('1. Testing express import...');
  const express = require('express');
  console.log('✅ Express imported successfully');

  console.log('2. Testing cors import...');
  const cors = require('cors');
  console.log('✅ CORS imported successfully');

  console.log('3. Testing helmet import...');
  const helmet = require('helmet');
  console.log('✅ Helmet imported successfully');

  console.log('4. Testing express-rate-limit import...');
  const rateLimit = require('express-rate-limit');
  console.log('✅ Rate limit imported successfully');

  console.log('5. Testing express-session import...');
  const session = require('express-session');
  console.log('✅ Session imported successfully');

  console.log('6. Testing connect-mongo import...');
  const MongoStore = require('connect-mongo');
  console.log('✅ MongoStore imported successfully');

  console.log('7. Testing passport import...');
  const passport = require('passport');
  console.log('✅ Passport imported successfully');

  console.log('8. Testing swagger-jsdoc import...');
  const swaggerJsdoc = require('swagger-jsdoc');
  console.log('✅ Swagger JsDoc imported successfully');

  console.log('9. Testing swagger-ui-express import...');
  const swaggerUi = require('swagger-ui-express');
  console.log('✅ Swagger UI imported successfully');

  console.log('10. Testing database config import...');
  const { connectDB } = require('./config/database');
  console.log('✅ Database config imported successfully');

  console.log('11. Testing logger import...');
  const { logger } = require('./utils/logger');
  console.log('✅ Logger imported successfully');

  console.log('12. Testing initialization import...');
  const { initializeDefaultData } = require('./utils/initialization');
  console.log('✅ Initialization imported successfully');

  console.log('13. Testing error handler import...');
  const { errorHandler } = require('./middleware/errorHandler');
  console.log('✅ Error handler imported successfully');

  console.log('14. Testing auth routes import...');
  const { authRoutes } = require('./routes/auth');
  console.log('✅ Auth routes imported successfully');

  console.log('15. Testing company routes import...');
  const { companyRoutes } = require('./routes/companies');
  console.log('✅ Company routes imported successfully');

  console.log('16. Testing use case routes import...');
  const { useCaseRoutes } = require('./routes/useCases');
  console.log('✅ Use case routes imported successfully');

  console.log('17. Testing BIAN routes import...');
  const { bianRoutes } = require('./routes/bian');
  console.log('✅ BIAN routes imported successfully');

  console.log('18. Testing schema routes import...');
  const { schemaRoutes } = require('./routes/schemas');
  console.log('✅ Schema routes imported successfully');

  console.log('19. Testing data source routes import...');
  const { dataSourceRoutes } = require('./routes/dataSources');
  console.log('✅ Data source routes imported successfully');

  console.log('20. Testing API customization routes import...');
  const { apiCustomizationRoutes } = require('./routes/apiCustomizations');
  console.log('✅ API customization routes imported successfully');

  console.log('21. Testing single API routes import...');
  const { singleApiRoutes } = require('./routes/singleApiRoutes');
  console.log('✅ Single API routes imported successfully');

  console.log('🎉 ALL IMPORTS SUCCESSFUL - Creating basic server...');

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.get('/health', (req: any, res: any) => {
    res.status(200).json({ 
      status: 'DIAGNOSTIC SERVER OK', 
      timestamp: new Date().toISOString(),
      message: 'All imports successful'
    });
  });

  app.listen(PORT, () => {
    console.log(`✅ DIAGNOSTIC Server running successfully on port ${PORT}`);
  });

} catch (error: any) {
  console.error('❌ IMPORT ERROR DETECTED:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
} 