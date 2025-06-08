# Especificación Técnica Detallada - BIAN-CU Platform v2.0

## 1. Arquitectura de la Aplicación

### Frontend
* **Framework**: React 18 con TypeScript
* **Build Tool**: Vite (optimizado para desarrollo y producción)
* **Despliegue**: Aplicación estática en Render.com
* **Routing**: React Router v6
* **Estado Global**: Zustand para manejo de estado
* **Estilos**: Tailwind CSS v3
* **Iconos**: Lucide React
* **HTTP Client**: Axios con interceptores
* **Queries**: TanStack Query (React Query) para cache y sincronización

**Estructura de Componentes:**
```
src/
├── components/
│   ├── Layout.tsx          # Layout principal con navegación
│   ├── AuthCallback.tsx    # Manejo de callback OAuth
│   └── LoadingSpinner.tsx  # Componente de carga
├── pages/
│   ├── LoginPage.tsx       # Autenticación con Google
│   ├── DashboardPage.tsx   # Dashboard principal
│   ├── CreateUseCasePage.tsx # Creación de casos de uso (formulario estructurado)
│   ├── UseCasePage.tsx     # Vista detallada de caso de uso
│   ├── SchemasPage.tsx     # Gestión independiente de schemas
│   ├── DataSourcesPage.tsx # Gestión independiente de sistemas de origen
│   └── CompanyPage.tsx     # Gestión de empresa
├── services/
│   └── api.ts              # Servicios API centralizados
├── store/
│   └── authStore.ts        # Store de autenticación con Zustand
└── types/
    └── index.ts            # Definiciones de tipos TypeScript
```

### Backend
* **Runtime**: Node.js 18+
* **Framework**: Express.js
* **Despliegue**: Web Service en Render.com
* **Base de Datos**: MongoDB con Mongoose ODM
* **Autenticación**: Passport.js con Google OAuth 2.0
* **Validación**: Express Validator
* **Documentación**: Swagger/OpenAPI 3.0
* **Logging**: Winston para logs estructurados
* **Variables de Entorno**: dotenv para configuración

**Estructura del Backend:**
```
src/
├── models/
│   ├── User.ts             # Modelo de usuarios
│   ├── Company.ts          # Modelo de empresas
│   ├── UseCase.ts          # Modelo de casos de uso
│   ├── Schema.ts           # Modelo de schemas independientes
│   └── DataSource.ts       # Modelo de fuentes de datos independientes
├── routes/
│   ├── auth.ts             # Rutas de autenticación
│   ├── useCases.ts         # CRUD de casos de uso
│   ├── schemas.ts          # CRUD de schemas + generación IA
│   ├── dataSources.ts      # CRUD de fuentes de datos + validación
│   ├── bian.ts             # APIs BIAN y dominios
│   └── companies.ts        # Gestión de empresas
├── services/
│   ├── openaiService.ts    # Integración con OpenAI
│   └── bianService.ts      # Servicios BIAN
├── middleware/
│   ├── auth.ts             # Middleware de autenticación
│   └── errorHandler.ts     # Manejo centralizado de errores
└── config/
    ├── database.ts         # Configuración MongoDB
    ├── passport.ts         # Configuración OAuth
    └── swagger.ts          # Configuración Swagger
```

### APIs y Documentación
* **Versionado**: `/api/v1/...`
* **Documentación**: Swagger UI disponible en `/api-docs`
* **Estándares**: OpenAPI 3.0
* **Autenticación**: JWT Bearer tokens
* **Validación**: Esquemas de validación con express-validator

## 2. Seguridad y Autenticación

### Google OAuth 2.0
* **Registro e inicio de sesión exclusivo** vía cuenta de Google
* **Librería**: passport-google-oauth20
* **Flujo**: Authorization Code con PKCE
* **Almacenamiento**: JWT tokens con información del usuario
* **Sesiones**: Stateless con JWT

### Configuración de Seguridad
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

