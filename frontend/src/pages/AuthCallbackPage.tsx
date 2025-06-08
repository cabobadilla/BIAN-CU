import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(getErrorMessage(error));
          setTimeout(() => {
            navigate('/login?error=' + error);
          }, 3000);
          return;
        }

        if (!token) {
          setStatus('error');
          setMessage('No se recibió el token de autenticación');
          setTimeout(() => {
            navigate('/login?error=no_token');
          }, 3000);
          return;
        }

        // Verificar el token con el backend usando la URL completa
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const userData = result.data;
          console.log('Usuario autenticado:', userData);
          
          // Configurar autenticación en el store
          setAuth(userData, token);
          
          setStatus('success');
          setMessage('¡Autenticación exitosa! Redirigiendo...');
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          throw new Error('Token inválido');
        }

      } catch (error) {
        console.error('Error en callback de autenticación:', error);
        setStatus('error');
        setMessage('Error al procesar la autenticación');
        setTimeout(() => {
          navigate('/login?error=callback_failed');
        }, 3000);
      }
    };

    processAuth();
  }, [searchParams, navigate, setAuth]);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth_failed':
        return 'Error en la autenticación con Google';
      case 'no_user':
        return 'No se pudo obtener la información del usuario';
      case 'no_token':
        return 'No se recibió el token de autenticación';
      default:
        return 'Error desconocido en la autenticación';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Procesando autenticación...'}
            {status === 'success' && '¡Autenticación exitosa!'}
            {status === 'error' && 'Error de autenticación'}
          </h2>
          
          <p className="text-gray-600">
            {message}
          </p>
          
          {status === 'loading' && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage; 