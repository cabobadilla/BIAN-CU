# 🚀 Guía de Despliegue en Render.com

## Descripción General

Este proyecto se despliega como dos servicios separados en Render.com:
- **Backend**: Web Service (Node.js API)
- **Frontend**: Static Site (React SPA)

## 📋 Prerrequisitos

1. Cuenta en [Render.com](https://render.com)
2. Repositorio GitHub con el código
3. Base de datos MongoDB (MongoDB Atlas recomendado)
4. Claves API necesarias (Google OAuth, OpenAI)

## 🔧 Configuración de Variables de Entorno

### Backend (.env variables)

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
FRONTEND_URL=https://bian-cu-frontend.onrender.com
API_URL=https://bian-cu-backend.onrender.com
LOG_LEVEL=info
```

### Frontend (Environment Variables)

```bash
VITE_API_URL=https://bian-cu-backend.onrender.com
```

## 🚀 Pasos de Despliegue

### Opción A: Despliegue Manual

#### 1. Desplegar Backend

1. Ir a [Render Dashboard](https://dashboard.render.com)
2. Hacer clic en "New +" → "Web Service"
3. Conectar repositorio GitHub
4. Configurar el servicio:
   - **Name**: `bian-cu-backend`
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free`

5. Configurar variables de entorno:
   - Ir a "Environment" tab
   - Agregar todas las variables listadas arriba
   - **IMPORTANTE**: Configurar `MONGODB_URI` con tu string de conexión

6. Configurar Health Check:
   - **Health Check Path**: `/health`

#### 2. Desplegar Frontend

1. En Render Dashboard → "New +" → "Static Site"
2. Conectar mismo repositorio GitHub
3. Configurar el sitio:
   - **Name**: `bian-cu-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `./frontend/dist`

4. Configurar variables de entorno:
   - **VITE_API_URL**: `https://bian-cu-backend.onrender.com`

### Opción B: Despliegue con render.yaml (Automatizado)

1. El archivo `render.yaml` en la raíz del proyecto configurará ambos servicios automáticamente
2. Conectar repositorio en Render Dashboard
3. Render detectará automáticamente el archivo `render.yaml`
4. Configurar las variables de entorno marcadas como `sync: false` manualmente

## 🔐 Configuración de Seguridad

### 1. MongoDB Atlas

1. Crear cluster en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Configurar usuario y contraseña
3. Agregar IP de Render a la whitelist (0.0.0.0/0 para desarrollo)
4. Obtener string de conexión

### 2. Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto o usar existente
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Configurar URLs autorizadas:
   - **Authorized origins**: `https://bian-cu-backend.onrender.com`
   - **Authorized redirect URIs**: `https://bian-cu-backend.onrender.com/api/v1/auth/google/callback`

### 3. OpenAI API

1. Crear cuenta en [OpenAI](https://openai.com)
2. Generar API key en dashboard
3. Configurar límites de uso si es necesario

## 🔄 Proceso de Build

### Backend Build Process

```bash
# 1. Instalar dependencias
cd backend && npm install

# 2. Compilar TypeScript
npm run build

# 3. Iniciar servidor
npm start
```

### Frontend Build Process

```bash
# 1. Instalar dependencias
cd frontend && npm install

# 2. Build para producción
npm run build

# 3. Archivos generados en ./frontend/dist
```

## 🔍 Verificación del Despliegue

### 1. Backend

- **Health Check**: `https://bian-cu-backend.onrender.com/health`
- **API Docs**: `https://bian-cu-backend.onrender.com/api-docs`
- **Expected Response**: `{"status": "OK", "timestamp": "...", "version": "1.0.0"}`

### 2. Frontend

- **URL**: `https://bian-cu-frontend.onrender.com`
- **Expected**: Página de login/dashboard cargando correctamente
- **Network Tab**: Verificar que las llamadas API apunten al backend correcto

## 🐛 Troubleshooting

### Errores Comunes

1. **Backend no inicia**:
   - Verificar variables de entorno
   - Revisar logs en Render Dashboard
   - Verificar conexión a MongoDB

2. **Frontend no carga**:
   - Verificar que `VITE_API_URL` apunte al backend correcto
   - Revisar build logs por errores de compilación

3. **CORS Errors**:
   - Verificar que `FRONTEND_URL` en backend coincida con URL de frontend
   - Verificar configuración CORS en `backend/src/index.ts`

4. **Database Connection**:
   - Verificar string de conexión MongoDB
   - Verificar whitelist de IPs en MongoDB Atlas
   - Verificar usuario/contraseña

### Logs y Monitoreo

- **Backend Logs**: Render Dashboard → Service → Logs
- **Frontend Logs**: Browser Developer Tools → Console/Network
- **Database Logs**: MongoDB Atlas → Monitoring

## 📈 Post-Despliegue

### 1. Configurar Dominios Personalizados (Opcional)

1. En Render Dashboard → Service → Settings
2. Agregar dominio personalizado
3. Configurar DNS records

### 2. Configurar SSL

- Render maneja SSL automáticamente para dominios .onrender.com
- Para dominios personalizados, seguir documentación de Render

### 3. Monitoreo y Alertas

- Configurar notifications en Render para deployments
- Configurar monitoring para uptime
- Revisar métricas de uso regularmente

## 🔄 Updates y Maintenance

### Deploy Updates

1. Push cambios a rama principal en GitHub
2. Render automáticamente detectará cambios
3. Build y deploy automático
4. Verificar que servicios estén funcionando

### Rollback

1. En Render Dashboard → Service → Deploys
2. Seleccionar deploy anterior
3. Hacer clic en "Redeploy"

## 📞 Soporte

- **Render Docs**: [docs.render.com](https://docs.render.com)
- **MongoDB Atlas Support**: [MongoDB Support](https://support.mongodb.com)
- **Project Issues**: Crear issue en repositorio GitHub 