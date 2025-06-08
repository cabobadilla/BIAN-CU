import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X, 
  Sparkles, 
  Building2, 
  Code, 
  Database, 
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings,
  MoreVertical
} from 'lucide-react';
import { useCaseService, bianService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import type { UseCase, BianDomain, BianApi } from '../types';

const UseCasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'apis'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Consultar caso de uso
  const { data: useCaseResponse, isLoading: useCaseLoading } = useQuery({
    queryKey: ['useCase', id],
    queryFn: () => useCaseService.getById(id!),
    enabled: !!id,
  });

  // Consultar dominios BIAN
  const { data: domainsResponse } = useQuery({
    queryKey: ['bianDomains'],
    queryFn: () => bianService.getDomains(),
  });

  const useCase: UseCase = useCaseResponse?.data?.data as UseCase;
  const domains: BianDomain[] = (domainsResponse?.data?.data as BianDomain[]) || [];

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDropdown && !target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Mutaciones
  const updateUseCaseMutation = useMutation({
    mutationFn: (data: Partial<UseCase>) => useCaseService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useCase', id] });
      setIsEditing(false);
    },
  });

  const selectDomainsMutation = useMutation({
    mutationFn: (domains: string[]) => useCaseService.selectDomains(id!, domains),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useCase', id] });
    },
  });

  const selectApisMutation = useMutation({
    mutationFn: (apis: string[]) => useCaseService.selectApis(id!, apis),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useCase', id] });
    },
  });

  const deleteUseCaseMutation = useMutation({
    mutationFn: () => {
      console.log('Ejecutando eliminación para ID:', id);
      return useCaseService.delete(id!);
    },
    onSuccess: () => {
      console.log('Caso de uso eliminado exitosamente');
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Error eliminando caso de uso:', error);
      alert('Error al eliminar el caso de uso. Por favor intenta de nuevo.');
    },
  });

  if (useCaseLoading) {
    return <LoadingSpinner />;
  }

  if (!useCase) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Caso de uso no encontrado</h2>
        <p className="text-gray-600 mb-4">El caso de uso que buscas no existe o no tienes permisos para verlo.</p>
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-700">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const handleEdit = () => {
    setEditForm({ title: useCase.title, description: useCase.description });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateUseCaseMutation.mutate(editForm);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({ title: '', description: '' });
  };

  const handleDelete = () => {
    console.log('handleDelete called');
    setShowDropdown(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    console.log('confirmDelete called');
    deleteUseCaseMutation.mutate();
  };

  const cancelDelete = () => {
    console.log('cancelDelete called');
    setShowDeleteConfirm(false);
  };

  const getStatusColor = (status: UseCase['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'analyzing':
      case 'analyzed':
        return 'bg-blue-100 text-blue-800';
      case 'domains_selected':
      case 'apis_selected':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: UseCase['status']) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'analyzing':
        return 'Analizando';
      case 'analyzed':
        return 'Analizado';
      case 'domains_selected':
        return 'Dominios Seleccionados';
      case 'apis_selected':
        return 'APIs Seleccionadas';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: FileText },
    { id: 'domains', label: 'Dominios BIAN', icon: Building2 },
    { id: 'apis', label: 'APIs', icon: Code },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 bg-transparent focus:outline-none"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="text-gray-600 border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">{useCase.title}</h1>
                <p className="text-gray-600 mt-1">{useCase.description}</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(useCase.status)}`}>
            {getStatusText(useCase.status)}
          </span>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={updateUseCaseMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Editar
              </button>
              <div className="relative dropdown-container">
                <button
                  onClick={() => {
                    console.log('Dropdown button clicked, current state:', showDropdown);
                    setShowDropdown(!showDropdown);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg flex items-center"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          console.log('Delete button clicked');
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar caso de uso
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'domains' | 'apis')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === 'overview' && <OverviewTab useCase={useCase} />}
        {activeTab === 'domains' && (
          <DomainsTab 
            useCase={useCase} 
            domains={domains} 
            onSelectDomains={(domains) => selectDomainsMutation.mutate(domains)}
            isLoading={selectDomainsMutation.isPending}
          />
        )}
        {activeTab === 'apis' && (
          <ApisTab 
            useCase={useCase}
            onSelectApis={(apis) => selectApisMutation.mutate(apis)}
            isLoading={selectApisMutation.isPending}
          />
        )}

      </div>

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar el caso de uso "{useCase.title}"? 
              Esta acción no se puede deshacer y se perderán todos los datos asociados.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteUseCaseMutation.isPending}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteUseCaseMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Overview Tab
const OverviewTab: React.FC<{ useCase: UseCase }> = ({ useCase }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Creado por</label>
              <p className="text-gray-900">{useCase.createdBy?.name || 'Usuario desconocido'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Fecha de creación</label>
              <p className="text-gray-900">{formatDate(useCase.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Última actualización</label>
              <p className="text-gray-900">{formatDate(useCase.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Dominios seleccionados</label>
              <p className="text-gray-900">{useCase.selectedDomains.length} dominios</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">APIs seleccionadas</label>
              <p className="text-gray-900">{useCase.selectedApis.length} APIs</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Estado</label>
              <p className="text-gray-900">{useCase.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Texto original */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Texto Original</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 whitespace-pre-wrap">{useCase.originalText}</p>
        </div>
      </div>

      {/* Análisis de IA */}
      {useCase.aiAnalysis && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Análisis con IA
          </h3>
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Resumen</h4>
              <p className="text-blue-800">{useCase.aiAnalysis.summary}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Entidades Clave</h4>
                <div className="flex flex-wrap gap-2">
                  {useCase.aiAnalysis.keyEntities.map((entity, index) => (
                    <span key={index} className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-sm">
                      {entity}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Procesos de Negocio</h4>
                <div className="flex flex-wrap gap-2">
                  {useCase.aiAnalysis.businessProcesses.map((process, index) => (
                    <span key={index} className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-sm">
                      {process}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Dominios Sugeridos</h4>
                <div className="space-y-1">
                  {useCase.aiAnalysis.suggestedDomains.map((domain, index) => (
                    <div key={index} className="text-blue-800 text-sm">• {domain}</div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Complejidad</h4>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  useCase.aiAnalysis.complexity === 'high' ? 'bg-red-200 text-red-800' :
                  useCase.aiAnalysis.complexity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-green-200 text-green-800'
                }`}>
                  {useCase.aiAnalysis.complexity === 'high' ? 'Alta' :
                   useCase.aiAnalysis.complexity === 'medium' ? 'Media' : 'Baja'}
                </span>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Confianza</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${useCase.aiAnalysis.confidence}%` }}
                    />
                  </div>
                  <span className="text-blue-800 text-sm font-medium">
                    {useCase.aiAnalysis.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Domains Tab
const DomainsTab: React.FC<{
  useCase: UseCase;
  domains: BianDomain[];
  onSelectDomains: (domains: string[]) => void;
  isLoading: boolean;
}> = ({ useCase, domains, onSelectDomains, isLoading }) => {
  const [selectedDomains, setSelectedDomains] = useState<string[]>(useCase.selectedDomains);

  const handleDomainToggle = (domainName: string) => {
    setSelectedDomains(prev => 
      prev.includes(domainName)
        ? prev.filter(d => d !== domainName)
        : [...prev, domainName]
    );
  };

  const handleSave = () => {
    onSelectDomains(selectedDomains);
  };

  const hasChanges = JSON.stringify(selectedDomains.sort()) !== JSON.stringify(useCase.selectedDomains.sort());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Dominios BIAN</h3>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isLoading ? <LoadingSpinner /> : <Save className="h-4 w-4" />}
            Guardar Selección
          </button>
        )}
      </div>

      {useCase.aiAnalysis?.suggestedDomains && useCase.aiAnalysis.suggestedDomains.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Dominios Sugeridos por IA
          </h4>
          <div className="flex flex-wrap gap-2">
            {useCase.aiAnalysis.suggestedDomains.map((domain, index) => (
              <button
                key={index}
                onClick={() => handleDomainToggle(domain)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedDomains.includes(domain)
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map((domain) => (
          <div
            key={domain.name}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedDomains.includes(domain.name)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleDomainToggle(domain.name)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{domain.name}</h4>
              {selectedDomains.includes(domain.name) && (
                <CheckCircle className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{domain.description}</p>
            <div className="text-xs text-gray-500">
              <span className="font-medium">Área:</span> {domain.businessArea}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente APIs Tab
const ApisTab: React.FC<{
  useCase: UseCase;
  onSelectApis: (apis: string[]) => void;
  isLoading: boolean;
}> = ({ useCase, onSelectApis, isLoading }) => {
  const [selectedApis, setSelectedApis] = useState<string[]>(useCase.selectedApis);
  
  // Consultar APIs para los dominios seleccionados
  const { data: apisResponse, isLoading: apisLoading } = useQuery({
    queryKey: ['bianApis', useCase.selectedDomains],
    queryFn: () => bianService.getApisForDomains(useCase.selectedDomains, useCase.originalText),
    enabled: useCase.selectedDomains.length > 0,
  });

  const apis: BianApi[] = (apisResponse?.data?.data as { suggestedApis: BianApi[] })?.suggestedApis || [];

  const handleApiToggle = (apiName: string) => {
    setSelectedApis(prev => 
      prev.includes(apiName)
        ? prev.filter(a => a !== apiName)
        : [...prev, apiName]
    );
  };

  const handleSave = () => {
    onSelectApis(selectedApis);
  };

  const hasChanges = JSON.stringify(selectedApis.sort()) !== JSON.stringify(useCase.selectedApis.sort());

  if (useCase.selectedDomains.length === 0) {
    return (
      <div className="text-center py-8">
        <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona dominios primero</h3>
        <p className="text-gray-600">Para ver las APIs disponibles, primero debes seleccionar al menos un dominio BIAN.</p>
      </div>
    );
  }

  if (apisLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">APIs BIAN</h3>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isLoading ? <LoadingSpinner /> : <Save className="h-4 w-4" />}
            Guardar Selección
          </button>
        )}
      </div>

      <div className="space-y-4">
        {apis.map((api) => (
          <div
            key={api.name}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedApis.includes(api.name)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleApiToggle(api.name)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{api.name}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {api.operationType}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    api.method === 'GET' ? 'bg-green-100 text-green-800' :
                    api.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    api.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    api.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {api.method}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{api.description}</p>
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-medium">Dominio:</span> {api.domain} | 
                  <span className="font-medium"> Endpoint:</span> <code className="bg-gray-100 px-1 rounded">{api.endpoint}</code>
                </div>
                
                {/* Mostrar métodos disponibles si hay más de uno */}
                {api.availableMethods && api.availableMethods.length > 1 && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Métodos disponibles:</span>
                    <div className="flex gap-1 mt-1">
                      {api.availableMethods.map((method, idx) => (
                        <span key={idx} className={`px-2 py-1 rounded text-xs ${
                          method === 'GET' ? 'bg-green-100 text-green-700' :
                          method === 'POST' ? 'bg-blue-100 text-blue-700' :
                          method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                          method === 'DELETE' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Mostrar parámetros si están disponibles */}
                {api.parameters && api.parameters.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">Parámetros:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {api.parameters.slice(0, 3).map((param, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {param.name} ({param.type})
                        </span>
                      ))}
                      {api.parameters.length > 3 && (
                        <span className="text-gray-500">+{api.parameters.length - 3} más</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedApis.includes(api.name) && (
                <CheckCircle className="h-5 w-5 text-blue-600 ml-2" />
              )}
            </div>
          </div>
        ))}
      </div>

      {apis.length === 0 && (
        <div className="text-center py-8">
          <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay APIs disponibles</h3>
          <p className="text-gray-600">No se encontraron APIs para los dominios seleccionados.</p>
        </div>
      )}
    </div>
  );
};



export default UseCasePage; 