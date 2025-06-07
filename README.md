# BIAN-CU Platform

Plataforma SaaS multiempresa para gestión de casos de uso bancarios alineados con el estándar BIAN v13.

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Base de Datos**: MongoDB Atlas
- **Autenticación**: Google OAuth 2.0
- **GenAI**: OpenAI ChatGPT-3.5
- **Despliegue**: Render.com

## 🚀 Desarrollo Local

### Prerrequisitos

- Node.js >= 18.0.0
- npm o yarn
- Cuenta de MongoDB Atlas
- Credenciales de Google OAuth
- API Key de OpenAI

### Configuración

1. **Instalar dependencias**:
```bash
npm run install:all
```

2. **Configurar variables de entorno**:
```bash
# Backend (.env.local en /backend)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=3001

# Frontend (.env.local en /frontend)
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

3. **Ejecutar en modo desarrollo**:
```bash
npm run dev
```

Esto iniciará:
- Frontend en http://localhost:5173
- Backend en http://localhost:3001
- API Documentation en http://localhost:3001/api-docs

### Scripts Disponibles

- `npm run dev` - Ejecuta frontend y backend en paralelo
- `npm run build` - Construye ambos proyectos para producción
- `npm run lint` - Ejecuta linting en ambos proyectos
- `npm run test` - Ejecuta tests en ambos proyectos

## 📁 Estructura del Proyecto

```
├── frontend/          # Aplicación React
├── backend/           # API Node.js
└── README.md         # Este archivo
```

## 🔧 Funcionalidades

- ✅ Autenticación con Google OAuth
- ✅ Gestión multiempresa
- ✅ Creación y gestión de casos de uso
- ✅ Integración con ChatGPT para análisis
- ✅ Sugerencias de dominios BIAN
- ✅ APIs semánticas con Swagger
- ✅ Editor de schemas personalizados
- ✅ Gestión de fuentes de datos

## 📚 Documentación API

La documentación interactiva de la API está disponible en `/api-docs` cuando el backend está ejecutándose.

## 🚀 Despliegue

### Frontend (Render.com - Static Site)
1. Conectar repositorio
2. Build Command: `cd frontend && npm run build`
3. Publish Directory: `frontend/dist`

### Backend (Render.com - Web Service)
1. Conectar repositorio
2. Build Command: `cd backend && npm run build`
3. Start Command: `cd backend && npm start`
4. Configurar variables de entorno en Render

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request 