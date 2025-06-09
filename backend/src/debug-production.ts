// Script de debug específico para diagnosticar problemas en producción
console.log('=== PRODUCTION DEBUG START ===');

try {
  console.log('1. Importing dotenv...');
  const dotenv = require('dotenv');
  
  console.log('2. Configuring dotenv...');
  dotenv.config({ path: '.env.local' });
  
  console.log('3. Environment variables loaded');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  
  console.log('4. Testing mongoose import...');
  const mongoose = require('mongoose');
  console.log('✅ Mongoose imported successfully');
  
  console.log('5. Testing MongoDB connection...');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      
      console.log('6. Testing Company model import...');
      // Simulate the Company model import that might be failing
      try {
        const { Company } = require('./models/Company');
        console.log('✅ Company model imported successfully');
        
        console.log('7. Testing simple Company query...');
        Company.findOne({}).then(() => {
          console.log('✅ Company query successful');
          process.exit(0);
        }).catch((error: any) => {
          console.log('❌ Company query failed:', error.message);
          process.exit(1);
        });
        
      } catch (error: any) {
        console.log('❌ Company model import failed:', error.message);
        process.exit(1);
      }
      
    })
    .catch((error: any) => {
      console.log('❌ MongoDB connection failed:', error.message);
      process.exit(1);
    });
    
} catch (error: any) {
  console.log('❌ Critical error:', error.message);
  console.log('Stack:', error.stack);
  process.exit(1);
} 