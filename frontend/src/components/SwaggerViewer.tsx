import React, { useState, useEffect } from 'react';
// @ts-ignore - swagger-ui-react no tiene tipos disponibles
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { 
  Download, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  FileText,
  Settings,
  CheckCircle
} from 'lucide-react';
import { useCaseService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface SwaggerViewerProps {
  useCaseId: string;
  className?: string;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

const SwaggerViewer: React.FC<SwaggerViewerProps> = ({ useCaseId, className = '' }) => {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [activeServer, setActiveServer] = useState<string>('');

  useEffect(() => {
    loadOpenApiSpec();
  }, [useCaseId]);

  const loadOpenApiSpec = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await useCaseService.getOpenApiSpec(useCaseId);
      
      if (response.data.success) {
        setSpec(response.data.data);
        setValidation((response.data as any).validation);
        
        // Establecer el primer servidor como activo por defecto
        if (response.data.data.servers && response.data.data.servers.length > 0) {
          setActiveServer(response.data.data.servers[0].url);
        }
      } else {
        setError('No se pudo cargar la especificación OpenAPI');
      }
    } catch (err: any) {
      console.error('Error loading OpenAPI spec:', err);
      setError(err.response?.data?.message || 'Error cargando especificación OpenAPI');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSpec = () => {
    if (!spec) return;

    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spec.info.title.replace(/[^a-zA-Z0-9]/g, '_')}_openapi.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenInSwaggerEditor = () => {
    if (!spec) return;

    const specJson = encodeURIComponent(JSON.stringify(spec));
    const swaggerEditorUrl = `https://editor.swagger.io/?url=data:application/json,${specJson}`;
    window.open(swaggerEditorUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Generando documentación API...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar documentación</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadOpenApiSpec}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay APIs disponibles</h3>
        <p className="text-gray-600">
          Primero selecciona APIs en la pestaña anterior para generar la documentación.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      {/* Header con controles */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Documentación API
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {spec.info.title} - {spec.info.version}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Indicador de validación */}
            {validation && (
              <div className={`flex items-center text-sm ${
                validation.valid ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {validation.valid ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-1" />
                )}
                {validation.valid ? 'Válida' : `${validation.errors.length} advertencias`}
              </div>
            )}

            {/* Botones de acción */}
            <button
              onClick={handleDownloadSpec}
              className="inline-flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Descargar especificación"
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar
            </button>
            
            <button
              onClick={handleOpenInSwaggerEditor}
              className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Abrir en Swagger Editor"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Editor
            </button>

            <button
              onClick={loadOpenApiSpec}
              className="inline-flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title="Regenerar documentación"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Selector de servidor */}
        {spec.servers && spec.servers.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="server-select" className="text-sm font-medium text-gray-700">
              Servidor:
            </label>
            <select
              id="server-select"
              value={activeServer}
              onChange={(e) => setActiveServer(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              {spec.servers.map((server, index) => (
                <option key={index} value={server.url}>
                  {server.description} ({server.url})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Advertencias de validación */}
        {validation && !validation.valid && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Advertencias de validación:
            </h4>
            <ul className="mt-1 text-xs text-yellow-700 list-disc list-inside">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Visor Swagger UI */}
      <div className="swagger-ui-container">
        <SwaggerUI
          spec={spec}
          deepLinking={true}
          displayOperationId={false}
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          docExpansion="list"
          filter={false}
          showExtensions={false}
          showCommonExtensions={false}
          supportedSubmitMethods={['get', 'post', 'put', 'delete']}
          tryItOutEnabled={true}
          requestInterceptor={(request: any) => {
            // Interceptar requests para logging
            console.log('Swagger UI Request:', request);
            return request;
          }}
          responseInterceptor={(response: any) => {
            // Interceptar responses para logging
            console.log('Swagger UI Response:', response);
            return response;
          }}
          onComplete={() => {
            console.log('Swagger UI loaded successfully');
          }}
        />
      </div>

      {/* Estilos en línea para Swagger UI */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .swagger-ui-container {
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .swagger-ui .topbar {
            display: none;
          }
          .swagger-ui .info {
            margin: 20px 0;
          }
          .swagger-ui .scheme-container {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 10px;
            margin: 20px 0;
          }
          .swagger-ui .btn.try-out__btn {
            background: #3b82f6;
            border-color: #3b82f6;
          }
          .swagger-ui .btn.try-out__btn:hover {
            background: #2563eb;
            border-color: #2563eb;
          }
          .swagger-ui .opblock.opblock-get .opblock-summary-method {
            background: #10b981;
          }
          .swagger-ui .opblock.opblock-post .opblock-summary-method {
            background: #3b82f6;
          }
          .swagger-ui .opblock.opblock-put .opblock-summary-method {
            background: #f59e0b;
          }
          .swagger-ui .opblock.opblock-delete .opblock-summary-method {
            background: #ef4444;
          }
        `
      }} />
    </div>
  );
};

export default SwaggerViewer; 