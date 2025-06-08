# 🧪 BIAN-CU Platform - Guía de Pruebas del Sistema

Este documento describe cómo ejecutar las pruebas automatizadas del sistema BIAN-CU Platform.

## 📋 Requisitos Previos

Antes de ejecutar las pruebas, asegúrate de tener:

- ✅ Node.js instalado
- ✅ Dependencias instaladas (`npm install` en raíz, backend y frontend)
- ✅ Variables de entorno configuradas (`.env.local` en backend y frontend)
- ✅ Los servicios ejecutándose (`npm run dev`)

## 🚀 Ejecución Rápida

Para ejecutar todas las pruebas del sistema:

```bash
./test-system.sh
```

## 📊 Pruebas Incluidas

El script ejecuta las siguientes verificaciones:

### 🔍 Verificación de Procesos
- ✅ Procesos de Node.js ejecutándose
- ✅ Backend escuchando en puerto 3001
- ✅ Frontend escuchando en puerto 5173/5174

### 🌐 Pruebas de Endpoints del Backend
- ✅ **Health Check**: Verifica que el backend responda correctamente
- ✅ **Documentación API**: Confirma que Swagger esté disponible
- ✅ **Google OAuth**: Verifica redirección de autenticación
- ✅ **Seguridad**: Confirma que endpoints protegidos requieran autenticación

### 🎨 Pruebas del Frontend
- ✅ **Respuesta HTTP**: Verifica que el frontend responda
- ✅ **Contenido HTML**: Confirma que sirva contenido web

### ⚙️ Configuración del Sistema
- ✅ **MongoDB**: URI configurada en variables de entorno
- ✅ **Google OAuth**: Client ID y Secret configurados
- ✅ **OpenAI**: API Key configurada
- ✅ **JWT**: Secret configurado
- ✅ **Archivos**: Estructura de archivos críticos presente

## 📈 Interpretación de Resultados

### ✅ Todas las pruebas exitosas
```
🎉 ¡Todas las pruebas pasaron exitosamente!
✨ El sistema BIAN-CU Platform está funcionando correctamente
```

### ❌ Algunas pruebas fallaron
```
⚠️  Algunas pruebas fallaron
💡 Verifica que los servicios estén ejecutándose con 'npm run dev'
```

## 🛠️ Solución de Problemas

### Servicios no ejecutándose
Si el script reporta que no hay procesos ejecutándose:

```bash
# Desde la raíz del proyecto
npm run dev
```

### Puertos ocupados
Si hay conflictos de puertos:

```bash
# Verificar qué está usando los puertos
netstat -an | grep LISTEN | grep -E "3001|5173|5174"

# Matar procesos si es necesario
pkill -f "npm run dev"
pkill -f "nodemon"
```

### Variables de entorno faltantes
Si faltan configuraciones:

```bash
# Verificar archivos .env.local
ls -la backend/.env.local
ls -la frontend/.env.local

# Copiar desde ejemplos si no existen
cp backend/env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
```

## 🔧 Personalización del Script

El script `test-system.sh` puede ser modificado para agregar más pruebas:

```bash
# Agregar nueva prueba
run_test "Descripción de la prueba" \
    "comando_a_ejecutar"
```

## 📝 Logs y Debugging

Para ver más detalles durante la ejecución:

```bash
# Ejecutar con verbose
bash -x ./test-system.sh

# Ver logs del backend
cd backend && npm run dev

# Ver logs del frontend
cd frontend && npm run dev
```

## 🌐 URLs de Acceso

Una vez que todas las pruebas pasen:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Documentación API**: http://localhost:3001/api-docs/
- **Health Check**: http://localhost:3001/health

## 📞 Soporte

Si encuentras problemas con las pruebas:

1. Verifica que todos los servicios estén ejecutándose
2. Revisa los logs de backend y frontend
3. Confirma que las variables de entorno estén configuradas
4. Ejecuta `npm install` en todas las carpetas si hay errores de dependencias

---

**Nota**: Este script está diseñado para desarrollo local. Para pruebas en producción, se recomienda usar herramientas como Jest, Cypress o Playwright. 