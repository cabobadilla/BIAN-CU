import React, { useState } from 'react';
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
  Settings
} from 'lucide-react';
import { useCaseService, bianService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import type { UseCase, BianDomain, BianApi } from '../types';

const UseCasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'apis' | 'schemas' | 'datasources'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

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
    { id: 'schemas', label: 'Schemas', icon: Settings },
    { id: 'datasources', label: 'Fuentes de Datos', icon: Database },
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
            <button
              onClick={handleEdit}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Editar
            </button>
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
                onClick={() => setActiveTab(tab.id as 'overview' | 'domains' | 'apis' | 'schemas' | 'datasources')}
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
        {activeTab === 'schemas' && <SchemasTab useCase={useCase} />}
        {activeTab === 'datasources' && <DataSourcesTab useCase={useCase} />}
      </div>
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
              <p className="text-gray-900">{useCase.createdBy.name}</p>
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
              <label className="text-sm font-medium text-gray-600">Schemas personalizados</label>
              <p className="text-gray-900">{useCase.customSchemas.length} schemas</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Fuentes de datos</label>
              <p className="text-gray-900">{useCase.dataSources.length} fuentes</p>
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
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {api.method}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{api.description}</p>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Dominio:</span> {api.domain} | 
                  <span className="font-medium"> Endpoint:</span> {api.endpoint}
                </div>
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

// Componente Schemas Tab
const SchemasTab: React.FC<{ useCase: UseCase }> = ({ useCase }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Schemas Personalizados</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Schema
        </button>
      </div>

      {useCase.customSchemas.length === 0 ? (
        <div className="text-center py-8">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay schemas personalizados</h3>
          <p className="text-gray-600 mb-4">Crea schemas personalizados para complementar las APIs BIAN.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Crear primer schema
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {useCase.customSchemas.map((schema, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{schema.name}</h4>
                  <p className="text-sm text-gray-600">{schema.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    schema.generatedBy === 'ai' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {schema.generatedBy === 'ai' ? 'Generado por IA' : 'Manual'}
                  </span>
                  <button className="text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre className="text-gray-700 overflow-x-auto">
                  {JSON.stringify(schema.schema, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente DataSources Tab
const DataSourcesTab: React.FC<{ useCase: UseCase }> = ({ useCase }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Fuentes de Datos</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Fuente
        </button>
      </div>

      {useCase.dataSources.length === 0 ? (
        <div className="text-center py-8">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay fuentes de datos</h3>
          <p className="text-gray-600 mb-4">Conecta fuentes de datos externas para enriquecer tu caso de uso.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Agregar primera fuente
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {useCase.dataSources.map((dataSource, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{dataSource.name}</h4>
                  <p className="text-sm text-gray-600">Tipo: {dataSource.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                    dataSource.isValidated 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dataSource.isValidated ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {dataSource.isValidated ? 'Validado' : 'No validado'}
                  </span>
                  <button className="text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {dataSource.connection.apiUrl && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">URL:</span> {dataSource.connection.apiUrl}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UseCasePage; 