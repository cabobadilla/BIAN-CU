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
        // Logging detallado para debugging
        console.log('=== AUTH CALLBACK DEBUG ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Current URL:', window.location.href);
        console.log('Search params:', {
          token: searchParams.get('token') ? 'PRESENT' : 'MISSING',
          error: searchParams.get('error'),
          all_params: Object.fromEntries(searchParams.entries())
        });
        console.log('Referrer:', document.referrer);
        
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          console.log('ERROR in callback:', error);
          setStatus('error');
          setMessage(getErrorMessage(error));
          console.log('Redirecting to login with error:', error);
          setTimeout(() => {
            navigate('/login?error=' + error);
          }, 3000);
          return;
        }

        if (!token) {
          console.log('NO TOKEN received in callback');
          setStatus('error');
          setMessage('No se recibió el token de autenticación');
          setTimeout(() => {
            navigate('/login?error=no_token');
          }, 3000);
          return;
        }

        console.log('TOKEN received, verifying with backend...');
        
        // Verificar el token con el backend usando la URL completa
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bian-cu-backend.onrender.com';
        console.log('API_BASE_URL:', API_BASE_URL);
        
        const verifyUrl = `${API_BASE_URL}/api/v1/auth/me`;
        console.log('Verifying token at:', verifyUrl);
        
        const response = await fetch(verifyUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Verification response status:', response.status);
        console.log('Verification response ok:', response.ok);

        if (response.ok) {
          const result = await response.json();
          const userData = result.data;
          console.log('Usuario autenticado:', userData);
          
          // Configurar autenticación en el store
          setAuth(userData, token);
          
          setStatus('success');
          setMessage('¡Autenticación exitosa! Redirigiendo...');
          
          console.log('Auth successful, redirecting to dashboard...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          const errorText = await response.text();
          console.log('Token verification failed:', errorText);
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