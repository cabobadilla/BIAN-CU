import React, { useState } from 'react';
import { 
  Play, 
  RefreshCw, 
  Copy, 
  Check, 
  AlertCircle, 
  Clock, 
  Globe,
  Code,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useCaseService } from '../services/api';

interface ApiTesterProps {
  useCaseId: string;
  apis: Array<{
    name: string;
    domain: string;
    description: string;
    endpoints: Array<{
      path: string;
      method: string;
      operation: string;
      description: string;
    }>;
  }>;
  className?: string;
}

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  responseTime?: number;
  headers?: Record<string, any>;
  data?: any;
  error?: {
    message: string;
    code: string;
    type: string;
  };
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    payload: any;
  };
  timestamp: string;
}

const ApiTester: React.FC<ApiTesterProps> = ({ useCaseId, apis, className = '' }) => {
  const [selectedApi, setSelectedApi] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [baseUrl, setBaseUrl] = useState('https://sandbox.bian.org/v13');
  const [headers, setHeaders] = useState<string>('{"Content-Type": "application/json"}');
  const [payload, setPayload] = useState<string>('{}');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const selectedApiData = apis.find(api => api.name === selectedApi);
  const selectedEndpointData = selectedApiData?.endpoints.find(ep => ep.path === selectedEndpoint);

  const handleApiChange = (apiName: string) => {
    setSelectedApi(apiName);
    setSelectedEndpoint('');
    setMethod('GET');
  };

  const handleEndpointChange = (endpointPath: string) => {
    setSelectedEndpoint(endpointPath);
    const endpoint = selectedApiData?.endpoints.find(ep => ep.path === endpointPath);
    if (endpoint) {
      setMethod(endpoint.method as 'GET' | 'POST' | 'PUT' | 'DELETE');
    }
  };

  const generateExamplePayload = () => {
    if (!selectedApiData) return '{}';

    const domain = selectedApiData.domain.toLowerCase();
    let examplePayload = {};

    if (domain.includes('customer')) {
      examplePayload = {
        customerReference: "CR123456",
        customerData: {
          name: "Juan Pérez",
          email: "juan.perez@example.com",
          phone: "+1234567890"
        }
      };
    } else if (domain.includes('account')) {
      examplePayload = {
        accountReference: "AC789012",
        accountType: "Savings",
        currency: "USD",
        balance: 1000.00
      };
    } else if (domain.includes('transaction')) {
      examplePayload = {
        transactionReference: "TX345678",
        amount: 500.00,
        currency: "USD",
        fromAccount: "AC789012",
        toAccount: "AC789013"
      };
    } else {
      examplePayload = {
        reference: "REF123456",
        data: {},
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    }

    setPayload(JSON.stringify(examplePayload, null, 2));
  };

  const handleTest = async () => {
    if (!selectedApi || !selectedEndpoint) {
      alert('Por favor selecciona una API y un endpoint');
      return;
    }

    setTesting(true);
    
    try {
      let parsedHeaders = {};
      let parsedPayload = null;

      // Parsear headers
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
        alert('Headers JSON inválido');
        setTesting(false);
        return;
      }

      // Parsear payload para métodos que lo requieren
      if (method !== 'GET' && payload.trim()) {
        try {
          parsedPayload = JSON.parse(payload);
        } catch (e) {
          alert('Payload JSON inválido');
          setTesting(false);
          return;
        }
      }

      const response = await useCaseService.testApi(useCaseId, {
        apiName: selectedApi,
        endpoint: selectedEndpoint,
        method,
        payload: parsedPayload,
        headers: parsedHeaders,
        baseUrl
      });

      if (response.data.success) {
        setResults(prev => [response.data.data, ...prev]);
      }
    } catch (error: any) {
      console.error('Error testing API:', error);
      alert('Error al ejecutar test de API');
    } finally {
      setTesting(false);
    }
  };

  const toggleResultExpansion = (index: number) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResults(newExpanded);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-red-500';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white ${className}`}>
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
          <Play className="h-5 w-5 mr-2" />
          API Tester
        </h3>
        <p className="text-sm text-gray-600">
          Prueba las APIs de tu caso de uso en tiempo real
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Configuración del test */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selección de API y Endpoint */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API
              </label>
              <select
                value={selectedApi}
                onChange={(e) => handleApiChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar API...</option>
                {apis.map((api) => (
                  <option key={api.name} value={api.name}>
                    {api.name} ({api.domain})
                  </option>
                ))}
              </select>
            </div>

            {selectedApiData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint
                </label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => handleEndpointChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar endpoint...</option>
                  {selectedApiData.endpoints.map((endpoint, index) => (
                    <option key={index} value={endpoint.path}>
                      {endpoint.method} {endpoint.path} - {endpoint.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedEndpointData && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Operación:</strong> {selectedEndpointData.operation || 'N/A'}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedEndpointData.description}
                </p>
              </div>
            )}
          </div>

          {/* Configuración de request */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servidor Base
                </label>
                <select
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="https://sandbox.bian.org/v13">Sandbox BIAN</option>
                  <option value="https://api.bian.org/v13">Producción BIAN</option>
                  <option value="">Custom...</option>
                </select>
              </div>
            </div>

            {baseUrl === '' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Base Personalizada
                </label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.ejemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Headers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Headers (JSON)
          </label>
          <textarea
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder='{"Authorization": "Bearer token", "X-API-Key": "key"}'
          />
        </div>

        {/* Payload para métodos POST/PUT */}
        {method !== 'GET' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Payload (JSON)
              </label>
              <button
                onClick={generateExamplePayload}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Generar ejemplo
              </button>
            </div>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="{}"
            />
          </div>
        )}

        {/* Botón de test */}
        <div className="flex justify-center">
          <button
            onClick={handleTest}
            disabled={testing || !selectedApi || !selectedEndpoint}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Play className="h-5 w-5 mr-2" />
            )}
            {testing ? 'Ejecutando...' : 'Ejecutar Test'}
          </button>
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Resultados ({results.length})
            </h4>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleResultExpansion(index)}
                  >
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(result.request.method)}`}>
                        {result.request.method}
                      </span>
                      
                      <span className={`font-medium ${getStatusColor(result.status)}`}>
                        {result.success ? (
                          `${result.status} ${result.statusText}`
                        ) : (
                          `Error: ${result.error?.message}`
                        )}
                      </span>
                      
                      {result.responseTime && (
                        <span className="text-sm text-gray-600">
                          {result.responseTime}ms
                        </span>
                      )}
                      
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {expandedResults.has(index) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {expandedResults.has(index) && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Request */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">Request</h5>
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(result.request, null, 2), index * 2)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              {copiedIndex === index * 2 ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.request, null, 2)}
                          </pre>
                        </div>
                        
                        {/* Response */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">Response</h5>
                            <button
                              onClick={() => copyToClipboard(
                                JSON.stringify(result.success ? result.data : result.error, null, 2), 
                                index * 2 + 1
                              )}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              {copiedIndex === index * 2 + 1 ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.success ? result.data : result.error, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      {/* Headers de respuesta */}
                      {result.headers && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900 mb-2">Response Headers</h5>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.headers, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTester; 