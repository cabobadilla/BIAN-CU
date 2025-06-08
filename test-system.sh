#!/bin/bash

# Script de pruebas del sistema BIAN-CU Platform
# Verifica que backend y frontend estén funcionando correctamente

echo "🧪 BIAN-CU Platform - Script de Pruebas del Sistema"
echo "=================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar resultados
show_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Función para mostrar información
show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Función para mostrar advertencias
show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Contador de pruebas
TOTAL_TESTS=0
PASSED_TESTS=0

# Función para ejecutar prueba
run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
    show_info "Ejecutando: $1"
    
    if eval "$2"; then
        show_result 0 "$1"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        show_result 1 "$1"
        return 1
    fi
}

echo "🔍 Verificando procesos en ejecución..."
echo ""

# Verificar si los procesos están ejecutándose
show_info "Verificando procesos de Node.js..."
NODE_PROCESSES=$(ps aux | grep -E "(npm|node|nodemon)" | grep -v grep | grep -v Cursor | wc -l)
if [ $NODE_PROCESSES -gt 0 ]; then
    show_result 0 "Procesos de Node.js encontrados ($NODE_PROCESSES procesos)"
else
    show_warning "No se encontraron procesos de Node.js ejecutándose"
    echo "💡 Ejecuta 'npm run dev' para iniciar los servicios"
fi

# Verificar puertos en uso
show_info "Verificando puertos..."
BACKEND_PORT=$(netstat -an | grep LISTEN | grep 3001 | wc -l)
FRONTEND_PORT=$(netstat -an | grep LISTEN | grep -E "5173|5174" | wc -l)

if [ $BACKEND_PORT -gt 0 ]; then
    show_result 0 "Backend escuchando en puerto 3001"
else
    show_warning "Backend no está escuchando en puerto 3001"
fi

if [ $FRONTEND_PORT -gt 0 ]; then
    FRONTEND_ACTUAL_PORT=$(netstat -an | grep LISTEN | grep -E "5173|5174" | head -1 | grep -o -E "5173|5174")
    show_result 0 "Frontend escuchando en puerto $FRONTEND_ACTUAL_PORT"
else
    show_warning "Frontend no está escuchando en puertos 5173 o 5174"
fi

echo ""
echo "🧪 Ejecutando pruebas de endpoints..."

# Pruebas del Backend
run_test "Health Check del Backend" \
    "curl -s http://localhost:3001/health | jq -e '.status == \"OK\"' > /dev/null 2>&1"

run_test "Documentación API (Swagger) disponible" \
    "curl -s -I http://localhost:3001/api-docs/ | grep -q 'HTTP/1.1 200 OK'"

run_test "Endpoint de autenticación Google OAuth" \
    "curl -s -I http://localhost:3001/api/v1/auth/google | grep -q 'HTTP/1.1 302 Found'"

run_test "Endpoints protegidos requieren autenticación" \
    "curl -s http://localhost:3001/api/v1/bian/domains | grep -q 'Unauthorized'"

# Pruebas del Frontend
if [ $FRONTEND_PORT -gt 0 ]; then
    FRONTEND_URL="http://localhost:$FRONTEND_ACTUAL_PORT"
    run_test "Frontend responde correctamente" \
        "curl -s -I $FRONTEND_URL | grep -q 'HTTP/1.1 200 OK'"
    
    run_test "Frontend sirve contenido HTML" \
        "curl -s -I $FRONTEND_URL | grep -q 'Content-Type: text/html'"
else
    show_warning "Saltando pruebas del frontend - no está ejecutándose"
fi

# Pruebas adicionales de conectividad
run_test "MongoDB URI configurada en variables de entorno" \
    "grep -q 'MONGODB_URI=' backend/.env.local"

run_test "Google OAuth configurado en variables de entorno" \
    "grep -q 'GOOGLE_CLIENT_ID=' backend/.env.local && grep -q 'GOOGLE_CLIENT_SECRET=' backend/.env.local"

run_test "OpenAI API Key configurada" \
    "grep -q 'OPENAI_API_KEY=' backend/.env.local"

run_test "JWT Secret configurado" \
    "grep -q 'JWT_SECRET=' backend/.env.local"

# Verificar estructura de archivos críticos
run_test "Archivos de configuración del backend existen" \
    "[ -f backend/package.json ] && [ -f backend/src/index.ts ] && [ -f backend/.env.local ]"

run_test "Archivos de configuración del frontend existen" \
    "[ -f frontend/package.json ] && [ -f frontend/src/main.tsx ] && [ -f frontend/.env.local ]"

# Resumen final
echo ""
echo "📊 RESUMEN DE PRUEBAS"
echo "===================="
echo -e "Total de pruebas: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Pruebas exitosas: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Pruebas fallidas: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo ""
    echo -e "${GREEN}🎉 ¡Todas las pruebas pasaron exitosamente!${NC}"
    echo -e "${GREEN}✨ El sistema BIAN-CU Platform está funcionando correctamente${NC}"
    echo ""
    echo "🌐 URLs de acceso:"
    echo "   • Frontend: http://localhost:${FRONTEND_ACTUAL_PORT:-5173}"
    echo "   • Backend API: http://localhost:3001"
    echo "   • Documentación API: http://localhost:3001/api-docs/"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Algunas pruebas fallaron${NC}"
    echo -e "${YELLOW}💡 Verifica que los servicios estén ejecutándose con 'npm run dev'${NC}"
    exit 1
fi 