## 3. Base de Datos - MongoDB

### Arquitectura de Datos
**MongoDB Atlas** (plan gratuito) con las siguientes colecciones:

#### Colección: Companies
```javascript
{
  _id: ObjectId,
  name: String,
  domain: String,
  settings: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### Colección: Users
```javascript
{
  _id: ObjectId,
  googleId: String,
  email: String,
  name: String,
  picture: String,
  companyId: ObjectId,
  role: 'admin' | 'user',
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Colección: UseCases (Estructura Mejorada)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  originalText: String,
  
  // Estructura detallada del caso de uso
  objective: String,
  actors: {
    primary: [String],
    secondary: [String],
    systems: [String]
  },
  prerequisites: [String],
  mainFlow: [{
    step: Number,
    actor: String,
    action: String,
    description: String
  }],
  alternativeFlows: [{
    name: String,
    condition: String,
    steps: [Object]
  }],
  postconditions: [String],
  businessRules: [String],
  nonFunctionalRequirements: {
    performance: String,
    security: String,
    usability: String,
    availability: String
  },
  assumptions: [String],
  constraints: [String],
  priority: 'low' | 'medium' | 'high' | 'critical',
  complexity: 'low' | 'medium' | 'high',
  estimatedEffort: String,
  
  // Dominios y APIs BIAN
  selectedDomains: [String],
  selectedApis: [String],
  
  // Análisis de IA
  aiAnalysis: Object,
  
  // Metadatos
  status: 'draft' | 'in_progress' | 'completed',
  companyId: ObjectId,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Colección: Schemas (Nueva - Independiente)
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  schema: Object,
  companyId: ObjectId,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Colección: DataSources (Nueva - Independiente)
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  type: 'REST_API' | 'DATABASE' | 'FILE' | 'SOAP' | 'GRAPHQL',
  connectionConfig: {
    apiUrl: String,
    method: String,
    headers: Object,
    authentication: {
      type: 'none' | 'bearer' | 'basic' | 'api_key',
      token: String,
      username: String,
      password: String,
      apiKey: String
    }
  },
  companyId: ObjectId,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Índices Optimizados
```javascript
// Users
{ googleId: 1 }
{ email: 1 }
{ companyId: 1 }

// UseCases
{ companyId: 1, status: 1 }
{ createdBy: 1 }

// Schemas
{ companyId: 1, name: 1 }
{ createdBy: 1 }

// DataSources
{ companyId: 1, name: 1 }
{ type: 1 }
```

## 4. Integración con GenAI

### OpenAI GPT-3.5 Turbo
**Casos de uso de IA:**

1. **Análisis de Casos de Uso**
   - Interpretación de texto libre
   - Extracción de objetivos, actores, flujos
   - Sugerencia de estructura detallada

2. **Recomendación de Dominios BIAN**
   - Análisis semántico del caso de uso
   - Mapeo a dominios BIAN v13
   - Justificación de recomendaciones

3. **Sugerencia de APIs**
   - Propuesta de APIs por dominio
   - Análisis de cobertura funcional
   - Identificación de gaps

4. **Generación de Schemas**
   - Creación de schemas JSON personalizados
   - Basado en descripción y contexto de APIs
   - Validación de estructura

### Configuración OpenAI
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
```

## 5. Funcionalidades Principales

### 5.1. Autenticación y Onboarding
- **Login exclusivo con Google OAuth**
- **Creación automática de empresa** basada en dominio de email
- **Asignación de rol admin** al primer usuario de cada empresa
- **Validación de empresa activa** en cada login

### 5.2. Dashboard Principal
- **Estadísticas de casos de uso** (total, completados, en progreso)
- **Lista de casos de uso recientes** con filtros por estado
- **Acciones rápidas**: Crear nuevo CU, gestionar empresa
- **Navegación principal** con acceso a todas las funcionalidades

### 5.3. Gestión Independiente de Recursos

#### 📋 Schemas de Datos
**Página independiente** (`/schemas`) con:
- **CRUD completo** de schemas de datos
- **Generación con IA** basada en descripción
- **Editor JSON integrado** con validación
- **Reutilización** entre casos de uso
- **Versionado** y historial de cambios

#### 🔌 Sistemas de Origen
**Página independiente** (`/data-sources`) con:
- **CRUD completo** de fuentes de datos
- **Múltiples tipos**: REST API, Database, File, SOAP, GraphQL
- **Configuración de autenticación**: Bearer, Basic Auth, API Key
- **Validación de conexiones** en tiempo real
- **Editor de headers** y configuración avanzada

### 5.4. Creación de Casos de Uso (Flujo Simplificado)

#### Paso 1: Formulario Estructurado
**Reemplaza el texto libre** con campos específicos:
- **Información básica**: Título, descripción, objetivo
- **Actores**: Primarios, secundarios, sistemas
- **Flujos**: Prerrequisitos, flujo principal, postcondiciones
- **Reglas de negocio**: Restricciones, supuestos
- **Requisitos no funcionales**: Rendimiento, seguridad, usabilidad
- **Metadatos**: Prioridad, complejidad, esfuerzo estimado

#### Paso 2: Selección de Dominios BIAN
- **Análisis automático** del caso de uso estructurado
- **Recomendaciones de IA** con justificación
- **Selección múltiple** de dominios relevantes
- **Validación** de cobertura funcional

#### Paso 3: Selección de APIs
- **APIs organizadas por dominio** con secciones expandibles
- **Catálogo expandido** con más de 200 APIs BIAN
- **Métodos HTTP** con colores distintivos
- **Parámetros y endpoints** detallados
- **Sugerencias de IA** basadas en contexto

### 5.5. Vista Detallada de Casos de Uso
**Tabs simplificados**:
- **Overview**: Información completa del caso de uso
- **Dominios BIAN**: Dominios seleccionados con detalles
- **APIs**: APIs seleccionadas con documentación

### 5.6. Gestión de Empresa
- **Información de la empresa**: Nombre, configuraciones
- **Gestión de usuarios**: Roles, estados, permisos
- **Configuraciones**: Preferencias y ajustes

## 6. APIs del Backend

### 6.1. Autenticación (`/api/v1/auth`)
```
GET    /me                    # Obtener usuario actual
POST   /logout                # Cerrar sesión
POST   /refresh               # Renovar token
GET    /google                # Iniciar OAuth con Google
GET    /google/callback       # Callback OAuth
```

### 6.2. Casos de Uso (`/api/v1/use-cases`)
```
GET    /                      # Listar casos de uso
POST   /                      # Crear caso de uso
GET    /:id                   # Obtener caso de uso
PUT    /:id                   # Actualizar caso de uso
DELETE /:id                   # Eliminar caso de uso
POST   /:id/domains           # Seleccionar dominios
POST   /:id/apis              # Seleccionar APIs
POST   /analyze-ai            # Análizar con IA
POST   /ai-suggest-content    # Sugerir contenido con IA
POST   /ai-suggest-apis       # Sugerir APIs con IA
POST   /recommend-domains     # Recomendar dominios
```

### 6.3. Schemas (`/api/v1/schemas`)
```
GET    /                      # Listar schemas de la empresa
POST   /                      # Crear schema
GET    /:id                   # Obtener schema
PUT    /:id                   # Actualizar schema
DELETE /:id                   # Eliminar schema
POST   /generate              # Generar schema con IA
```

### 6.4. Fuentes de Datos (`/api/v1/data-sources`)
```
GET    /                      # Listar fuentes de datos
POST   /                      # Crear fuente de datos
GET    /:id                   # Obtener fuente de datos
PUT    /:id                   # Actualizar fuente de datos
DELETE /:id                   # Eliminar fuente de datos
POST   /validate-connection   # Validar conexión
```

### 6.5. BIAN (`/api/v1/bian`)
```
GET    /domains               # Listar dominios BIAN
GET    /domains/:name         # Obtener dominio específico
POST   /apis                  # Obtener APIs por dominios
GET    /apis/:name            # Detalles de API específica
POST   /validate-domains      # Validar dominios con IA
```

### 6.6. Empresas (`/api/v1/companies`)
```
GET    /current               # Obtener empresa actual
PUT    /current               # Actualizar empresa
GET    /current/users         # Listar usuarios de la empresa
PUT    /current/users/:id/role   # Actualizar rol de usuario
PUT    /current/users/:id/status # Actualizar estado de usuario
```

## 7. Configuración y Despliegue

### Variables de Entorno
```env
# Base de datos
MONGODB_URI=mongodb+srv://...

# Autenticación
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# URLs
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3001

# Entorno
NODE_ENV=development
PORT=3001
```

### Desarrollo Local
```bash
# Instalar dependencias
npm install

# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Ejecutar ambos simultáneamente (desde raíz)
npm run dev
```

### Scripts Disponibles
```json
{
  "dev": "concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\"",
  "build": "npm run build --prefix backend && npm run build --prefix frontend",
  "test:system": "bash test-system.sh",
  "test:system:verbose": "bash test-system.sh --verbose"
}
```

## 8. Mejoras y Evolución de la Arquitectura

### Cambios Principales Implementados

1. **Separación de Responsabilidades**
   - Schemas y fuentes de datos ahora son recursos independientes
   - Gestión CRUD completa desde el menú principal
   - Reutilización entre casos de uso

2. **Formulario Estructurado**
   - Reemplazó el texto libre por campos específicos
   - Mejor captura de información
   - Análisis de IA más preciso

3. **Flujo Simplificado**
   - Reducido de 5 a 3 pasos principales
   - Eliminación de pasos de schemas y fuentes de datos del flujo
   - Mejor experiencia de usuario

4. **APIs Mejoradas**
   - Organización por dominios
   - Catálogo expandido
   - Mejor visualización de métodos y parámetros

5. **Arquitectura Escalable**
   - Modelos independientes para schemas y fuentes de datos
   - APIs RESTful completas
   - Validación robusta

### Próximas Mejoras Sugeridas

1. **Integración Avanzada**
   - Selección de schemas y fuentes existentes en casos de uso
   - Referencias cruzadas entre recursos

2. **Importación/Exportación**
   - Importar schemas desde JSON/YAML
   - Exportar configuraciones completas

3. **Versionado**
   - Control de versiones para schemas
   - Historial de cambios en fuentes de datos

4. **Colaboración**
   - Comentarios en casos de uso
   - Aprobaciones y workflows

5. **Analytics**
   - Métricas de uso
   - Reportes de cobertura BIAN

## 9. Estándar BIAN v13

### Alineación Implementada
- **Dominios**: Catálogo completo de dominios BIAN v13
- **APIs**: Más de 200 APIs con documentación
- **Naming Conventions**: Seguimiento de estándares BIAN
- **Operaciones**: Mapeo de operaciones BIAN (Initiate, Update, Request, etc.)
- **Entidades**: Modelado según entidades BIAN estándar

### Cobertura Funcional
- **Customer Management**: APIs de gestión de clientes
- **Product Management**: APIs de productos bancarios
- **Transaction Processing**: APIs de procesamiento de transacciones
- **Risk Management**: APIs de gestión de riesgos
- **Compliance**: APIs de cumplimiento regulatorio
- **Analytics**: APIs de análisis y reportes

---

## Conclusión

La plataforma BIAN-CU ha evolucionado hacia una arquitectura más robusta y escalable, con separación clara de responsabilidades y mejor experiencia de usuario. La implementación actual proporciona una base sólida para el crecimiento futuro y la adopción empresarial.

**Versión**: 2.0  
**Última actualización**: Diciembre 2024  
**Estado**: Producción Ready