#!/bin/bash

# Script de verificación del build para producción
echo "🔍 Verificando configuración del build..."

# Verificar estructura del proyecto
echo "📁 Verificando estructura del proyecto..."
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Faltan directorios backend o frontend"
    exit 1
fi

# Verificar package.json files
echo "📦 Verificando archivos package.json..."
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Faltan archivos package.json"
    exit 1
fi

# Verificar render.yaml
echo "🔧 Verificando render.yaml..."
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: Falta archivo render.yaml"
    exit 1
fi

# Test Backend Build
echo "🏗️ Verificando build del backend..."
cd backend
if ! npm run build > /dev/null 2>&1; then
    echo "❌ Error: Build del backend falló"
    exit 1
fi

if [ ! -d "dist" ]; then
    echo "❌ Error: Directorio dist del backend no fue creado"
    exit 1
fi

echo "✅ Build del backend exitoso"
cd ..

# Test Frontend Build
echo "🏗️ Verificando build del frontend..."
cd frontend
if ! npm run build > /dev/null 2>&1; then
    echo "❌ Error: Build del frontend falló"
    exit 1
fi

if [ ! -d "dist" ]; then
    echo "❌ Error: Directorio dist del frontend no fue creado"
    exit 1
fi

echo "✅ Build del frontend exitoso"
cd ..

# Verificar archivos críticos
echo "📄 Verificando archivos críticos..."
CRITICAL_FILES=(
    "backend/src/index.ts"
    "frontend/src/main.tsx"
    "backend/tsconfig.json"
    "frontend/vite.config.ts"
    "render.yaml"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Archivo crítico faltante: $file"
        exit 1
    fi
done

echo "✅ Todos los archivos críticos presentes"

# Limpiar builds de prueba
echo "🧹 Limpiando builds de prueba..."
rm -rf backend/dist
rm -rf frontend/dist

echo ""
echo "🎉 ¡Verificación completada exitosamente!"
echo "📋 El proyecto está listo para despliegue en Render.com"
echo ""
echo "📝 Próximos pasos:"
echo "1. Configurar variables de entorno en Render"
echo "2. Conectar repositorio GitHub"
echo "3. Desplegar usando render.yaml o configuración manual" 