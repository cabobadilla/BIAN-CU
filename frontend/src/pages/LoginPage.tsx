import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleLogin = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    window.location.href = `${API_BASE_URL}/api/v1/auth/google`;
  };

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'auth_failed':
        return 'Error en la autenticación con Google. Por favor, intenta de nuevo.';
      case 'no_user':
        return 'No se pudo obtener la información del usuario.';
      case 'no_token':
        return 'No se recibió el token de autenticación.';
      case 'callback_failed':
        return 'Error procesando la autenticación. Por favor, intenta de nuevo.';
      default:
        return 'Error desconocido. Por favor, intenta de nuevo.';
    }
  };

  useEffect(() => {
    // Limpiar cualquier estado de autenticación previo
    // (esto se podría hacer en el store si fuera necesario)
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* Logo y título */}
          <div className="flex justify-center">
            <div className="flex items-center">
              <FileText className="h-12 w-12 text-primary-600" />
              <span className="ml-3 text-3xl font-bold text-gray-900">
                BIAN-CU
              </span>
            </div>
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inicia sesión en tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Plataforma para gestión de casos de uso bancarios con estándar BIAN
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error de autenticación
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {getErrorMessage(error)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de login */}
        <div className="mt-8 space-y-6">
          <div className="card p-8">
            <div className="space-y-6">
              {/* Información sobre la autenticación */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Autenticación Segura
                </h3>
                <p className="text-sm text-gray-600">
                  Utilizamos Google OAuth para garantizar la seguridad de tu cuenta.
                  Solo necesitas tu cuenta de Google para acceder.
                </p>
              </div>

              {/* Botón de Google */}
              <div>
                <button
                  onClick={handleGoogleLogin}
                  className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </span>
                  Continuar con Google
                </button>
              </div>

              {/* Información adicional */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
                  Tu empresa será creada automáticamente basada en el dominio de tu email.
                </p>
              </div>
            </div>
          </div>

          {/* Características de la plataforma */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
              ¿Qué puedes hacer con BIAN-CU?
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Análisis con IA:</span> Utiliza ChatGPT para analizar casos de uso y extraer información estructurada
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Dominios BIAN:</span> Sugerencias automáticas de dominios del estándar BIAN v13
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">APIs Semánticas:</span> Generación de APIs con documentación Swagger/OpenAPI
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Gestión Multiempresa:</span> Colaboración segura dentro de tu organización
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 