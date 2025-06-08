import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRightIcon, ArrowLeftIcon, BookOpenIcon, CodeBracketIcon, PlayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

// Simulamos un hook para toast mientras lo implementamos
const useToast = () => ({
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.log('Info:', message),
});

const SingleApiPage: React.FC = () => {
  const { useCaseId, apiName } = useParams<{ useCaseId: string; apiName: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // Estados locales
  const [activeTab, setActiveTab] = useState<'documentation' | 'payload' | 'testing' | 'notes'>('documentation');
  const [customPayload, setCustomPayload] = useState<string>('{}');
  const [customHeaders, setCustomHeaders] = useState<string>('{}');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [apiData, setApiData] = useState<any>(null);

  if (!useCaseId || !apiName) {
    return <div>Error: Parámetros de ruta faltantes</div>;
  }

  const decodedApiName = decodeURIComponent(apiName);

  // Simular carga de datos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Simular datos de API
        const mockApiData = {
          useCase: {
            id: useCaseId,
            title: 'Consulta Detallada de Información de Clientes',
            description: 'Caso de uso para consultar información detallada de clientes'
          },
          api: {
            name: decodedApiName,
            description: 'Gestión del directorio de clientes y sus datos básicos',
            domain: 'Customer Management',
            version: '1.0.0',
            endpoints: [
              {
                method: 'GET',
                path: '/customer-directory/{customer-id}',
                description: 'Obtener información del cliente'
              }
            ]
          },
          openApiSpec: {
            openapi: '3.0.0',
            info: {
              title: decodedApiName,
              version: '1.0.0'
            },
            paths: {
              '/customer-directory/{customer-id}': {
                get: {
                  summary: 'Obtener información del cliente',
                  parameters: [
                    {
                      name: 'customer-id',
                      in: 'path',
                      required: true,
                      schema: { type: 'string' }
                    }
                  ],
                  responses: {
                    '200': {
                      description: 'Información del cliente',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              customerId: { type: 'string' },
                              name: { type: 'string' },
                              email: { type: 'string' },
                              status: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };
        
        setApiData(mockApiData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading API data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [useCaseId, decodedApiName]);

  // Auto-save simulado
  const debouncedSave = useCallback(() => {
    if (hasUnsavedChanges) {
      setTimeout(() => {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        toast.success('Personalización guardada automáticamente');
      }, 1000);
    }
  }, [hasUnsavedChanges, toast]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(debouncedSave, 2000);
      return () => clearTimeout(timer);
    }
  }, [debouncedSave, hasUnsavedChanges]);

  // Handlers
  const handlePayloadChange = (value: string) => {
    setCustomPayload(value);
    setHasUnsavedChanges(true);
  };

  const handleHeadersChange = (value: string) => {
    setCustomHeaders(value);
    setHasUnsavedChanges(true);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasUnsavedChanges(true);
  };

  const handleTestApi = () => {
    toast.info('Funcionalidad de testing en desarrollo');
  };

  const handleGoBack = () => {
    navigate(`/use-cases/${useCaseId}/select-apis`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!apiData) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar la API</h3>
        <p className="text-gray-500 mb-4">No se pudo cargar la información de la API.</p>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver a selección de APIs
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'documentation' as const, name: 'Documentación', icon: BookOpenIcon },
    { key: 'payload' as const, name: 'Editor de Payload', icon: CodeBracketIcon },
    { key: 'testing' as const, name: 'Testing', icon: PlayIcon },
    { key: 'notes' as const, name: 'Notas', icon: DocumentTextIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Selección de APIs
            </button>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                {apiData.useCase?.title}
              </span>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-900 md:ml-2">
                {apiData.api.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{apiData.api.name}</h1>
            <p className="mt-2 text-gray-600">{apiData.api.description}</p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>Dominio: {apiData.api.domain}</span>
              <span>•</span>
              <span>Versión: {apiData.api.version || '1.0.0'}</span>
              {lastSaved && (
                <>
                  <span>•</span>
                  <span>
                    Último guardado: {lastSaved.toLocaleTimeString()}
                    {hasUnsavedChanges && ' (cambios sin guardar)'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            {hasUnsavedChanges && (
              <div className="flex items-center text-amber-600 text-sm">
                <div className="animate-pulse h-2 w-2 bg-amber-500 rounded-full mr-2"></div>
                Guardando automáticamente...
              </div>
            )}
            {lastSaved && !hasUnsavedChanges && (
              <div className="flex items-center text-green-600 text-sm">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                Guardado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'documentation' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Documentación de la API</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-800">Endpoints Disponibles</h3>
                  {apiData.api.endpoints?.map((endpoint: any, index: number) => (
                    <div key={index} className="mt-2 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                          endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm">{endpoint.path}</code>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{endpoint.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-800 mb-2">Especificación OpenAPI</h3>
                  <pre className="bg-gray-50 rounded-md p-4 text-sm overflow-auto max-h-96">
                    {JSON.stringify(apiData.openApiSpec, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payload Personalizado</h3>
                <textarea
                  value={customPayload}
                  onChange={(e) => handlePayloadChange(e.target.value)}
                  className="w-full h-96 font-mono text-sm border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa tu payload JSON personalizado..."
                />
                {!isValidJson(customPayload) && (
                  <p className="mt-2 text-sm text-red-600">JSON inválido</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Headers Personalizados</h3>
                <textarea
                  value={customHeaders}
                  onChange={(e) => handleHeadersChange(e.target.value)}
                  className="w-full h-96 font-mono text-sm border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                />
                {!isValidJson(customHeaders) && (
                  <p className="mt-2 text-sm text-red-600">JSON inválido</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="sm:flex sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Testing de API</h3>
                <button
                  onClick={handleTestApi}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Ejecutar Test
                </button>
              </div>
              
              <div className="text-center py-12 text-gray-500">
                <PlayIcon className="mx-auto h-12 w-12 mb-4" />
                <p>Funcionalidad de testing en desarrollo</p>
                <p className="text-sm mt-2">Aquí podrás probar la API con tus payloads personalizados</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notas y Documentación Adicional</h3>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="w-full h-96 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Agrega notas, documentación adicional, consideraciones especiales, etc..."
              />
              <p className="mt-2 text-sm text-gray-500">
                Usa este espacio para documentar casos especiales, configuraciones, o cualquier información relevante para esta API.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Utilidades
function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export default SingleApiPage; 