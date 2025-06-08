import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Database, Save, X, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { dataSourceService } from '../services/api';

interface DataSource {
  _id: string;
  name: string;
  description: string;
  type: 'REST_API' | 'DATABASE' | 'FILE' | 'SOAP' | 'GRAPHQL';
  connectionConfig: {
    apiUrl?: string;
    method?: string;
    headers?: Record<string, string>;
    authentication?: {
      type: 'none' | 'bearer' | 'basic' | 'api_key';
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const DataSourcesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'REST_API' as const,
    apiUrl: '',
    method: 'GET',
    headers: '{}',
    authType: 'none' as const,
    token: '',
    username: '',
    password: '',
    apiKey: ''
  });

  // Obtener todas las fuentes de datos
  const { data: dataSources, isLoading } = useQuery({
    queryKey: ['dataSources'],
    queryFn: () => dataSourceService.getAll(),
  });

  // Mutation para crear fuente de datos
  const createMutation = useMutation({
    mutationFn: dataSourceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
      resetForm();
      setIsCreating(false);
    },
  });

  // Mutation para actualizar fuente de datos
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => dataSourceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
      resetForm();
      setEditingDataSource(null);
    },
  });

  // Mutation para eliminar fuente de datos
  const deleteMutation = useMutation({
    mutationFn: dataSourceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
    },
  });

  // Mutation para probar conexión
  const testConnectionMutation = useMutation({
    mutationFn: dataSourceService.validateConnection,
    onSuccess: (response, variables) => {
      const dataSourceId = variables.dataSourceId;
      setTestResults(prev => ({
        ...prev,
        [dataSourceId]: { success: true, message: 'Conexión exitosa' }
      }));
      setTestingConnection(null);
    },
    onError: (error: any, variables) => {
      const dataSourceId = variables.dataSourceId;
      setTestResults(prev => ({
        ...prev,
        [dataSourceId]: { 
          success: false, 
          message: error.response?.data?.message || 'Error de conexión' 
        }
      }));
      setTestingConnection(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'REST_API',
      apiUrl: '',
      method: 'GET',
      headers: '{}',
      authType: 'none',
      token: '',
      username: '',
      password: '',
      apiKey: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const headers = formData.headers ? JSON.parse(formData.headers) : {};
      
      const dataSourceData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        connectionConfig: {
          apiUrl: formData.apiUrl,
          method: formData.method,
          headers,
          authentication: {
            type: formData.authType,
            ...(formData.authType === 'bearer' && { token: formData.token }),
            ...(formData.authType === 'basic' && { 
              username: formData.username, 
              password: formData.password 
            }),
            ...(formData.authType === 'api_key' && { apiKey: formData.apiKey }),
          }
        }
      };

      if (editingDataSource) {
        updateMutation.mutate({ id: editingDataSource._id, data: dataSourceData });
      } else {
        createMutation.mutate(dataSourceData);
      }
    } catch (error) {
      alert('Error en el formato JSON de los headers');
    }
  };

  const handleEdit = (dataSource: DataSource) => {
    setEditingDataSource(dataSource);
    setFormData({
      name: dataSource.name,
      description: dataSource.description,
      type: dataSource.type,
      apiUrl: dataSource.connectionConfig.apiUrl || '',
      method: dataSource.connectionConfig.method || 'GET',
      headers: JSON.stringify(dataSource.connectionConfig.headers || {}, null, 2),
      authType: dataSource.connectionConfig.authentication?.type || 'none',
      token: dataSource.connectionConfig.authentication?.token || '',
      username: dataSource.connectionConfig.authentication?.username || '',
      password: dataSource.connectionConfig.authentication?.password || '',
      apiKey: dataSource.connectionConfig.authentication?.apiKey || ''
    });
    setIsCreating(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta fuente de datos?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTestConnection = (dataSource: DataSource) => {
    setTestingConnection(dataSource._id);
    testConnectionMutation.mutate({
      dataSourceId: dataSource._id,
      apiUrl: dataSource.connectionConfig.apiUrl || '',
      method: dataSource.connectionConfig.method || 'GET',
      headers: dataSource.connectionConfig.headers,
      payload: {}
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Sistemas de Origen</h1>
            <p className="mt-2 text-gray-600">
              Administra las fuentes de datos que se utilizarán en los casos de uso
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nueva Fuente de Datos
          </button>
        </div>
      </div>

      {/* Formulario de creación/edición */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingDataSource ? 'Editar Fuente de Datos' : 'Crear Nueva Fuente de Datos'}
            </h2>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingDataSource(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="REST_API">REST API</option>
                  <option value="DATABASE">Base de Datos</option>
                  <option value="FILE">Archivo</option>
                  <option value="SOAP">SOAP</option>
                  <option value="GRAPHQL">GraphQL</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la API
                </label>
                <input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método HTTP
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Headers (JSON)
              </label>
              <textarea
                value={formData.headers}
                onChange={(e) => setFormData(prev => ({ ...prev, headers: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder='{"Content-Type": "application/json"}'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autenticación
              </label>
              <select
                value={formData.authType}
                onChange={(e) => setFormData(prev => ({ ...prev, authType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              >
                <option value="none">Sin autenticación</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="api_key">API Key</option>
              </select>

              {formData.authType === 'bearer' && (
                <input
                  type="text"
                  value={formData.token}
                  onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                  placeholder="Token de acceso"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {formData.authType === 'basic' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Usuario"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Contraseña"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {formData.authType === 'api_key' && (
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingDataSource ? 'Actualizar' : 'Crear'} Fuente de Datos
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de fuentes de datos */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Fuentes de Datos Existentes</h2>
        </div>
        
        {dataSources?.data?.data?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay fuentes de datos creadas aún</p>
            <p className="text-sm">Crea tu primera fuente de datos para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dataSources?.data?.data?.map((dataSource: DataSource) => (
              <div key={dataSource._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{dataSource.name}</h3>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {dataSource.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{dataSource.description}</p>
                    {dataSource.connectionConfig.apiUrl && (
                      <p className="text-sm text-gray-500 mb-2">
                        URL: {dataSource.connectionConfig.apiUrl}
                      </p>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500">
                        Creado: {new Date(dataSource.createdAt).toLocaleDateString()}
                      </div>
                      {testResults[dataSource._id] && (
                        <div className={`flex items-center gap-1 text-sm ${
                          testResults[dataSource._id].success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {testResults[dataSource._id].success ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {testResults[dataSource._id].message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleTestConnection(dataSource)}
                      disabled={testingConnection === dataSource._id}
                      className="text-green-600 hover:text-green-800 p-2"
                      title="Probar conexión"
                    >
                      <TestTube className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(dataSource)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dataSource._id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourcesPage; 