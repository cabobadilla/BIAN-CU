const mongoose = require('mongoose');

async function compareDatabases() {
  console.log('🔍 Comparando bases de datos...\n');
  
  try {
    // Conexión a local
    const localUri = 'mongodb://localhost:27017/bian-api-generator';
    const localConn = await mongoose.createConnection(localUri);
    console.log('✅ Conectado a MongoDB local');
    
    // Conexión a Atlas
    const atlasUri = 'mongodb+srv://AdminPlaylistCreator:BgvsJo6AKgIEWq4R@cluster0.vduse.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    const atlasConn = await mongoose.createConnection(atlasUri);
    console.log('✅ Conectado a MongoDB Atlas');
    
    // Listar colecciones en ambas BDs
    const localCollections = await localConn.db.listCollections().toArray();
    const atlasCollections = await atlasConn.db.listCollections().toArray();
    
    console.log('\n📊 Colecciones en LOCAL:');
    localCollections.forEach(col => console.log('-', col.name));
    
    console.log('\n📊 Colecciones en ATLAS:');
    atlasCollections.forEach(col => console.log('-', col.name));
    
    // Verificar usuarios específicamente
    if (localCollections.find(c => c.name === 'users')) {
      const localUsers = await localConn.db.collection('users').find({}).toArray();
      console.log('\n👥 Usuarios en LOCAL:', localUsers.length);
      localUsers.forEach(user => console.log('- Email:', user.email, 'GoogleId:', user.googleId, 'Company:', user.company?.name || 'N/A'));
    }
    
    if (atlasCollections.find(c => c.name === 'users')) {
      const atlasUsers = await atlasConn.db.collection('users').find({}).toArray();
      console.log('\n👥 Usuarios en ATLAS:', atlasUsers.length);
      atlasUsers.forEach(user => console.log('- Email:', user.email, 'GoogleId:', user.googleId, 'Company:', user.company?.name || 'N/A'));
    }
    
    // Verificar casos de uso
    if (localCollections.find(c => c.name === 'usecases')) {
      const localUseCases = await localConn.db.collection('usecases').find({}).toArray();
      console.log('\n📋 Casos de Uso en LOCAL:', localUseCases.length);
    }
    
    if (atlasCollections.find(c => c.name === 'usecases')) {
      const atlasUseCases = await atlasConn.db.collection('usecases').find({}).toArray();
      console.log('📋 Casos de Uso en ATLAS:', atlasUseCases.length);
    }
    
    // Verificar companies
    if (localCollections.find(c => c.name === 'companies')) {
      const localCompanies = await localConn.db.collection('companies').find({}).toArray();
      console.log('\n🏢 Empresas en LOCAL:', localCompanies.length);
      localCompanies.forEach(company => console.log('- Name:', company.name, 'Domain:', company.domain));
    }
    
    if (atlasCollections.find(c => c.name === 'companies')) {
      const atlasCompanies = await atlasConn.db.collection('companies').find({}).toArray();
      console.log('\n🏢 Empresas en ATLAS:', atlasCompanies.length);
      atlasCompanies.forEach(company => console.log('- Name:', company.name, 'Domain:', company.domain));
    }
    
    await localConn.close();
    await atlasConn.close();
    console.log('\n✅ Comparación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

compareDatabases(); 