import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, CheckCircle, XCircle, AlertCircle, Save, Brain } from 'lucide-react';
import { useCaseService } from '../services/api';

interface DomainRecommendation {
  domain: string;
  reason: string;
  confidence: number;
  selected: boolean;
}

const SelectDomainsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<DomainRecommendation[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Estados para sugerencias AI de dominios
  const [isGettingDomainSuggestions, setIsGettingDomainSuggestions] = useState(false);

  // Obtener el caso de uso
  const { data: useCase, isLoading } = useQuery({
    queryKey: ['useCase', id],
    queryFn: () => useCaseService.getById(id!),
    enabled: !!id,
  });

  // Mutation para seleccionar dominios
  const selectDomainsMutation = useMutation({
    mutationFn: (domains: string[]) => useCaseService.selectDomains(id!, domains),
    onSuccess: () => {
      navigate(`/use-cases/${id}/select-apis`);
    },
    onError: (error) => {
      console.error('Error seleccionando dominios:', error);
      alert('Error al seleccionar dominios. Por favor intenta de nuevo.');
    },
  });

  // Obtener recomendaciones de dominios al cargar la página
  useEffect(() => {
    if (useCase?.data?.data) {
      analyzeForDomains();
    }
  }, [useCase]);

  const analyzeForDomains = async () => {
    if (!useCase?.data?.data) return;

    setIsAnalyzing(true);
    try {
             // Construir texto para análisis
       const useCaseData = useCase.data.data as any;
       const analysisText = `
TÍTULO: ${useCaseData?.title || ''}
OBJETIVO: ${useCaseData?.objective || ''}
DESCRIPCIÓN: ${useCaseData?.description || ''}
ACTORES: ${useCaseData?.actors?.primary?.join(', ') || ''}
PRERREQUISITOS: ${useCaseData?.prerequisites?.join(', ') || ''}
FLUJO PRINCIPAL: ${useCaseData?.mainFlow?.map((s: any) => `${s.step}. ${s.description}`).join(', ') || ''}
       `.trim();

      // Obtener recomendaciones de dominios desde la API
      const response = await useCaseService.recommendDomains(analysisText);
      const aiRecommendations = (response.data as any).data;
      
      // Combinar con recomendaciones locales
      const domainRecommendations = generateDomainRecommendations(analysisText, aiRecommendations);
      
      setRecommendations(domainRecommendations);
      setSelectedDomains(domainRecommendations.filter(d => d.selected).map(d => d.domain));
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error analizando dominios:', error);
      alert('Error al analizar dominios. Por favor intenta de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Función para forzar sugerencias AI de dominios
  const handleGetDomainSuggestions = async () => {
    if (!useCase?.data?.data) {
      alert('No se encontró información del caso de uso');
      return;
    }

    setIsGettingDomainSuggestions(true);
    try {
      const useCaseData = useCase.data.data as any;
      const analysisText = `
TÍTULO: ${useCaseData?.title || ''}
OBJETIVO: ${useCaseData?.objective || ''}
DESCRIPCIÓN: ${useCaseData?.description || ''}
ACTORES: ${useCaseData?.actors?.primary?.join(', ') || ''}
PRERREQUISITOS: ${useCaseData?.prerequisites?.join(', ') || ''}
FLUJO PRINCIPAL: ${useCaseData?.mainFlow?.map((s: any) => `${s.step}. ${s.description}`).join(', ') || ''}
      `.trim();

      // Obtener recomendaciones de dominios desde la API
      const response = await useCaseService.recommendDomains(analysisText);
      const aiRecommendations = (response.data as any).data;
      
      // Generar recomendaciones con mayor peso en AI
      const domainRecommendations = generateDomainRecommendations(analysisText, aiRecommendations);
      
      setRecommendations(domainRecommendations);
      setSelectedDomains(domainRecommendations.filter(d => d.selected).map(d => d.domain));
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error obteniendo sugerencias de dominios:', error);
      alert('Error al obtener sugerencias de dominios. Por favor intenta de nuevo.');
    } finally {
      setIsGettingDomainSuggestions(false);
    }
  };

  const generateDomainRecommendations = (text: string, aiRecommendations?: any): DomainRecommendation[] => {
    const textLower = text.toLowerCase();
    const allDomains = [
      {
        domain: 'Customer Management',
        keywords: ['cliente', 'customer', 'usuario', 'persona'],
        reason: 'Gestión de información y relaciones con clientes'
      },
      {
        domain: 'Product Management',
        keywords: ['producto', 'product', 'cuenta', 'account', 'servicio'],
        reason: 'Gestión del catálogo de productos bancarios'
      },
      {
        domain: 'Customer Agreement',
        keywords: ['contrato', 'agreement', 'acuerdo', 'términos', 'condiciones'],
        reason: 'Gestión de contratos y acuerdos con clientes'
      },
      {
        domain: 'Payment Order',
        keywords: ['pago', 'payment', 'transferencia', 'orden'],
        reason: 'Procesamiento de órdenes de pago'
      },
      {
        domain: 'Payment Execution',
        keywords: ['ejecución', 'execution', 'procesamiento', 'transacción'],
        reason: 'Ejecución de pagos y transacciones'
      },
      {
        domain: 'Credit Management',
        keywords: ['crédito', 'credit', 'préstamo', 'loan', 'financiamiento'],
        reason: 'Gestión de productos crediticios'
      },
      {
        domain: 'Risk Management',
        keywords: ['riesgo', 'risk', 'evaluación', 'análisis'],
        reason: 'Evaluación y gestión de riesgos'
      },
      {
        domain: 'Compliance',
        keywords: ['cumplimiento', 'compliance', 'regulación', 'normativa'],
        reason: 'Cumplimiento regulatorio y normativo'
      },
      {
        domain: 'Fraud Detection',
        keywords: ['fraude', 'fraud', 'detección', 'seguridad'],
        reason: 'Detección y prevención de fraudes'
      },
      {
        domain: 'Customer Position',
        keywords: ['posición', 'position', 'saldo', 'balance'],
        reason: 'Gestión de posiciones y saldos de clientes'
      }
    ];

    // Si tenemos recomendaciones de IA, usarlas como base
    if (aiRecommendations?.suggestedDomains) {
      const aiDomains = aiRecommendations.suggestedDomains.map((domain: string) => ({
        domain,
        reason: aiRecommendations.reasoning || 'Recomendado por análisis de IA',
        confidence: aiRecommendations.confidence || 0.8,
        selected: true
      }));

      // Agregar dominios adicionales basados en palabras clave
      const additionalDomains = allDomains
        .filter(d => !aiRecommendations.suggestedDomains.includes(d.domain))
        .map(domain => {
          const matchCount = domain.keywords.filter(keyword => 
            textLower.includes(keyword)
          ).length;
          
          const confidence = Math.min(0.7, matchCount * 0.2 + 0.1);
          const selected = confidence > 0.5;

          return {
            domain: domain.domain,
            reason: domain.reason,
            confidence,
            selected
          };
        })
        .filter(d => d.confidence > 0.2)
        .slice(0, 4); // Máximo 4 dominios adicionales

      return [...aiDomains, ...additionalDomains]
        .sort((a, b) => b.confidence - a.confidence);
    }

    // Fallback: usar solo análisis de palabras clave
    return allDomains.map(domain => {
      const matchCount = domain.keywords.filter(keyword => 
        textLower.includes(keyword)
      ).length;
      
      const confidence = Math.min(0.9, matchCount * 0.3 + 0.1);
      const selected = confidence > 0.4;

      return {
        domain: domain.domain,
        reason: domain.reason,
        confidence,
        selected
      };
    }).filter(d => d.confidence > 0.1)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8); // Mostrar máximo 8 dominios
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev => 
      prev.includes(domain) 
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const handleSubmit = () => {
    if (selectedDomains.length === 0) {
      alert('Por favor selecciona al menos un dominio BIAN');
      return;
    }

    selectDomainsMutation.mutate(selectedDomains);
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
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Seleccionar Dominios BIAN</h1>
          <p className="mt-2 text-gray-600">
            Caso de uso: <span className="font-medium">{useCaseData?.title}</span>
          </p>
        </div>

        {/* Análisis en progreso */}
        {isAnalyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <div>
                <h3 className="text-lg font-medium text-blue-900">Analizando con IA...</h3>
                <p className="text-blue-700">ChatGPT está analizando tu caso de uso para recomendar dominios BIAN relevantes.</p>
              </div>
            </div>
          </div>
        )}

        {/* Recomendaciones de IA */}
        {showAnalysis && recommendations.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Dominios Recomendados por IA</h2>
              </div>
              <button
                type="button"
                onClick={handleGetDomainSuggestions}
                disabled={isGettingDomainSuggestions}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGettingDomainSuggestions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Sugerir con AI
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.domain}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDomains.includes(rec.domain)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleDomain(rec.domain)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        selectedDomains.includes(rec.domain)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedDomains.includes(rec.domain) && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900">{rec.domain}</h3>
                    </div>
                    <div className="flex items-center">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.confidence > 0.7 ? 'bg-green-100 text-green-800' :
                        rec.confidence > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {Math.round(rec.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                  
                  {rec.selected && (
                    <div className="flex items-center text-sm text-blue-600">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Recomendado por IA
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Recomendación</h4>
                  <p className="text-sm text-yellow-800">
                    Los dominios preseleccionados son sugerencias basadas en el análisis de tu caso de uso. 
                    Puedes modificar la selección según tus necesidades específicas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de selección */}
        {selectedDomains.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Dominios Seleccionados ({selectedDomains.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {domain}
                  <button
                    onClick={() => toggleDomain(domain)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate(`/use-cases/${id}`)}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedDomains.length === 0 || selectDomainsMutation.isPending}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {selectDomainsMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Confirmar Dominios y Continuar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectDomainsPage; 