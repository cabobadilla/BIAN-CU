import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
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

        // Hacer petición directa con el token para obtener información del usuario
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await axios.get(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

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