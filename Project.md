Especificación Técnica Detallada para Desarrollo de Aplicación
1. Arquitectura de la Aplicación
* Frontend
    * Framework: React
    * Despliegue: Aplicación estática en Render.com
    * Generación: Build con Vite o Create React App (preferiblemente Vite por performance)
    * Buenas prácticas:
        * Componentes modulares reutilizables
        * Tipado con TypeScript
        * Uso de react-router para navegación
        * Manejo de estado con Zustand o Redux Toolkit según complejidad
* Backend
    * Runtime: Node.js
    * Framework sugerido: Express.js
    * Despliegue: Aplicación como “Web Service” en Render.com
    * Buenas prácticas:
        * Organización en módulos (routes, controllers, services)
        * Middleware para autenticación y validación
        * Configuración de variables sensibles con .env
        * Documentación de endpoints con Swagger / OpenAPI
* APIs
    * Estandarización mediante Swagger/OpenAPI
    * Explorador interactivo vía Swagger UI
    * Versionado de rutas /api/v1/...
* Referencias
    * Alineación con estándar BIAN v13 (estructura de dominios, naming conventions, entidades, APIs)
* Despliegue Local
    * Soporte para .env.local
    * Logs estructurados en consola y archivo (winston, pino)
    * Setup local: node , mongoDB
    * Instrucciones de desarrollo incluidas en un README.md con:
        * npm run dev para frontend/backend
        * npm run lint, test, format

2. Seguridad
* Autenticación con Google OAuth 2.0
    * Registro e inicio de sesión exclusivamente vía cuenta de Google
    * Uso de librerías como passport-google-oauth20 o next-auth si se usa Next.js
    * Almacenamiento seguro del token y perfil del usuario en MongoDB

3. Base de Datos
* MongoDB como base de datos principal
    * Servicio: MongoDB Atlas (plan gratuito)
    * Diseño de esquema:
        * Colecciones separadas para:
            * Empresas
            * Usuarios
            * Casos de uso (CU)
            * APIs semánticas
            * Schemas personalizados
            * Fuentes de datos
    * Buenas prácticas:
        * Índices en campos clave (como correo, ID de empresa)
        * Validaciones con mongoose o zod

4. GenAI
* Utilizar exclusivamente ChatGPT-3.5 (API oficial de OpenAI)
    * Uso para:
        * Interpretación del texto del caso de uso
        * Recomendación de dominios BIAN
        * Propuesta de APIs semánticas
        * Generación de schemas de datos personalizados

5. Objetivo General
Desarrollar una plataforma SaaS multiempresa que permita:
* Administradores crear registros de empresas
* Usuarios (vinculados a empresas) definir y gestionar casos de uso bancarios
* Utilizar GenAI para sugerir:
    * Objetivos del negocio
    * Actores
    * Eventos y flujos
    * Dominios BIAN relacionados
    * APIs semánticas con detalles y limitaciones
    * Schemas adicionales y fuentes de datos

6. Funcionalidades Detalladas
6.1. Pantalla de Login
* Login y registro con Google
* Validación de empresa activa al loguearse
* Despliegue de errores y redirección segura
6.2. Dashboard Inicial
* Bienvenida e instrucciones generales
* Listado de Casos de Uso (CU) existentes
* Acciones:
    * Crear nuevo CU
    * Editar CU existente
    * Ver perfil y datos de la empresa
    * Logout
6.3. Creación de Casos de Uso
* Paso 1: Ingreso libre de texto
    * Analizado por ChatGPT
    * Extracción o sugerencia de:
        * Objetivos del negocio
        * Actores
        * Eventos y flujos
    * Validación/edición por parte del usuario
* Paso 2: Sugerencia de dominios BIAN
    * Análisis automatizado vía ChatGPT
    * Usuario selecciona 1 o más dominios sugeridos
* Paso 3: Sugerencia de APIs semánticas
    * Desplegar APIs que cubren el CU
    * Señalar lo que queda fuera del alcance
    * Documentación asociada en el CU
* Paso 4: Despliegue de Payloads
    * Visualización de endpoints y métodos de las APIs
    * Uso de Swagger/OpenAPI con enlaces al yaml:api: CustomerAlert
    * source: local-file/CustomerAlert.yaml
    * endpoints:
    *   /customer-alerts/initiate:
    *     method: POST
    *     operation: Initiate
    * 
6.4. Personalización de Payloads
* Editor para crear schemas adicionales
* Asistencia de ChatGPT para generar y editar
* Guardado y vinculación a APIs seleccionadas
* Mantenedor separado para schemas reusables
6.5. Origen de Datos
* Asociación de APIs semánticas con sistemas fuente
    * Campos requeridos:
        * Nombre del sistema (ej: "ODS")
        * API de origen (URL)
        * Método HTTP
        * Payload (con validador JSON)
    * Múltiples orígenes permitidos por API

🔒 Parámetros de Configuración
* Variables gestionadas en entorno:
    * GOOGLE_CLIENT_ID
    * GOOGLE_CLIENT_SECRET
    * MONGODB_URI
    * OPENAI_API_KEY
* Separación de prod y local vía archivos .env