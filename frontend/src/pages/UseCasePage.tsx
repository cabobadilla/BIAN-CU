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
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  MoreVertical,
  BookOpen
} from 'lucide-react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import '../styles/swagger-custom.css';
import { useCaseService, bianService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import type { UseCase, BianDomain, BianApi } from '../types';

const UseCasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'apis' | 'documentation'>('overview');
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
    mutationFn: async () => {
      console.log('Ejecutando eliminación para ID:', id);
      console.log('URL que se va a llamar:', `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/use-cases/${id}`);
      
      try {
        const response = await useCaseService.delete(id!);
        console.log('Respuesta del servidor:', response);
        return response;
      } catch (error: any) {
        console.error('Error detallado en la eliminación:', {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
          config: error.config
        });
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log('Caso de uso eliminado exitosamente:', response);
      alert('Caso de uso eliminado exitosamente');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Error eliminando caso de uso:', error);
      
      let errorMessage = 'Error al eliminar el caso de uso. ';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage += 'Problema de conexión con el servidor. Verifica que el backend esté ejecutándose.';
      } else if (error.response?.status === 401) {
        errorMessage += 'No tienes autorización para realizar esta acción.';
      } else if (error.response?.status === 404) {
        errorMessage += 'El caso de uso no fue encontrado.';
      } else if (error.response?.status >= 500) {
        errorMessage += 'Error interno del servidor.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      alert(errorMessage);
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
    { id: 'apis', label: 'APIs Semánticas Escogidas', icon: Code },
    { id: 'documentation', label: 'Documentación de APIs', icon: BookOpen },
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
                onClick={() => setActiveTab(tab.id as 'overview' | 'domains' | 'apis' | 'documentation')}
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
            queryClient={queryClient}
          />
        )}
        {activeTab === 'apis' && (
          <ApisTab 
            useCase={useCase}
            onSelectApis={(apis) => selectApisMutation.mutate(apis)}
            isLoading={selectApisMutation.isPending}
          />
        )}
        {activeTab === 'documentation' && (
          <DocumentationTab useCase={useCase} />
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
  const [isAnalyzingWithAI, setIsAnalyzingWithAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [isGettingContentSuggestions, setIsGettingContentSuggestions] = useState(false);
  const [contentSuggestions, setContentSuggestions] = useState<any>(null);
  const [showContentSuggestions, setShowContentSuggestions] = useState(false);

  // Función para analizar con IA
  const handleAnalyzeWithAI = async () => {
    setIsAnalyzingWithAI(true);
    try {
      const useCaseData = {
        title: useCase.title,
        description: useCase.description,
        objective: useCase.objective || '',
        actors: {
          primary: useCase.actors?.primary || [],
          secondary: useCase.actors?.secondary || [],
          systems: useCase.actors?.systems || []
        },
        prerequisites: useCase.prerequisites || [],
        mainFlow: useCase.mainFlow || [],
        postconditions: useCase.postconditions || [],
        businessRules: useCase.businessRules || []
      };

      const response = await useCaseService.analyzeWithAI(useCaseData);
      setAiAnalysis((response.data as any).data);
      setShowAiAnalysis(true);
    } catch (error) {
      console.error('Error analizando con IA:', error);
      alert('Error al analizar el caso de uso con IA. Por favor intenta de nuevo.');
    } finally {
      setIsAnalyzingWithAI(false);
    }
  };

  // Función para obtener sugerencias de contenido
  const handleGetContentSuggestions = async () => {
    setIsGettingContentSuggestions(true);
    try {
      const response = await useCaseService.aiSuggestContent({
        title: useCase.title,
        description: useCase.description,
        objective: useCase.objective
      });
      
      setContentSuggestions((response.data as any).data);
      setShowContentSuggestions(true);
    } catch (error) {
      console.error('Error obteniendo sugerencias de contenido:', error);
      alert('Error al obtener sugerencias de contenido. Por favor intenta de nuevo.');
    } finally {
      setIsGettingContentSuggestions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botones de IA */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Resumen del Caso de Uso</h3>
        <div className="flex gap-2">
          <button
            onClick={handleGetContentSuggestions}
            disabled={isGettingContentSuggestions}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isGettingContentSuggestions ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Mejorando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Mejorar Contenido
              </>
            )}
          </button>
          {/* AI功能 - Funcionalidades IA disponibles en edición */}
          <button
            onClick={handleAnalyzeWithAI}
            disabled={isAnalyzingWithAI}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isAnalyzingWithAI ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analizar con IA
              </>
            )}
          </button>
        </div>
      </div>

      {/* Panel de sugerencias de contenido */}
      {showContentSuggestions && contentSuggestions && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h4 className="text-lg font-medium text-purple-900">Sugerencias de Mejora</h4>
            </div>
            <button
              onClick={() => setShowContentSuggestions(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {contentSuggestions.suggestedTitle && (
              <div className="bg-white p-4 rounded border border-purple-200">
                <h5 className="font-medium text-purple-900 mb-2">Título Sugerido</h5>
                <p className="text-sm text-gray-600 mb-2">Actual: {useCase.title}</p>
                <p className="text-sm text-purple-800 font-medium">Sugerido: {contentSuggestions.suggestedTitle}</p>
              </div>
            )}

            {contentSuggestions.suggestedDescription && (
              <div className="bg-white p-4 rounded border border-purple-200">
                <h5 className="font-medium text-purple-900 mb-2">Descripción Mejorada</h5>
                <p className="text-sm text-gray-600 mb-2">Actual: {useCase.description}</p>
                <p className="text-sm text-purple-800">{contentSuggestions.suggestedDescription}</p>
              </div>
            )}

            {contentSuggestions.suggestedObjective && (
              <div className="bg-white p-4 rounded border border-purple-200">
                <h5 className="font-medium text-purple-900 mb-2">Objetivo Mejorado</h5>
                <p className="text-sm text-gray-600 mb-2">Actual: {useCase.objective || 'No especificado'}</p>
                <p className="text-sm text-purple-800">{contentSuggestions.suggestedObjective}</p>
              </div>
            )}

            {contentSuggestions.additionalActors && (
              <div className="bg-white p-4 rounded border border-purple-200">
                <h5 className="font-medium text-purple-900 mb-2">Actores Adicionales Sugeridos</h5>
                <div className="flex flex-wrap gap-2">
                  {contentSuggestions.additionalActors.map((actor: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {contentSuggestions.additionalPrerequisites && (
              <div className="bg-white p-4 rounded border border-purple-200">
                <h5 className="font-medium text-purple-900 mb-2">Prerrequisitos Adicionales</h5>
                <ul className="list-disc list-inside text-sm text-purple-800">
                  {contentSuggestions.additionalPrerequisites.map((prereq: string, index: number) => (
                    <li key={index}>{prereq}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                // Aquí podrías implementar la lógica para aplicar las sugerencias
                alert('Funcionalidad de aplicar sugerencias - implementar según necesidades específicas');
                setShowContentSuggestions(false);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Aplicar Sugerencias
            </button>
            <button
              onClick={() => setShowContentSuggestions(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Panel de análisis de IA */}
      {showAiAnalysis && aiAnalysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-medium text-blue-900">Análisis de IA</h4>
            </div>
            <button
              onClick={() => setShowAiAnalysis(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="font-medium text-blue-900 mb-2">Dominios Sugeridos</h5>
              <div className="space-y-1">
                {(aiAnalysis.suggestedDomains || []).map((domain: string, index: number) => (
                  <div key={index} className="text-blue-800 text-sm">• {domain}</div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-blue-900 mb-2">Complejidad</h5>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                aiAnalysis.complexity === 'high' ? 'bg-red-200 text-red-800' :
                aiAnalysis.complexity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                'bg-green-200 text-green-800'
              }`}>
                {aiAnalysis.complexity === 'high' ? 'Alta' :
                 aiAnalysis.complexity === 'medium' ? 'Media' : 'Baja'}
              </span>
            </div>
            
            <div>
              <h5 className="font-medium text-blue-900 mb-2">Confianza</h5>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${aiAnalysis.confidence || 0}%` }}
                  />
                </div>
                <span className="text-blue-800 text-sm font-medium">
                  {aiAnalysis.confidence || 0}%
                </span>
              </div>
            </div>
          </div>

          {aiAnalysis.summary && (
            <div className="mt-4">
              <h5 className="font-medium text-blue-900 mb-2">Resumen del Análisis</h5>
              <p className="text-blue-800 text-sm">{aiAnalysis.summary}</p>
            </div>
          )}

          {(aiAnalysis.keyEntities && aiAnalysis.keyEntities.length > 0) && (
            <div className="mt-4">
              <h5 className="font-medium text-blue-900 mb-2">Entidades Clave</h5>
              <div className="flex flex-wrap gap-2">
                {aiAnalysis.keyEntities.map((entity: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(aiAnalysis.businessProcesses && aiAnalysis.businessProcesses.length > 0) && (
            <div className="mt-4">
              <h5 className="font-medium text-blue-900 mb-2">Procesos de Negocio</h5>
              <ul className="list-disc list-inside text-sm text-blue-800">
                {aiAnalysis.businessProcesses.map((process: string, index: number) => (
                  <li key={index}>{process}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Información básica del caso de uso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Información Básica</h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Estado:</span>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                useCase.status === 'completed' ? 'bg-green-100 text-green-800' :
                useCase.status === 'analyzing' ? 'bg-blue-100 text-blue-800' :
                useCase.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {useCase.status === 'completed' ? 'Completado' :
                 useCase.status === 'analyzing' ? 'Analizando' :
                 useCase.status === 'draft' ? 'Borrador' :
                 useCase.status}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Prioridad:</span>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                useCase.priority === 'critical' ? 'bg-red-100 text-red-800' :
                useCase.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                useCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {useCase.priority === 'critical' ? 'Crítica' :
                 useCase.priority === 'high' ? 'Alta' :
                 useCase.priority === 'medium' ? 'Media' :
                 'Baja'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Complejidad:</span>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                useCase.complexity === 'high' ? 'bg-red-100 text-red-800' :
                useCase.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {useCase.complexity === 'high' ? 'Alta' :
                 useCase.complexity === 'medium' ? 'Media' :
                 'Baja'}
              </span>
            </div>
            {useCase.estimatedEffort && (
              <div>
                <span className="text-sm font-medium text-gray-700">Esfuerzo Estimado:</span>
                <span className="ml-2 text-sm text-gray-600">{useCase.estimatedEffort}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Progreso</h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Dominios BIAN:</span>
              <span className="ml-2 text-sm text-gray-600">
                {useCase.selectedDomains.length} seleccionados
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">APIs:</span>
              <span className="ml-2 text-sm text-gray-600">
                {(useCase.selectedApis || []).length} seleccionadas
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Última actualización:</span>
              <span className="ml-2 text-sm text-gray-600">
                {new Date(useCase.updatedAt).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Objetivo */}
      {useCase.objective && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Objetivo</h4>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{useCase.objective}</p>
        </div>
      )}

      {/* Actores */}
      {(useCase.actors?.primary?.length > 0 || useCase.actors?.secondary?.length > 0 || useCase.actors?.systems?.length > 0) && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Actores</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {useCase.actors?.primary && useCase.actors.primary.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Primarios</h5>
                <ul className="space-y-1">
                  {useCase.actors.primary.map((actor, index) => (
                    <li key={index} className="text-sm text-blue-800">• {actor}</li>
                  ))}
                </ul>
              </div>
            )}
            {useCase.actors?.secondary && useCase.actors.secondary.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-green-900 mb-2">Secundarios</h5>
                <ul className="space-y-1">
                  {useCase.actors.secondary.map((actor, index) => (
                    <li key={index} className="text-sm text-green-800">• {actor}</li>
                  ))}
                </ul>
              </div>
            )}
            {useCase.actors?.systems && useCase.actors.systems.length > 0 && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-purple-900 mb-2">Sistemas</h5>
                <ul className="space-y-1">
                  {useCase.actors.systems.map((system, index) => (
                    <li key={index} className="text-sm text-purple-800">• {system}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prerrequisitos */}
      {useCase.prerequisites && useCase.prerequisites.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Prerrequisitos</h4>
          <ul className="space-y-1 bg-gray-50 p-3 rounded-lg">
            {useCase.prerequisites.map((prereq, index) => (
              <li key={index} className="text-sm text-gray-700">• {prereq}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Flujo Principal */}
      {useCase.mainFlow && useCase.mainFlow.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Flujo Principal</h4>
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
            {useCase.mainFlow.map((step, index) => (
              <div key={index} className="flex gap-3">
                <span className="text-sm font-medium text-blue-600 min-w-[2rem]">{step.step}.</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{step.actor}:</span>
                  <span className="text-sm text-gray-700 ml-1">{step.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Postcondiciones */}
      {useCase.postconditions && useCase.postconditions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Postcondiciones</h4>
          <ul className="space-y-1 bg-gray-50 p-3 rounded-lg">
            {useCase.postconditions.map((postcond, index) => (
              <li key={index} className="text-sm text-gray-700">• {postcond}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reglas de Negocio */}
      {useCase.businessRules && useCase.businessRules.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Reglas de Negocio</h4>
          <ul className="space-y-1 bg-gray-50 p-3 rounded-lg">
            {useCase.businessRules.map((rule, index) => (
              <li key={index} className="text-sm text-gray-700">• {rule}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Análisis de IA existente */}
      {useCase.aiAnalysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-medium text-blue-900">Análisis de IA Previo</h4>
          </div>

          {useCase.aiAnalysis.summary && (
            <div className="mb-4">
              <h5 className="font-medium text-blue-900 mb-2">Resumen</h5>
              <p className="text-blue-800 text-sm">{useCase.aiAnalysis.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="font-medium text-blue-900 mb-2">Dominios Sugeridos</h5>
              <div className="space-y-1">
                {useCase.aiAnalysis.suggestedDomains.map((domain, index) => (
                  <div key={index} className="text-blue-800 text-sm">• {domain}</div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-blue-900 mb-2">Complejidad</h5>
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
              <h5 className="font-medium text-blue-900 mb-2">Confianza</h5>
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
      )}
    </div>
  );
};

// Componente DomainsTab
const DomainsTab: React.FC<{
  useCase: UseCase;
  domains: BianDomain[];
  onSelectDomains: (domains: string[]) => void;
  isLoading: boolean;
  queryClient: any;
}> = ({ useCase, domains, onSelectDomains, isLoading, queryClient }) => {
  const [selectedDomains, setSelectedDomains] = useState<string[]>(useCase.selectedDomains);
  const [isGettingDomainSuggestions, setIsGettingDomainSuggestions] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

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

  // Función para obtener sugerencias de IA de dominios
  const handleGetDomainSuggestions = async () => {
    setIsGettingDomainSuggestions(true);
    try {
      const analysisText = `
TÍTULO: ${useCase.title}
OBJETIVO: ${useCase.objective || ''}
DESCRIPCIÓN: ${useCase.description}
ACTORES: ${useCase.actors?.primary?.join(', ') || ''}
PRERREQUISITOS: ${useCase.prerequisites?.join(', ') || ''}
FLUJO PRINCIPAL: ${useCase.mainFlow?.map((s: any) => `${s.step}. ${s.description}`).join(', ') || ''}
      `.trim();

      const response = await useCaseService.recommendDomains(analysisText);
      const aiData = (response.data as any).data;
      setAiRecommendations(aiData);
      setShowAiSuggestions(true);
    } catch (error) {
      console.error('Error obteniendo sugerencias de dominios:', error);
      alert('Error al obtener sugerencias de dominios. Por favor intenta de nuevo.');
    } finally {
      setIsGettingDomainSuggestions(false);
    }
  };

  // Función para aplicar sugerencias de IA
  const applyAiSuggestions = async () => {
    if (aiRecommendations?.suggestedDomains) {
      console.log('=== APLICANDO SUGERENCIAS DE DOMINIOS ===');
      console.log('Dominios sugeridos por IA:', aiRecommendations.suggestedDomains);
      console.log('Dominios disponibles actuales:', domains.map(d => d.name));

      const suggestedDomains = aiRecommendations.suggestedDomains;
      const existingDomainNames = domains.map(d => d.name);
      
      // Encontrar dominios nuevos que no están en la lista
      const newDomains = suggestedDomains.filter((domain: string) => !existingDomainNames.includes(domain));
      console.log('Dominios nuevos a agregar:', newDomains);

      // Si hay dominios nuevos, agregarlos a la lista de dominios disponibles
      if (newDomains.length > 0) {
        console.log(`Agregando ${newDomains.length} dominios nuevos a la lista`);
        
        try {
          // Crear objetos de dominio para los nuevos dominios
          const newDomainObjects = newDomains.map((domainName: string) => ({
            name: domainName,
            description: `Dominio sugerido por IA: ${domainName}`,
            businessArea: 'IA Suggested'
          }));

          // Llamar al backend para crear los dominios dinámicamente
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bian/domains`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token-for-development'}`
            },
            body: JSON.stringify({
              domains: newDomainObjects
            })
          });

                     if (response.ok) {
             const result = await response.json();
             console.log('Dominios creados exitosamente en el backend:', result.data);
             
             // Forzar recarga de los dominios para que aparezcan en la lista
             console.log('Forzando recarga de dominios...');
             queryClient.invalidateQueries({ queryKey: ['bianDomains'] });
             
             // Mostrar mensaje de éxito al usuario
             alert(`Se agregaron ${newDomains.length} dominios nuevos sugeridos por IA: ${newDomains.join(', ')}`);
           } else {
            console.error('Error creando dominios en el backend');
            // Aún así, continuar con la selección local
            alert(`Se seleccionaron los dominios sugeridos, pero algunos pueden no estar en la lista base: ${newDomains.join(', ')}`);
          }
        } catch (error) {
          console.error('Error al crear dominios dinámicamente:', error);
          // Aún así, continuar con la selección local
          alert(`Se seleccionaron los dominios sugeridos, pero algunos pueden no estar en la lista base: ${newDomains.join(', ')}`);
        }
      }

      // Seleccionar todos los dominios sugeridos (tanto existentes como nuevos)
      setSelectedDomains(suggestedDomains);
      setShowAiSuggestions(false);
      
      console.log('Dominios finalmente seleccionados:', suggestedDomains);
    }
  };

  const hasChanges = JSON.stringify(selectedDomains.sort()) !== JSON.stringify(useCase.selectedDomains.sort());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Dominios BIAN</h3>
        <div className="flex gap-2">
          {/* Botón de sugerencias de IA */}
          <button
            onClick={handleGetDomainSuggestions}
            disabled={isGettingDomainSuggestions}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isGettingDomainSuggestions ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Sugerir con IA
              </>
            )}
          </button>
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
      </div>

      {/* Panel de sugerencias de IA */}
      {showAiSuggestions && aiRecommendations && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h4 className="text-lg font-medium text-purple-900">Sugerencias de IA</h4>
            </div>
            <button
              onClick={() => setShowAiSuggestions(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {aiRecommendations.reasoning && (
            <div className="mb-4">
              <h5 className="font-medium text-purple-900 mb-2">Análisis:</h5>
              <p className="text-purple-800 text-sm">{aiRecommendations.reasoning}</p>
            </div>
          )}

          {aiRecommendations.suggestedDomains && (
            <div className="mb-4">
              <h5 className="font-medium text-purple-900 mb-2">Dominios Recomendados:</h5>
              <div className="flex flex-wrap gap-2">
                {aiRecommendations.suggestedDomains.map((domain: string) => (
                  <span
                    key={domain}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={applyAiSuggestions}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Aplicar Sugerencias
            </button>
            <button
              onClick={() => setShowAiSuggestions(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              Cancelar
            </button>
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
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{domain.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{domain.description}</p>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Área:</span> {domain.businessArea || 'N/A'}
                </div>
              </div>
              {selectedDomains.includes(domain.name) && (
                <CheckCircle className="h-5 w-5 text-blue-600 ml-2" />
              )}
            </div>
          </div>
        ))}
      </div>

      {domains.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay dominios disponibles</h3>
          <p className="text-gray-600">No se pudieron cargar los dominios BIAN.</p>
        </div>
      )}
    </div>
  );
};

// Componente ApisTab para selección de APIs semánticas
const ApisTab: React.FC<{
  useCase: UseCase;
  onSelectApis: (apis: string[]) => void;
  isLoading: boolean;
}> = ({ useCase, onSelectApis, isLoading }) => {
  const [selectedApis, setSelectedApis] = useState<string[]>(useCase.selectedApis || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [isGettingApiSuggestions, setIsGettingApiSuggestions] = useState(false);
  const [aiApiSuggestions, setAiApiSuggestions] = useState<any>(null);
  const [showApiSuggestions, setShowApiSuggestions] = useState(false);

  // Verificar cambios
  useEffect(() => {
    const currentApis = [...(useCase.selectedApis || [])].sort();
    const newApis = [...selectedApis].sort();
    setHasChanges(JSON.stringify(currentApis) !== JSON.stringify(newApis));
  }, [selectedApis, useCase.selectedApis]);

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

  // Función para obtener sugerencias de IA de APIs
  const handleGetApiSuggestions = async () => {
    if (useCase.selectedDomains.length === 0) {
      alert('Por favor selecciona dominios primero antes de obtener sugerencias de APIs');
      return;
    }

    setIsGettingApiSuggestions(true);
    try {
      const useCaseContext = `
TÍTULO: ${useCase.title}
DESCRIPCIÓN: ${useCase.description}
OBJETIVO: ${useCase.objective || ''}
DOMINIOS SELECCIONADOS: ${useCase.selectedDomains.join(', ')}
      `.trim();

      const response = await useCaseService.aiSuggestApis({
        domains: useCase.selectedDomains,
        useCaseContext
      });
      
      const aiData = (response.data as any).data;
      setAiApiSuggestions(aiData);
      setShowApiSuggestions(true);
    } catch (error) {
      console.error('Error obteniendo sugerencias de APIs:', error);
      alert('Error al obtener sugerencias de APIs. Por favor intenta de nuevo.');
    } finally {
      setIsGettingApiSuggestions(false);
    }
  };

  // Función para aplicar sugerencias de IA de APIs
  const applyApiSuggestions = async () => {
    if (aiApiSuggestions?.suggestedApis) {
      console.log('=== APLICANDO SUGERENCIAS DE IA ===');
      console.log('APIs sugeridas por IA:', aiApiSuggestions.suggestedApis);
      console.log('APIs disponibles:', apis);
      console.log('APIs actualmente seleccionadas:', selectedApis);

      const suggestedApiNames = aiApiSuggestions.suggestedApis.map((api: any) => api.name || api);
      console.log('Nombres de APIs sugeridas:', suggestedApiNames);

      // Obtener lista de APIs disponibles para comparar
      const availableApiNames = apis.map(api => api.name);
      console.log('Nombres de APIs disponibles:', availableApiNames);

      // Función para encontrar coincidencias
      const findMatchingApis = (suggestedNames: string[], availableNames: string[]) => {
        const matches: string[] = [];
        
        suggestedNames.forEach(suggestedName => {
          // Buscar coincidencia exacta primero
          const exactMatch = availableNames.find(available => available === suggestedName);
          if (exactMatch) {
            matches.push(exactMatch);
            return;
          }

          // Buscar coincidencia parcial (contiene)
          const partialMatch = availableNames.find(available => 
            available.toLowerCase().includes(suggestedName.toLowerCase()) ||
            suggestedName.toLowerCase().includes(available.toLowerCase())
          );
          if (partialMatch) {
            matches.push(partialMatch);
            return;
          }

          console.warn(`No se encontró coincidencia para API sugerida: ${suggestedName}`);
        });

        return matches;
      };

      const matchingApis = findMatchingApis(suggestedApiNames, availableApiNames);
      console.log('APIs que coinciden y se van a seleccionar:', matchingApis);

      // Encontrar APIs nuevas que no están en la lista disponible
      const newApis = aiApiSuggestions.suggestedApis.filter((api: any) => 
        !availableApiNames.includes(api.name)
      );
      console.log('APIs nuevas a crear:', newApis);

      // Si hay APIs nuevas, crearlas dinámicamente
      if (newApis.length > 0) {
        console.log(`Creando ${newApis.length} APIs nuevas dinámicamente`);
        
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bian/apis/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token-for-development'}`
            },
            body: JSON.stringify({
              apis: newApis.map((api: any) => ({
                name: api.name,
                domain: api.domain,
                description: api.reason || `API sugerida por IA: ${api.name}`
              }))
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('APIs creadas exitosamente en el backend:', result.data);
            
            // Agregar las APIs nuevas a la lista de APIs coincidentes
            const newApiNames = newApis.map((api: any) => api.name);
            const allMatchingApis = [...matchingApis, ...newApiNames];
            
            // Combinar APIs ya seleccionadas con las nuevas
            const newSelectedApis = [...new Set([...selectedApis, ...allMatchingApis])];
            console.log('Nueva selección final (incluyendo APIs creadas):', newSelectedApis);

            setSelectedApis(newSelectedApis);
            setShowApiSuggestions(false);

            // Mostrar mensaje de éxito
            alert(`Se aplicaron ${allMatchingApis.length} APIs sugeridas (${newApis.length} creadas dinámicamente): ${allMatchingApis.join(', ')}`);
          } else {
            console.error('Error creando APIs en el backend');
            // Continuar solo con las APIs que coincidieron
            const newSelectedApis = [...new Set([...selectedApis, ...matchingApis])];
            setSelectedApis(newSelectedApis);
            setShowApiSuggestions(false);
            
            if (matchingApis.length > 0) {
              alert(`Se aplicaron ${matchingApis.length} APIs existentes: ${matchingApis.join(', ')}. ${newApis.length} APIs no pudieron crearse.`);
            } else {
              alert('No se encontraron APIs coincidentes y no se pudieron crear APIs nuevas.');
            }
          }
        } catch (error) {
          console.error('Error al crear APIs dinámicamente:', error);
          // Continuar solo con las APIs que coincidieron
          const newSelectedApis = [...new Set([...selectedApis, ...matchingApis])];
          setSelectedApis(newSelectedApis);
          setShowApiSuggestions(false);
          
          if (matchingApis.length > 0) {
            alert(`Se aplicaron ${matchingApis.length} APIs existentes: ${matchingApis.join(', ')}. Error al crear APIs nuevas.`);
          } else {
            alert('No se encontraron APIs coincidentes y ocurrió un error al crear APIs nuevas.');
          }
        }
      } else {
        // No hay APIs nuevas, solo aplicar las que coincidieron
        const newSelectedApis = [...new Set([...selectedApis, ...matchingApis])];
        console.log('Nueva selección final:', newSelectedApis);

        setSelectedApis(newSelectedApis);
        setShowApiSuggestions(false);

        // Mostrar mensaje de éxito
        if (matchingApis.length > 0) {
          alert(`Se aplicaron ${matchingApis.length} APIs sugeridas: ${matchingApis.join(', ')}`);
        } else {
          alert('No se encontraron APIs coincidentes en la lista actual. Verifica que los dominios correctos estén seleccionados.');
        }
      }
    }
  };

  // Consultar APIs para los dominios seleccionados
  const { data: apisResponse, isLoading: apisLoading } = useQuery({
    queryKey: ['bianApis', useCase.selectedDomains],
    queryFn: () => bianService.getApisForDomains(useCase.selectedDomains, useCase.originalText),
    enabled: useCase.selectedDomains.length > 0,
  });

  const apis: BianApi[] = (apisResponse?.data?.data as { suggestedApis: BianApi[] })?.suggestedApis || [];

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
        <div>
          <h3 className="text-lg font-semibold text-gray-900">APIs Semánticas Escogidas</h3>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona las APIs BIAN que consideras usar para resolver el caso de uso
          </p>
        </div>
        <div className="flex gap-2">
          {/* Botón de sugerencias de IA para APIs */}
          <button
            onClick={handleGetApiSuggestions}
            disabled={isGettingApiSuggestions}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isGettingApiSuggestions ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Sugerir APIs con IA
              </>
            )}
          </button>
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
      </div>

      {/* Panel de sugerencias de IA para APIs */}
      {showApiSuggestions && aiApiSuggestions && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h4 className="text-lg font-medium text-purple-900">Sugerencias de APIs</h4>
            </div>
            <button
              onClick={() => setShowApiSuggestions(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {aiApiSuggestions.reasoning && (
            <div className="mb-4">
              <h5 className="font-medium text-purple-900 mb-2">Análisis:</h5>
              <p className="text-purple-800 text-sm">{aiApiSuggestions.reasoning}</p>
            </div>
          )}

          {aiApiSuggestions.suggestedApis && (
            <div className="mb-4">
              <h5 className="font-medium text-purple-900 mb-2">APIs Recomendadas:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiApiSuggestions.suggestedApis.map((api: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border border-purple-200">
                    <h6 className="font-medium text-gray-900">{api.name || api}</h6>
                    {api.reason && (
                      <p className="text-sm text-gray-600 mt-1">{api.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={applyApiSuggestions}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Aplicar Sugerencias
            </button>
            <button
              onClick={() => setShowApiSuggestions(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{api.name}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {api.domain}
                  </span>
                </div>
                {api.description && (
                  <p className="text-sm text-gray-600 mb-2">{api.description}</p>
                )}
                {api.reason && (
                  <p className="text-xs text-blue-600">💡 {api.reason}</p>
                )}
              </div>
              {selectedApis.includes(api.name) && (
                <CheckCircle className="h-5 w-5 text-blue-600 ml-4" />
              )}
            </div>
          </div>
        ))}

        {apis.length === 0 && (
          <div className="text-center py-8">
            <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay APIs disponibles</h3>
            <p className="text-gray-600">No se encontraron APIs para los dominios seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente DocumentationTab - Nueva pestaña para documentación de APIs con YAML específico
const DocumentationTab: React.FC<{ useCase: UseCase }> = ({ useCase }) => {
  const [selectedApi, setSelectedApi] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [yamlContent, setYamlContent] = useState<string>('');
  const [isLoadingYaml, setIsLoadingYaml] = useState(false);
  const [yamlError, setYamlError] = useState<string>('');
  // const [viewMode, setViewMode] = useState<'yaml' | 'swagger'>('yaml'); // Removido temporalmente

  // Obtener las APIs seleccionadas con sus detalles
  const { data: apisResponse, isLoading: apisLoading } = useQuery({
    queryKey: ['bianApis', useCase.selectedDomains],
    queryFn: () => bianService.getApisForDomains(useCase.selectedDomains, useCase.originalText),
    enabled: useCase.selectedDomains.length > 0,
  });

  const apis: BianApi[] = (apisResponse?.data?.data as { suggestedApis: BianApi[] })?.suggestedApis || [];
  const selectedApis = apis.filter(api => useCase.selectedApis.includes(api.name));
  const currentApiData = selectedApis.find(api => api.name === selectedApi) || selectedApis[0];

  // Obtener métodos disponibles para la API seleccionada
  const availableMethods = currentApiData?.availableMethods || [currentApiData?.method].filter(Boolean);

  // Función para obtener YAML específico de BIAN
  const fetchBianYaml = async (apiName: string, method: string) => {
    setIsLoadingYaml(true);
    setYamlError('');
    setYamlContent('');

    try {
      // Simulación de llamada a BIAN - en producción esto sería una llamada real
      // Por ahora generamos un YAML de ejemplo basado en la API y método
      const mockYaml = generateMockBianYaml(apiName, method, currentApiData);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setYamlContent(mockYaml);
    } catch (error) {
      console.error('Error fetching BIAN YAML:', error);
      setYamlError('Error al obtener la especificación YAML de BIAN');
    } finally {
      setIsLoadingYaml(false);
    }
  };

  // Función para generar YAML mock realista
  const generateMockBianYaml = (apiName: string, method: string, apiData: any) => {
    const sanitizedApiName = apiName.replace(/\s+/g, '');
    const endpoint = apiData?.endpoint || `/api/v1/${sanitizedApiName.toLowerCase()}`;
    
    return `openapi: 3.0.3
info:
  title: ${apiName} API
  description: ${apiData?.description || `Documentación para ${apiName}`}
  version: "1.0.0"
  contact:
    name: BIAN
    url: https://bian.org
    email: support@bian.org
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html

servers:
  - url: https://api.bian.org/v13
    description: Servidor BIAN v13 (Producción)
  - url: https://sandbox.bian.org/v13
    description: Servidor BIAN v13 (Sandbox)

paths:
  ${endpoint}:
    ${method.toLowerCase()}:
      tags:
        - ${apiData?.domain || 'Customer Management'}
      summary: ${getMethodSummary(method, apiName)}
      description: |
        ${getMethodDescription(method, apiName, apiData?.description)}
        
        **Dominio BIAN:** ${apiData?.domain || 'Customer Management'}
        **Tipo de Operación:** ${apiData?.operationType || 'CR'}
      operationId: ${method.toLowerCase()}${sanitizedApiName}
      parameters:
        - name: X-Request-ID
          in: header
          required: true
          schema:
            type: string
            format: uuid
          description: Identificador único de la solicitud
        - name: Authorization
          in: header
          required: true
          schema:
            type: string
          description: Token de autorización Bearer
${generateMethodSpecificParams(method, apiData)}
      responses:
        '200':
          description: ${getSuccessDescription(method)}
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${sanitizedApiName}Response'
              example:
                ${generateResponseExample(method, apiName)}
        '400':
          description: Solicitud inválida
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: No autorizado
        '403':
          description: Acceso prohibido
        '404':
          description: Recurso no encontrado
        '500':
          description: Error interno del servidor

components:
  schemas:
    ${sanitizedApiName}Response:
      type: object
      properties:
        ${generateSchemaProperties(method, apiName)}
    
    ErrorResponse:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
              example: "INVALID_REQUEST"
            message:
              type: string
              example: "Los parámetros de entrada no son válidos"
            details:
              type: array
              items:
                type: string
  
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []

tags:
  - name: ${apiData?.domain || 'Customer Management'}
    description: APIs del dominio ${apiData?.domain || 'Customer Management'}
    externalDocs:
      description: Documentación BIAN
      url: https://bian.org/semantic-apis`;
  };

  const getMethodSummary = (method: string, apiName: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return `Obtener información de ${apiName}`;
      case 'POST': return `Crear nuevo registro en ${apiName}`;
      case 'PUT': return `Actualizar registro en ${apiName}`;
      case 'DELETE': return `Eliminar registro de ${apiName}`;
      default: return `Operación ${method} en ${apiName}`;
    }
  };

  const getMethodDescription = (method: string, apiName: string, description?: string) => {
    const baseDesc = description || `API para gestión de ${apiName}`;
    const methodDesc = {
      'GET': `Recupera información detallada de ${apiName}. Esta operación permite consultar datos específicos del recurso utilizando parámetros de filtrado y búsqueda.`,
      'POST': `Crea un nuevo registro en ${apiName}. Esta operación permite registrar nueva información con validación completa de datos de entrada.`,
      'PUT': `Actualiza información existente en ${apiName}. Esta operación permite modificar datos completos del recurso especificado.`,
      'DELETE': `Elimina un registro específico de ${apiName}. Esta operación requiere confirmación y maneja dependencias relacionadas.`
    }[method.toUpperCase()] || `Ejecuta operaciones específicas en ${apiName}.`;
    
    return `${baseDesc}\n\n${methodDesc}`;
  };

  const generateMethodSpecificParams = (method: string, apiData: any) => {
    let params = '';
    
    if (method.toUpperCase() === 'GET') {
      params += `
        - name: customerId
          in: path
          required: true
          schema:
            type: string
          description: Identificador único del cliente`;
    }
    
    if (['POST', 'PUT'].includes(method.toUpperCase())) {
      params += `
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/${apiData?.name?.replace(/\s+/g, '') || 'RequestBody'}'`;
    }
    
    return params;
  };

  const getSuccessDescription = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'Información recuperada exitosamente';
      case 'POST': return 'Recurso creado exitosamente';
      case 'PUT': return 'Recurso actualizado exitosamente';
      case 'DELETE': return 'Recurso eliminado exitosamente';
      default: return 'Operación completada exitosamente';
    }
  };

  const generateResponseExample = (_method: string, apiName: string) => {
    const timestamp = new Date().toISOString();
    return `
                requestId: "123e4567-e89b-12d3-a456-426614174000"
                timestamp: "${timestamp}"
                data:
                  id: "cust-001"
                  name: "${apiName} Response"
                  status: "active"
                  createdAt: "${timestamp}"`;
  };

  const generateSchemaProperties = (_method: string, apiName: string) => {
    return `
        requestId:
          type: string
          format: uuid
          description: ID único de la solicitud
        timestamp:
          type: string
          format: date-time
          description: Timestamp de la respuesta
        data:
          type: object
          description: Datos de respuesta específicos de ${apiName}`;
  };

  // Convertir YAML a JSON para Swagger UI
  const convertYamlToSwaggerSpec = () => {
    if (!yamlContent) return null;
    
    try {
      // Convertir el YAML string a un objeto JavaScript que Swagger UI pueda usar
      // Por simplicidad, vamos a crear el objeto directamente desde los datos
      const sanitizedApiName = currentApiData?.name?.replace(/\s+/g, '') || 'API';
      const endpoint = currentApiData?.endpoint || `/api/v1/${sanitizedApiName.toLowerCase()}`;
      
      return {
        openapi: "3.0.3",
        info: {
          title: `${selectedApi}`,
          description: `${getMethodDescription(selectedMethod, selectedApi, currentApiData?.description)}\n\n**Dominio BIAN:** ${currentApiData?.domain || 'Customer Management'}\n**Tipo de Operación:** ${currentApiData?.operationType || 'CR'}`,
          version: "1.0.0"
        },
        paths: {
          [endpoint]: {
            [selectedMethod.toLowerCase()]: {
              tags: [currentApiData?.domain || 'Customer Management'],
              summary: getMethodSummary(selectedMethod, selectedApi),
              description: getMethodDescription(selectedMethod, selectedApi, currentApiData?.description),
              operationId: `${selectedMethod.toLowerCase()}${sanitizedApiName}`,
              parameters: [
                {
                  name: "X-Request-ID",
                  in: "header",
                  required: true,
                  schema: {
                    type: "string",
                    format: "uuid"
                  },
                  description: "Identificador único de la solicitud"
                },
                {
                  name: "Authorization",
                  in: "header",
                  required: true,
                  schema: {
                    type: "string"
                  },
                  description: "Token de autorización Bearer"
                },
                ...(selectedMethod.toUpperCase() === 'GET' ? [{
                  name: "customerId",
                  in: "path",
                  required: true,
                  schema: {
                    type: "string"
                  },
                  description: "Identificador único del cliente"
                }] : [])
              ],
              ...((['POST', 'PUT'].includes(selectedMethod.toUpperCase())) && {
                requestBody: {
                  required: true,
                  content: {
                    "application/json": {
                      schema: {
                        $ref: `#/components/schemas/${sanitizedApiName}Request`
                      }
                    }
                  }
                }
              }),
              responses: {
                "200": {
                  description: getSuccessDescription(selectedMethod),
                  content: {
                    "application/json": {
                      schema: {
                        $ref: `#/components/schemas/${sanitizedApiName}Response`
                      },
                      example: {
                        requestId: "123e4567-e89b-12d3-a456-426614174000",
                        timestamp: new Date().toISOString(),
                        data: {
                          id: "cust-001",
                          name: `${selectedApi} Response`,
                          status: "active",
                          createdAt: new Date().toISOString()
                        }
                      }
                    }
                  }
                },
                "400": {
                  description: "Solicitud inválida",
                  content: {
                    "application/json": {
                      schema: {
                        $ref: "#/components/schemas/ErrorResponse"
                      }
                    }
                  }
                },
                "401": {
                  description: "No autorizado"
                },
                "403": {
                  description: "Acceso prohibido"
                },
                "404": {
                  description: "Recurso no encontrado"
                },
                "500": {
                  description: "Error interno del servidor"
                }
              }
            }
          }
        },
        components: {
          schemas: {
            [`${sanitizedApiName}Response`]: {
              type: "object",
              properties: {
                requestId: {
                  type: "string",
                  format: "uuid",
                  description: "ID único de la solicitud"
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                  description: "Timestamp de la respuesta"
                },
                data: {
                  type: "object",
                  description: `Datos de respuesta específicos de ${selectedApi}`
                }
              }
            },
            [`${sanitizedApiName}Request`]: {
              type: "object",
              properties: {
                customerData: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "Nombre del cliente"
                    },
                    email: {
                      type: "string",
                      format: "email",
                      description: "Email del cliente"
                    },
                    phone: {
                      type: "string",
                      description: "Teléfono del cliente"
                    }
                  },
                  required: ["name", "email"]
                }
              }
            },
            ErrorResponse: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                      example: "INVALID_REQUEST"
                    },
                    message: {
                      type: "string",
                      example: "Los parámetros de entrada no son válidos"
                    },
                    details: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    }
                  }
                }
              }
            }
          },
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT"
            }
          }
        },
        security: [
          {
            BearerAuth: []
          }
        ],
        tags: [
          {
            name: currentApiData?.domain || 'Customer Management',
            description: `APIs del dominio ${currentApiData?.domain || 'Customer Management'}`,
            externalDocs: {
              description: "Documentación BIAN",
              url: "https://bian.org/semantic-apis"
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error converting YAML to Swagger spec:', error);
      return null;
    }
  };

  // Copiar contenido al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent);
      alert('YAML copiado al portapapeles');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      alert('Error al copiar al portapapeles');
    }
  };

  // Effect para cargar YAML cuando cambia la selección
  useEffect(() => {
    if (selectedApi && selectedMethod) {
      fetchBianYaml(selectedApi, selectedMethod);
    }
  }, [selectedApi, selectedMethod]);

  // Inicializar selecciones por defecto
  useEffect(() => {
    if (selectedApis.length > 0 && !selectedApi) {
      const firstApi = selectedApis[0];
      setSelectedApi(firstApi.name);
      const firstMethod = firstApi.availableMethods?.[0] || firstApi.method;
      setSelectedMethod(firstMethod || '');
    }
  }, [selectedApis, selectedApi]);

  if (useCase.selectedApis.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay APIs seleccionadas</h3>
        <p className="text-gray-600">
          Primero selecciona APIs en la pestaña "APIs Semánticas Escogidas" para ver su documentación.
        </p>
      </div>
    );
  }

  if (apisLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header con selectores */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Documentación de APIs</h3>
            <p className="text-sm text-gray-600 mt-1">
              Especificación YAML específica desde el repositorio BIAN
            </p>
          </div>
        </div>

        {/* Selectores de API y Método */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar API
            </label>
            <select 
              value={selectedApi} 
              onChange={(e) => {
                setSelectedApi(e.target.value);
                // Reset method selection when API changes
                const newApiData = selectedApis.find(api => api.name === e.target.value);
                const firstMethod = newApiData?.availableMethods?.[0] || newApiData?.method;
                setSelectedMethod(firstMethod || '');
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {selectedApis.map((api) => (
                <option key={api.name} value={api.name}>
                  {api.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Método
            </label>
            <select 
              value={selectedMethod} 
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!availableMethods || availableMethods.length === 0}
            >
              {availableMethods?.map((method) => (
                <option key={method} value={method}>
                  {method.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información de la API seleccionada */}
        {currentApiData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{currentApiData.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{currentApiData.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span><strong>Dominio:</strong> {currentApiData.domain}</span>
                  <span><strong>Endpoint:</strong> {currentApiData.endpoint}</span>
                  <span><strong>Tipo:</strong> {currentApiData.operationType}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {currentApiData.domain}
                </span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  selectedMethod === 'GET' ? 'bg-green-100 text-green-800' :
                  selectedMethod === 'POST' ? 'bg-blue-100 text-blue-800' :
                  selectedMethod === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                  selectedMethod === 'DELETE' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedMethod}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vista Dual Vertical: Swagger arriba, YAML abajo */}
      {selectedApi && selectedMethod && (
        <div className="space-y-6">
          {/* Sección Swagger UI */}
          {yamlContent && !isLoadingYaml && !yamlError && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Vista Swagger UI - {selectedApi} ({selectedMethod})
                  </h4>
                  <p className="text-sm text-gray-600">Interfaz interactiva de la especificación OpenAPI</p>
                </div>
              </div>

              <div className="p-0">
                <div className="swagger-container max-h-96 overflow-auto">
                  {(() => {
                    const swaggerSpec = convertYamlToSwaggerSpec();
                    return swaggerSpec ? (
                      <SwaggerUI 
                        spec={swaggerSpec}
                        docExpansion="list"
                        defaultModelsExpandDepth={1}
                        defaultModelExpandDepth={1}
                        displayOperationId={false}
                        displayRequestDuration={true}
                        filter={false}
                        showExtensions={false}
                        showCommonExtensions={false}
                        tryItOutEnabled={false}
                      />
                    ) : (
                      <div className="p-6 text-center">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-600">Error al generar especificación Swagger</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Sección YAML */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-gray-900">
                  Especificación YAML - {selectedApi} ({selectedMethod})
                </h4>
                <p className="text-sm text-gray-600">Obtenido del repositorio oficial BIAN</p>
              </div>
              <button
                onClick={copyToClipboard}
                disabled={!yamlContent || isLoadingYaml}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <span>📋</span>
                Copiar YAML
              </button>
            </div>

            <div className="p-0">
              {isLoadingYaml && (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                  <span className="ml-3 text-gray-600">Obteniendo especificación YAML de BIAN...</span>
                </div>
              )}

              {yamlError && (
                <div className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar YAML</h3>
                  <p className="text-red-600">{yamlError}</p>
                  <button
                    onClick={() => fetchBianYaml(selectedApi, selectedMethod)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {yamlContent && !isLoadingYaml && (
                <div className="bg-gray-900 text-gray-100 max-h-80 overflow-auto">
                  <pre className="p-6 text-sm font-mono whitespace-pre-wrap">{yamlContent}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UseCasePage; 