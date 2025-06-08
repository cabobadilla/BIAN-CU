import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useCaseService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { UseCase } from '../types';

const DashboardPage = () => {
  const { user } = useAuthStore();

  // Obtener casos de uso reales del backend
  const { data: useCasesResponse, isLoading: loading } = useQuery({
    queryKey: ['useCases'],
    queryFn: () => useCaseService.getAll(),
  });

  const useCases: UseCase[] = (useCasesResponse?.data?.data as UseCase[]) || [];

  const getStatusIcon = (status: UseCase['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'analyzing':
      case 'analyzed':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'domains_selected':
      case 'apis_selected':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'draft':
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: UseCase['status']) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'analyzing':
        return 'Analizando';
      case 'analyzed':
        return 'Analizado';
      case 'domains_selected':
        return 'Dominios Seleccionados';
      case 'apis_selected':
        return 'APIs Seleccionadas';
      case 'draft':
        return 'Borrador';
      default:
        return 'Desconocido';
    }
  };

  const getStatusColor = (status: UseCase['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'analyzing':
      case 'analyzed':
        return 'bg-yellow-100 text-yellow-800';
      case 'domains_selected':
      case 'apis_selected':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    {
      name: 'Total de Casos de Uso',
      value: useCases.length,
      icon: DocumentTextIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Completados',
      value: useCases.filter(uc => uc.status === 'completed').length,
      icon: CheckCircleIcon,
      color: 'bg-green-500'
    },
    {
      name: 'En Análisis',
      value: useCases.filter(uc => ['analyzing', 'analyzed'].includes(uc.status)).length,
      icon: ClockIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Borradores',
      value: useCases.filter(uc => uc.status === 'draft').length,
      icon: DocumentTextIcon,
      color: 'bg-gray-500'
    }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Bienvenido de vuelta, {user?.name || 'Usuario'}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/use-cases/new"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Nuevo Caso de Uso
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de casos de uso recientes */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Casos de Uso Recientes
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tus casos de uso más recientes y su estado actual
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {useCases.length === 0 ? (
            <li className="px-4 py-4 text-center text-gray-500">
              No tienes casos de uso aún.{' '}
              <Link to="/use-cases/new" className="text-blue-600 hover:text-blue-500">
                Crea tu primer caso de uso
              </Link>
            </li>
          ) : (
            useCases.map((useCase) => (
              <li key={useCase._id}>
                <Link
                  to={`/use-cases/${useCase._id}`}
                  className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(useCase.status)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {useCase.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {useCase.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(useCase.status)}`}>
                        {getStatusText(useCase.status)}
                      </span>
                      <div className="text-sm text-gray-500">
                        {new Date(useCase.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Acciones Rápidas
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/use-cases/new"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <PlusIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Crear Caso de Uso
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Inicia un nuevo caso de uso bancario con análisis IA
                </p>
              </div>
            </Link>

            <Link
              to="/company"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <ChartBarIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Gestión de Empresa
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Configura tu empresa y gestiona usuarios
                </p>
              </div>
            </Link>

            <div className="relative group bg-white p-6 rounded-lg border border-gray-300 opacity-50">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-400 ring-4 ring-white">
                  <DocumentTextIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-400">
                  Reportes y Analytics
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Próximamente: Análisis detallado de casos de uso
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 