# 🚀 Guía de Configuración - BIAN-CU Platform

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **npm** o **yarn**
- **MongoDB Atlas** (cuenta gratuita)
- **Google Cloud Console** (para OAuth)
- **OpenAI API Key** (para análisis con IA)

---

## ⚙️ Configuración del Backend

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
Edita el archivo `backend/.env.local` con tus credenciales:

```env
# Configuración del servidor
NODE_ENV=development
PORT=3001

# Base de datos MongoDB Atlas
MONGODB_URI=mongodb+srv://TU_USUARIO:TU_PASSWORD@TU_CLUSTER.mongodb.net/bian-cu-platform?retryWrites=true&w=majority

# Autenticación Google OAuth (desde Google Cloud Console)
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui

# JWT Secret (genera una clave segura)
JWT_SECRET=tu_clave_jwt_super_secreta_y_larga_aqui

# OpenAI API (desde OpenAI Platform)
OPENAI_API_KEY=sk-tu_openai_api_key_aqui

# URLs para producción
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3001

# Configuración de logs
LOG_LEVEL=debug
```

### 3. Ejecutar el backend
```bash
npm run dev
```

---

## 🎨 Configuración del Frontend

### 1. Instalar dependencias
```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno
Edita el archivo `frontend/.env.local`:

```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001/api/v1
VITE_GOOGLE_CLIENT_ID=tu_google_client_id_aqui
```

### 3. Ejecutar el frontend
```bash
npm run dev
```

---

## 🔧 Configuración de Servicios Externos

### MongoDB Atlas
1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crear un cluster gratuito
3. Crear un usuario de base de datos
4. Obtener la cadena de conexión
5. Reemplazar en `MONGODB_URI`

### Google OAuth
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar uno existente
3. Habilitar la API de Google+
4. Crear credenciales OAuth 2.0:
   - **Tipo**: Aplicación web
   - **URIs de redirección autorizados**: 
     - `http://localhost:3001/auth/google/callback` (desarrollo)
     - `https://tu-dominio-backend.com/auth/google/callback` (producción)
   - **Orígenes autorizados**:
     - `http://localhost:5173` (desarrollo)
     - `https://tu-dominio-frontend.com` (producción)
5. Copiar Client ID y Client Secret

### OpenAI API
1. Crear cuenta en [OpenAI Platform](https://platform.openai.com/)
2. Ir a API Keys
3. Crear una nueva API key
4. Copiar la clave (empieza con `sk-`)

---

## 🚀 Despliegue en Render.com

### Backend
1. Conectar repositorio en Render
2. Configurar como "Web Service"
3. Configurar variables de entorno en Render:
   - Todas las variables del `.env.local`
   - Actualizar `FRONTEND_URL` con la URL de producción
4. Comando de build: `npm install`
5. Comando de start: `npm start`

### Frontend
1. Conectar repositorio en Render
2. Configurar como "Static Site"
3. Configurar variables de entorno:
   - `VITE_API_URL`: URL del backend en producción
   - `VITE_GOOGLE_CLIENT_ID`: mismo que el backend
4. Comando de build: `npm run build`
5. Directorio de publicación: `dist`

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE: Archivos que NUNCA deben subirse a Git

Los siguientes archivos están protegidos por `.gitignore`:

- `backend/.env.local`
- `frontend/.env.local`
- Cualquier archivo `.env*`
- Archivos de claves (`*.key`, `*.pem`, etc.)
- Credenciales de servicios cloud

### 🛡️ Buenas Prácticas

1. **JWT Secret**: Usar una clave de al menos 32 caracteres
2. **MongoDB**: Crear usuario específico para la aplicación
3. **Google OAuth**: Configurar dominios autorizados correctamente
4. **OpenAI**: Monitorear uso de tokens
5. **Variables de entorno**: Nunca hardcodear credenciales en el código

---

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

---

## 📚 Estructura del Proyecto

```
BIAN-CU/
├── backend/
│   ├── .env.local          # ⚠️ NO SUBIR A GIT
│   ├── env.example         # ✅ Template de configuración
│   └── src/
├── frontend/
│   ├── .env.local          # ⚠️ NO SUBIR A GIT
│   └── src/
├── .gitignore              # ✅ Protege archivos sensibles
└── SETUP.md               # ✅ Esta guía
```

---

## 🆘 Solución de Problemas

### Error de conexión a MongoDB
- Verificar que la IP esté en la whitelist de MongoDB Atlas
- Comprobar usuario y contraseña
- Verificar formato de la URI

### Error de Google OAuth
- Verificar que las URLs de redirección estén configuradas
- Comprobar que el Client ID sea correcto
- Verificar que la API de Google+ esté habilitada

### Error de OpenAI
- Verificar que la API key sea válida
- Comprobar que tengas créditos disponibles
- Verificar que el modelo esté disponible

---

## 📞 Soporte

Si tienes problemas con la configuración:

1. Revisar los logs del backend: `npm run dev`
2. Revisar la consola del navegador
3. Verificar que todas las variables de entorno estén configuradas
4. Comprobar que los servicios externos estén funcionando

---

**¡Listo! Tu plataforma BIAN-CU debería estar funcionando correctamente.** 🎉 