// Script de diagnóstico para identificar problemas de inicio
console.log('=== INICIO DEBUG ===');

try {
  console.log('1. Iniciando imports...');
  
  // Import básicos primero
  console.log('2. Importando dotenv...');
  import('dotenv').then((dotenv) => {
    console.log('3. Configurando dotenv...');
    dotenv.default.config({ path: '.env.local' });
    
    console.log('4. Variables de entorno cargadas');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT);
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    
    console.log('5. Importando express...');
    return import('express');
  }).then((express) => {
    console.log('6. Express importado, creando app...');
    const app = express.default();
    
    console.log('7. App creada, configurando health check...');
    app.get('/health', (req: any, res: any) => {
      res.json({ status: 'OK', debug: true });
    });
    
    const PORT = process.env.PORT || 3001;
    console.log('8. Iniciando servidor en puerto:', PORT);
    
    app.listen(PORT, () => {
      console.log(`✅ Servidor de DEBUG funcionando en puerto ${PORT}`);
    });
    
  }).catch((error) => {
    console.error('❌ Error en imports:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Error general:', error);
  process.exit(1);
} 