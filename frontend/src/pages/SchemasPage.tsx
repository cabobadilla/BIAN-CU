import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Code, Save, X, Sparkles } from 'lucide-react';
import { schemaService } from '../services/api';

interface Schema {
  _id: string;
  name: string;
  description: string;
  schema: any;
  createdAt: string;
  updatedAt: string;
}

const SchemasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingSchema, setEditingSchema] = useState<Schema | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schema: ''
  });

  // Obtener todos los schemas
  const { data: schemas, isLoading } = useQuery({
    queryKey: ['schemas'],
    queryFn: () => schemaService.getAll(),
  });

  // Mutation para crear schema
  const createMutation = useMutation({
    mutationFn: schemaService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      resetForm();
      setIsCreating(false);
    },
  });

  // Mutation para actualizar schema
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => schemaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      resetForm();
      setEditingSchema(null);
    },
  });

  // Mutation para eliminar schema
  const deleteMutation = useMutation({
    mutationFn: schemaService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
    },
  });

  // Mutation para generar schema con IA
  const generateMutation = useMutation({
    mutationFn: ({ description }: { description: string }) => 
      schemaService.generate(description),
    onSuccess: (response) => {
      const generatedSchema = (response.data as any).data;
      setFormData(prev => ({
        ...prev,
        schema: JSON.stringify(generatedSchema, null, 2)
      }));
      setShowJsonEditor(true);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', schema: '' });
    setShowJsonEditor(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const schemaData = {
        name: formData.name,
        description: formData.description,
        schema: formData.schema ? JSON.parse(formData.schema) : {}
      };

      if (editingSchema) {
        updateMutation.mutate({ id: editingSchema._id, data: schemaData });
      } else {
        createMutation.mutate(schemaData);
      }
    } catch (error) {
      alert('Error en el formato JSON del schema');
    }
  };

  const handleEdit = (schema: Schema) => {
    setEditingSchema(schema);
    setFormData({
      name: schema.name,
      description: schema.description,
      schema: JSON.stringify(schema.schema, null, 2)
    });
    setIsCreating(true);
    setShowJsonEditor(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este schema?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleGenerateWithAI = () => {
    if (!formData.description.trim()) {
      alert('Por favor ingresa una descripción para generar el schema');
      return;
    }
    generateMutation.mutate({ description: formData.description });
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Schemas</h1>
            <p className="mt-2 text-gray-600">
              Administra los schemas de datos que se utilizarán en los casos de uso
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nuevo Schema
          </button>
        </div>
      </div>

      {/* Formulario de creación/edición */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingSchema ? 'Editar Schema' : 'Crear Nuevo Schema'}
            </h2>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingSchema(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Schema
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
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={generateMutation.isPending}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 flex items-center gap-1"
                >
                  <Sparkles className="h-4 w-4" />
                  {generateMutation.isPending ? 'Generando...' : 'Generar con IA'}
                </button>
              </div>
            </div>

            {showJsonEditor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schema JSON
                </label>
                <textarea
                  value={formData.schema}
                  onChange={(e) => setFormData(prev => ({ ...prev, schema: e.target.value }))}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Ingresa el schema en formato JSON"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingSchema ? 'Actualizar' : 'Crear'} Schema
              </button>
              
              {!showJsonEditor && (
                <button
                  type="button"
                  onClick={() => setShowJsonEditor(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  Editor JSON
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Lista de schemas */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Schemas Existentes</h2>
        </div>
        
        {schemas?.data?.data?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay schemas creados aún</p>
            <p className="text-sm">Crea tu primer schema para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {schemas?.data?.data?.map((schema: Schema) => (
              <div key={schema._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{schema.name}</h3>
                    <p className="text-gray-600 mt-1">{schema.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      Creado: {new Date(schema.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(schema)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(schema._id)}
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

export default SchemasPage; 