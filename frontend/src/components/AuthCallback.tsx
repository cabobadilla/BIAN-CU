import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          console.error('Error de autenticación:', error);
          navigate('/login?error=' + error);
          return;
        }

        if (!token) {
          console.error('No se recibió token');
          navigate('/login?error=no_token');
          return;
        }

        // Guardar token temporalmente para hacer la petición
        const tempStore = useAuthStore.getState();
        tempStore.token = token;

        // Obtener información del usuario
        const response = await authService.getMe();
        const userData = response.data.data;

        // Configurar autenticación completa
        setAuth(userData, token);
        
        // Redirigir al dashboard
        navigate('/dashboard');

      } catch (error) {
        console.error('Error procesando callback:', error);
        navigate('/login?error=callback_failed');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Procesando autenticación
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Por favor espera mientras verificamos tu cuenta...
          </p>
        </div>
        <LoadingSpinner size="lg" text="Verificando credenciales..." />
      </div>
    </div>
  );
};

export default AuthCallback; 