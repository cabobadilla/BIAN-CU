import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';

// Componentes de páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UseCasePage from './pages/UseCasePage';
import CreateUseCasePage from './pages/CreateUseCasePage';
import SelectDomainsPage from './pages/SelectDomainsPage';
import SelectApisPage from './pages/SelectApisPage';
import SchemasPage from './pages/SchemasPage';
import DataSourcesPage from './pages/DataSourcesPage';
import CompanyPage from './pages/CompanyPage';
import AuthCallback from './pages/AuthCallbackPage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Crear cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para rutas públicas (solo accesibles si no está autenticado)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // Simular verificación inicial de autenticación
    const checkAuth = async () => {
      setLoading(true);
      // Aquí podrías verificar el token almacenado
      // Por ahora solo simulamos un delay
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    checkAuth();
  }, [setLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Rutas públicas */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="use-cases/new" element={<CreateUseCasePage />} />
              <Route path="use-cases/:id/select-domains" element={<SelectDomainsPage />} />
              <Route path="use-cases/:id/select-apis" element={<SelectApisPage />} />
              <Route path="use-cases/:id" element={<UseCasePage />} />
              <Route path="schemas" element={<SchemasPage />} />
              <Route path="data-sources" element={<DataSourcesPage />} />
              <Route path="company" element={<CompanyPage />} />
            </Route>

            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
