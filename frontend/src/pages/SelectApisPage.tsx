import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronRight, CheckCircle, XCircle, Save, Brain, Code } from 'lucide-react';
import { useCaseService } from '../services/api';

interface ApiMethod {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }[];
  requestBody?: any;
}

interface ApiRecommendation {
  id: string;
  name: string;
  domain: string;
  description: string;
  methods: ApiMethod[];
  recommended: boolean;
  confidence: number;
  reason: string;
}

interface DomainApisGroup {
  domain: string;
  apis: ApiRecommendation[];
}

const SelectApisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [domainGroups, setDomainGroups] = useState<DomainApisGroup[]>([]);
  const [selectedApis, setSelectedApis] = useState<string[]>([]);
  const [expandedApis, setExpandedApis] = useState<Set<string>>(new Set());
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Estados para sugerencias AI de APIs
  const [isGettingApiSuggestions, setIsGettingApiSuggestions] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<any>(null);
  const [showApiSuggestions, setShowApiSuggestions] = useState(false);

  // Obtener el caso de uso
  const { data: useCase, isLoading } = useQuery({
    queryKey: ['useCase', id],
    queryFn: () => useCaseService.getById(id!),
    enabled: !!id,
  });

  // Mutation para seleccionar APIs
  const selectApisMutation = useMutation({
    mutationFn: (apis: string[]) => useCaseService.selectApis(id!, apis),
    onSuccess: () => {
      navigate(`/use-cases/${id}`);
    },
    onError: (error) => {
      console.error('Error seleccionando APIs:', error);
      alert('Error al seleccionar APIs. Por favor intenta de nuevo.');
    },
  });

  // Obtener recomendaciones de APIs al cargar la página
  useEffect(() => {
    if (useCase?.data?.data) {
      analyzeForApis();
    }
  }, [useCase]);

  const analyzeForApis = async () => {
    const useCaseData = useCase?.data?.data as any;
    if (!useCaseData?.selectedDomains?.length) return;

    setIsAnalyzing(true);
    try {
      // NUEVA ESTRATEGIA: Usar el backend con lógica recursiva por dominio
      await getBackendApiSuggestions(useCaseData);
    } catch (error) {
      console.error('Error analizando APIs con backend, usando fallback local:', error);
      // Fallback: usar la lógica local original
      const apiGroups = generateApiGroups(
        useCaseData.selectedDomains,
        useCaseData
      );
      
      setDomainGroups(apiGroups);
      setExpandedDomains(new Set(apiGroups.map(group => group.domain)));
      
      const recommendedApis = apiGroups.flatMap(group => 
        group.apis.filter(api => api.recommended).map(api => api.id)
      );
      setSelectedApis(recommendedApis);
      setShowAnalysis(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Nueva función para obtener sugerencias del backend con lógica recursiva
  const getBackendApiSuggestions = async (useCaseData: any) => {
    setIsGettingApiSuggestions(true);
    try {
      console.log('=== USANDO BACKEND RECURSIVO PARA CREACIÓN ===');
      console.log('Dominios seleccionados:', useCaseData.selectedDomains);

      const useCaseContext = `
TÍTULO: ${useCaseData.title}
DESCRIPCIÓN: ${useCaseData.description}
OBJETIVO: ${useCaseData.objective || ''}
DOMINIOS SELECCIONADOS: ${useCaseData.selectedDomains.join(', ')}
      `.trim();

      // Usar el endpoint de sugerencias AI del backend
      const response = await useCaseService.aiSuggestApis({
        domains: useCaseData.selectedDomains,
        useCaseContext
      });
      
      const aiData = (response.data as any).data;
      console.log('APIs sugeridas por backend:', aiData);

      if (aiData?.suggestedApis && aiData.suggestedApis.length > 0) {
        // Convertir las APIs del backend al formato esperado por el frontend
        const convertedGroups = convertBackendApisToGroups(aiData.suggestedApis, useCaseData.selectedDomains);
        setDomainGroups(convertedGroups);
        setExpandedDomains(new Set(convertedGroups.map(group => group.domain)));
        
        // Seleccionar todas las APIs sugeridas por IA
        const recommendedApis = convertedGroups.flatMap(group => 
          group.apis.map(api => api.id)
        );
        setSelectedApis(recommendedApis);
        setShowAnalysis(true);
        
        console.log('APIs del backend aplicadas exitosamente:', recommendedApis);
        alert(`✨ Se aplicaron ${aiData.suggestedApis.length} APIs sugeridas por IA para todos los dominios seleccionados`);
      } else {
        throw new Error('No se recibieron APIs válidas del backend');
      }
    } catch (error) {
      console.error('Error obteniendo APIs del backend:', error);
      alert('Error al obtener sugerencias de APIs con IA. Se usarán sugerencias locales.');
      throw error; // Re-throw para que el caller maneje el fallback
    } finally {
      setIsGettingApiSuggestions(false);
    }
  };

  // Función para convertir APIs del backend al formato del frontend
  const convertBackendApisToGroups = (backendApis: any[], domains: string[]): DomainApisGroup[] => {
    const groups: DomainApisGroup[] = [];

    // Agrupar APIs por dominio
    const apisByDomain = domains.reduce((acc, domain) => {
      acc[domain] = backendApis.filter(api => api.domain === domain);
      return acc;
    }, {} as Record<string, any[]>);

    for (const domain of domains) {
      const domainApis = apisByDomain[domain] || [];
      
      if (domainApis.length > 0) {
        const convertedApis: ApiRecommendation[] = domainApis.map((api, index) => ({
          id: `${domain.toLowerCase().replace(/\s+/g, '-')}-${index}`,
          name: api.name,
          domain: api.domain,
          description: api.reason || api.description || `API para ${api.domain}`,
          recommended: true, // Todas las APIs del backend son recomendadas
          confidence: 0.9, // Alta confianza ya que vienen de IA
          reason: api.reason || `Sugerido por IA para el dominio ${api.domain}`,
          methods: [
            {
              method: 'GET',
              endpoint: `/${api.name.toLowerCase().replace(/\s+/g, '-')}`,
              description: `Obtener información de ${api.name}`
            },
            {
              method: 'POST',
              endpoint: `/${api.name.toLowerCase().replace(/\s+/g, '-')}`,
              description: `Crear/Iniciar ${api.name}`
            }
          ]
        }));

        groups.push({
          domain,
          apis: convertedApis
        });
      }
    }

    return groups;
  };

  const generateApiGroups = (domains: string[], useCaseData: any): DomainApisGroup[] => {
    const groups: DomainApisGroup[] = [];

    for (const domain of domains) {
      const domainApis = getDomainApis(domain, useCaseData);
      if (domainApis.length > 0) {
        groups.push({
          domain,
          apis: domainApis.sort((a, b) => b.confidence - a.confidence)
        });
      }
    }

    return groups;
  };

  const getDomainApis = (domain: string, useCaseData: any): ApiRecommendation[] => {
    const textLower = `${useCaseData.title} ${useCaseData.description} ${useCaseData.objective}`.toLowerCase();
    
    const domainApiMap: Record<string, ApiRecommendation[]> = {
      'Customer Management': [
        {
          id: 'customer-directory',
          name: 'Customer Directory',
          domain: 'Customer Management',
          description: 'Gestión del directorio de clientes y sus datos básicos',
          recommended: textLower.includes('cliente') || textLower.includes('customer'),
          confidence: 0.9,
          reason: 'Esencial para gestionar información básica de clientes',
          methods: [
            {
              method: 'GET',
              endpoint: '/customer-directory/{customer-id}',
              description: 'Obtener información del cliente',
              parameters: [
                { name: 'customer-id', type: 'string', required: true, description: 'ID único del cliente' }
              ]
            },
            {
              method: 'POST',
              endpoint: '/customer-directory',
              description: 'Crear nuevo cliente',
              requestBody: {
                customerName: 'string',
                contactDetails: 'object',
                identificationDocuments: 'array'
              }
            },
            {
              method: 'PUT',
              endpoint: '/customer-directory/{customer-id}',
              description: 'Actualizar información del cliente'
            }
          ]
        },
        {
          id: 'customer-relationship',
          name: 'Customer Relationship Management',
          domain: 'Customer Management',
          description: 'Gestión de relaciones y segmentación de clientes',
          recommended: textLower.includes('relación') || textLower.includes('segmento'),
          confidence: 0.7,
          reason: 'Útil para gestionar relaciones comerciales con clientes',
          methods: [
            {
              method: 'GET',
              endpoint: '/customer-relationship/{customer-id}/profile',
              description: 'Obtener perfil de relación del cliente'
            },
            {
              method: 'POST',
              endpoint: '/customer-relationship/{customer-id}/segment',
              description: 'Asignar segmento al cliente'
            }
          ]
        },
        {
          id: 'customer-behavioral-insights',
          name: 'Customer Behavioral Insights',
          domain: 'Customer Management',
          description: 'Análisis de comportamiento y patrones de clientes',
          recommended: textLower.includes('análisis') || textLower.includes('comportamiento'),
          confidence: 0.6,
          reason: 'Proporciona insights sobre el comportamiento del cliente',
          methods: [
            {
              method: 'GET',
              endpoint: '/customer-behavioral-insights/{customer-id}/analysis',
              description: 'Obtener análisis de comportamiento del cliente'
            }
          ]
        }
      ],
      'Product Management': [
        {
          id: 'product-directory',
          name: 'Product Directory',
          domain: 'Product Management',
          description: 'Catálogo de productos y servicios bancarios',
          recommended: textLower.includes('producto') || textLower.includes('servicio'),
          confidence: 0.9,
          reason: 'Esencial para gestionar el catálogo de productos',
          methods: [
            {
              method: 'GET',
              endpoint: '/product-directory',
              description: 'Listar productos disponibles',
              parameters: [
                { name: 'category', type: 'string', required: false, description: 'Categoría de producto' }
              ]
            },
            {
              method: 'GET',
              endpoint: '/product-directory/{product-id}',
              description: 'Obtener detalles del producto'
            }
          ]
        },
        {
          id: 'product-design',
          name: 'Product Design',
          domain: 'Product Management',
          description: 'Diseño y configuración de productos bancarios',
          recommended: textLower.includes('diseño') || textLower.includes('configuración'),
          confidence: 0.7,
          reason: 'Necesario para diseñar y configurar productos',
          methods: [
            {
              method: 'POST',
              endpoint: '/product-design',
              description: 'Crear nuevo diseño de producto'
            },
            {
              method: 'PUT',
              endpoint: '/product-design/{product-id}',
              description: 'Actualizar diseño de producto'
            }
          ]
        }
      ],
      'Customer Offer': [
        {
          id: 'customer-offer',
          name: 'Customer Offer',
          domain: 'Customer Offer',
          description: 'Gestión de ofertas personalizadas para clientes',
          recommended: textLower.includes('oferta') || textLower.includes('propuesta'),
          confidence: 0.8,
          reason: 'Esencial para crear ofertas personalizadas',
          methods: [
            {
              method: 'POST',
              endpoint: '/customer-offer',
              description: 'Crear nueva oferta para cliente'
            },
            {
              method: 'GET',
              endpoint: '/customer-offer/{customer-id}',
              description: 'Obtener ofertas del cliente'
            }
          ]
        }
      ],
      'Customer Agreement': [
        {
          id: 'customer-agreement',
          name: 'Customer Agreement',
          domain: 'Customer Agreement',
          description: 'Gestión de contratos y acuerdos con clientes',
          recommended: textLower.includes('contrato') || textLower.includes('acuerdo'),
          confidence: 0.85,
          reason: 'Necesario para formalizar acuerdos comerciales',
          methods: [
            {
              method: 'POST',
              endpoint: '/customer-agreement',
              description: 'Crear nuevo acuerdo',
              requestBody: {
                customerId: 'string',
                productId: 'string',
                terms: 'object'
              }
            },
            {
              method: 'GET',
              endpoint: '/customer-agreement/{agreement-id}',
              description: 'Obtener detalles del acuerdo'
            },
            {
              method: 'PUT',
              endpoint: '/customer-agreement/{agreement-id}/status',
              description: 'Actualizar estado del acuerdo'
            }
          ]
        }
      ],
      'Payment Order': [
        {
          id: 'payment-order-initiate',
          name: 'Payment Order - Initiate',
          domain: 'Payment Order',
          description: 'Iniciar nueva orden de pago',
          recommended: textLower.includes('pago') || textLower.includes('transferencia'),
          confidence: 0.9,
          reason: 'Esencial para procesar órdenes de pago',
          methods: [
            {
              method: 'POST',
              endpoint: '/payment-order/initiate',
              description: 'Crear orden de pago',
              requestBody: {
                payerAccount: 'string',
                payeeAccount: 'string',
                amount: 'number',
                currency: 'string'
              }
            },
            {
              method: 'GET',
              endpoint: '/payment-order/initiate',
              description: 'Listar órdenes de pago'
            },
            {
              method: 'PUT',
              endpoint: '/payment-order/initiate/{order-id}',
              description: 'Actualizar orden de pago'
            }
          ]
        },
        {
          id: 'payment-order-retrieve',
          name: 'Payment Order - Retrieve',
          domain: 'Payment Order',
          description: 'Consultar estado de orden de pago',
          recommended: textLower.includes('consulta') || textLower.includes('estado'),
          confidence: 0.8,
          reason: 'Necesario para consultar el estado de pagos',
          methods: [
            {
              method: 'GET',
              endpoint: '/payment-order/{payment-order-id}/retrieve',
              description: 'Consultar estado de la orden',
              parameters: [
                { name: 'payment-order-id', type: 'string', required: true, description: 'ID de la orden de pago' }
              ]
            }
          ]
        },
        {
          id: 'payment-order-update',
          name: 'Payment Order - Update',
          domain: 'Payment Order',
          description: 'Actualizar orden de pago',
          recommended: textLower.includes('actualizar') || textLower.includes('modificar'),
          confidence: 0.7,
          reason: 'Útil para modificar órdenes de pago existentes',
          methods: [
            {
              method: 'PUT',
              endpoint: '/payment-order/{payment-order-id}/update',
              description: 'Actualizar orden de pago'
            }
          ]
        }
      ],
      'Payment Execution': [
        {
          id: 'payment-execution',
          name: 'Payment Execution',
          domain: 'Payment Execution',
          description: 'Ejecución y liquidación de pagos',
          recommended: textLower.includes('ejecución') || textLower.includes('liquidación'),
          confidence: 0.8,
          reason: 'Necesario para ejecutar pagos',
          methods: [
            {
              method: 'POST',
              endpoint: '/payment-execution',
              description: 'Ejecutar pago'
            },
            {
              method: 'GET',
              endpoint: '/payment-execution/{execution-id}',
              description: 'Consultar estado de ejecución'
            }
          ]
        }
      ],
      'Credit Management': [
        {
          id: 'credit-facility',
          name: 'Credit Facility',
          domain: 'Credit Management',
          description: 'Gestión de facilidades crediticias',
          recommended: textLower.includes('crédito') || textLower.includes('préstamo'),
          confidence: 0.8,
          reason: 'Necesario para gestionar productos crediticios',
          methods: [
            {
              method: 'POST',
              endpoint: '/credit-facility',
              description: 'Solicitar facilidad crediticia'
            },
            {
              method: 'GET',
              endpoint: '/credit-facility/{facility-id}/terms',
              description: 'Obtener términos del crédito'
            }
          ]
        }
      ],
      'Loan': [
        {
          id: 'loan',
          name: 'Loan',
          domain: 'Loan',
          description: 'Gestión del ciclo de vida de préstamos',
          recommended: textLower.includes('préstamo') || textLower.includes('loan'),
          confidence: 0.9,
          reason: 'Esencial para gestionar préstamos',
          methods: [
            {
              method: 'POST',
              endpoint: '/loan',
              description: 'Crear nuevo préstamo'
            },
            {
              method: 'GET',
              endpoint: '/loan/{loan-id}',
              description: 'Obtener detalles del préstamo'
            },
            {
              method: 'PUT',
              endpoint: '/loan/{loan-id}/status',
              description: 'Actualizar estado del préstamo'
            }
          ]
        }
      ],
      'Card Transaction': [
        {
          id: 'card-transaction',
          name: 'Card Transaction',
          domain: 'Card Transaction',
          description: 'Procesamiento de transacciones con tarjetas',
          recommended: textLower.includes('tarjeta') || textLower.includes('card'),
          confidence: 0.8,
          reason: 'Necesario para procesar transacciones con tarjetas',
          methods: [
            {
              method: 'POST',
              endpoint: '/card-transaction',
              description: 'Procesar transacción con tarjeta'
            },
            {
              method: 'GET',
              endpoint: '/card-transaction/{transaction-id}',
              description: 'Consultar transacción'
            }
          ]
        }
      ]
    };

    return domainApiMap[domain] || [];
  };

  const toggleApi = (apiId: string) => {
    setSelectedApis(prev => 
      prev.includes(apiId) 
        ? prev.filter(id => id !== apiId)
        : [...prev, apiId]
    );
  };

  const toggleExpanded = (apiId: string) => {
    setExpandedApis(prev => {
      const newSet = new Set(prev);
      if (newSet.has(apiId)) {
        newSet.delete(apiId);
      } else {
        newSet.add(apiId);
      }
      return newSet;
    });
  };

  const toggleDomainExpanded = (domain: string) => {
    setExpandedDomains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domain)) {
        newSet.delete(domain);
      } else {
        newSet.add(domain);
      }
      return newSet;
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = () => {
    if (selectedApis.length === 0) {
      alert('Por favor selecciona al menos una API');
      return;
    }

    selectApisMutation.mutate(selectedApis);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando caso de uso...</p>
        </div>
      </div>
    );
  }

  const useCaseData = useCase?.data?.data as any;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/use-cases/${id}/select-domains`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Dominios
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seleccionar APIs Semánticas</h1>
              <p className="mt-2 text-gray-600">
                Caso de uso: <span className="font-medium">{useCaseData?.title}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => getBackendApiSuggestions(useCaseData)}
                disabled={isGettingApiSuggestions || !useCaseData?.selectedDomains?.length}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                {isGettingApiSuggestions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analizando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    ✨ Sugerir APIs con IA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Análisis en progreso */}
        {isAnalyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <div>
                <h3 className="text-lg font-medium text-blue-900">Analizando APIs...</h3>
                <p className="text-blue-700">Analizando dominios para recomendar APIs relevantes.</p>
              </div>
            </div>
          </div>
        )}

        {/* APIs por Dominio */}
        {showAnalysis && domainGroups.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center mb-6">
                <Brain className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">APIs por Dominio BIAN</h2>
              </div>

              <div className="space-y-6">
                {domainGroups.map((group) => (
                  <div key={group.domain} className="border border-gray-200 rounded-lg">
                    {/* Header del Dominio */}
                    <div 
                      className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleDomainExpanded(group.domain)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">{group.domain}</h3>
                          <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                            {group.apis.length} API{group.apis.length !== 1 ? 's' : ''}
                          </span>
                          <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {group.apis.filter(api => selectedApis.includes(api.id)).length} seleccionada{group.apis.filter(api => selectedApis.includes(api.id)).length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {expandedDomains.has(group.domain) ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* APIs del Dominio */}
                    {expandedDomains.has(group.domain) && (
                      <div className="p-4 space-y-4">
                        {group.apis.map((api) => (
                          <div
                            key={api.id}
                            className={`border rounded-lg transition-all ${
                              selectedApis.includes(api.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start flex-1">
                                  <div className="flex items-center mr-4">
                                    <div
                                      className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center cursor-pointer ${
                                        selectedApis.includes(api.id)
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-300'
                                      }`}
                                      onClick={() => toggleApi(api.id)}
                                    >
                                      {selectedApis.includes(api.id) && (
                                        <CheckCircle className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                      <h4 className="font-medium text-gray-900 mr-3">{api.name}</h4>
                                      {api.recommended && (
                                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded">
                                          Recomendada
                                        </span>
                                      )}
                                      <div className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                        api.confidence > 0.7 ? 'bg-green-100 text-green-800' :
                                        api.confidence > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {Math.round(api.confidence * 100)}%
                                      </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-2">{api.description}</p>
                                    <p className="text-sm text-blue-600 mb-2">{api.reason}</p>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center text-sm text-gray-500">
                                        <Code className="h-4 w-4 mr-1" />
                                        {api.methods.length} método{api.methods.length !== 1 ? 's' : ''} disponible{api.methods.length !== 1 ? 's' : ''}
                                      </div>
                                      <button
                                        onClick={() => navigate(`/use-case/${id}/api/${encodeURIComponent(api.name)}`)}
                                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                      >
                                        📖 Ver Documentación
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => toggleExpanded(api.id)}
                                  className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                                >
                                  {expandedApis.has(api.id) ? (
                                    <ChevronDown className="h-5 w-5" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Detalles expandidos de la API */}
                            {expandedApis.has(api.id) && (
                              <div className="border-t border-gray-200 p-4 bg-gray-50">
                                <h5 className="font-medium text-gray-900 mb-3">Métodos y Endpoints</h5>
                                <div className="space-y-3">
                                  {api.methods.map((method: ApiMethod, index: number) => (
                                    <div key={index} className="bg-white rounded-lg p-3 border">
                                      <div className="flex items-center mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium mr-3 ${getMethodColor(method.method)}`}>
                                          {method.method}
                                        </span>
                                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                          {method.endpoint}
                                        </code>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                                      
                                      {method.parameters && method.parameters.length > 0 && (
                                        <div className="mt-2">
                                          <h6 className="text-xs font-medium text-gray-700 mb-1">Parámetros:</h6>
                                          <div className="space-y-1">
                                            {method.parameters.map((param, paramIndex) => (
                                              <div key={paramIndex} className="text-xs text-gray-600">
                                                <code className="bg-gray-100 px-1 rounded">{param.name}</code>
                                                <span className="mx-1">({param.type})</span>
                                                {param.required && <span className="text-red-600">*</span>}
                                                {param.description && <span className="ml-1">- {param.description}</span>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {method.requestBody && (
                                        <div className="mt-2">
                                          <h6 className="text-xs font-medium text-gray-700 mb-1">Request Body:</h6>
                                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                            {JSON.stringify(method.requestBody, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de APIs Seleccionadas */}
            {selectedApis.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Resumen de APIs Seleccionadas ({selectedApis.length})
                </h3>
                <div className="space-y-3">
                  {domainGroups.map((group) => {
                    const selectedInDomain = group.apis.filter(api => selectedApis.includes(api.id));
                    if (selectedInDomain.length === 0) return null;
                    
                    return (
                      <div key={group.domain} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{group.domain}</h4>
                        <div className="space-y-2">
                          {selectedInDomain.map((api) => (
                            <div key={api.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                              <div>
                                <span className="font-medium text-blue-900">{api.name}</span>
                                <span className="ml-2 text-sm text-blue-600">
                                  ({api.methods.length} método{api.methods.length !== 1 ? 's' : ''})
                                </span>
                              </div>
                              <button
                                onClick={() => toggleApi(api.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => navigate(`/use-cases/${id}/select-domains`)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Volver a Dominios
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedApis.length === 0 || selectApisMutation.isPending}
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {selectApisMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Finalizar Selección ({selectedApis.length} APIs)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectApisPage; 