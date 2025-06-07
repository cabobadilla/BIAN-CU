import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useCaseService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface FormData {
  title: string;
  description: string;
  originalText: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  originalText?: string;
}

const CreateUseCasePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    originalText: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPreview, setShowPreview] = useState(false);

  // Mutación para crear caso de uso
  const createUseCaseMutation = useMutation({
    mutationFn: (data: FormData) => useCaseService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['useCases'] });
      const useCaseId = (response.data.data as { _id: string })._id;
      navigate(`/use-cases/${useCaseId}`);
    },
    onError: (error: unknown) => {
      console.error('Error creating use case:', error);
    },
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.length < 5) {
      newErrors.title = 'El título debe tener al menos 5 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length < 20) {
      newErrors.description = 'La descripción debe tener al menos 20 caracteres';
    }

    if (!formData.originalText.trim()) {
      newErrors.originalText = 'El texto del caso de uso es requerido';
    } else if (formData.originalText.length < 50) {
      newErrors.originalText = 'El texto debe tener al menos 50 caracteres para un análisis efectivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createUseCaseMutation.mutate(formData);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const exampleUseCases = [
    {
      title: "Apertura de Cuenta Corriente Digital",
      description: "Proceso completo de apertura de cuenta corriente a través de canales digitales",
      text: "Un cliente desea abrir una cuenta corriente de forma digital. El proceso debe incluir la verificación de identidad, validación de documentos, evaluación de riesgo crediticio, configuración de productos asociados como tarjetas de débito, y la activación de servicios de banca en línea. El sistema debe integrar con bureaus de crédito, validar documentos de identidad, y cumplir con regulaciones KYC y AML."
    },
    {
      title: "Procesamiento de Pagos Internacionales",
      description: "Gestión de transferencias internacionales con cumplimiento regulatorio",
      text: "El banco necesita procesar transferencias internacionales de clientes corporativos. El proceso incluye validación de beneficiarios, verificación de sanciones internacionales, cálculo de comisiones y tipos de cambio, enrutamiento a través de redes SWIFT, seguimiento en tiempo real, y notificaciones automáticas. Debe cumplir con regulaciones FATCA, CRS y normativas locales de divisas."
    }
  ];

  const loadExample = (example: typeof exampleUseCases[0]) => {
    setFormData({
      title: example.title,
      description: example.description,
      originalText: example.text,
    });
    setErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Caso de Uso</h1>
          <p className="text-gray-600 mt-1">
            Describe tu caso de uso bancario y obtén análisis con IA
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título del Caso de Uso *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Apertura de Cuenta Corriente Digital"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Breve *
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Descripción concisa del caso de uso..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Texto completo */}
            <div>
              <label htmlFor="originalText" className="block text-sm font-medium text-gray-700 mb-2">
                Texto Completo del Caso de Uso *
              </label>
              <textarea
                id="originalText"
                rows={8}
                value={formData.originalText}
                onChange={(e) => handleInputChange('originalText', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.originalText ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe detalladamente el caso de uso, incluyendo procesos, actores involucrados, requisitos técnicos y de negocio..."
              />
              {errors.originalText && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.originalText}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Caracteres: {formData.originalText.length} (mínimo 50 recomendado)
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleGoBack}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {showPreview ? 'Ocultar' : 'Vista Previa'}
              </button>
              <button
                type="submit"
                disabled={createUseCaseMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {createUseCaseMutation.isPending ? (
                  <>
                    <LoadingSpinner />
                    Creando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Crear y Analizar con IA
                  </>
                )}
              </button>
            </div>

            {/* Mensaje de éxito/error */}
            {createUseCaseMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error al crear el caso de uso</span>
                </div>
                <p className="text-red-700 mt-1">
                  Por favor, verifica los datos e intenta nuevamente.
                </p>
              </div>
            )}
          </form>

          {/* Vista previa */}
          {showPreview && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{formData.title || 'Sin título'}</h4>
                  <p className="text-gray-600 mt-1">{formData.description || 'Sin descripción'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Texto completo:</h5>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {formData.originalText || 'Sin contenido'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Información */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Análisis con IA</h3>
            </div>
            <p className="text-blue-800 text-sm mb-4">
              Una vez creado, nuestro sistema analizará automáticamente tu caso de uso para:
            </p>
            <ul className="text-blue-800 text-sm space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Identificar entidades clave
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Sugerir dominios BIAN
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Recomendar APIs relevantes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Evaluar complejidad
              </li>
            </ul>
          </div>

          {/* Ejemplos */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Ejemplos de Casos de Uso</h3>
            <div className="space-y-4">
              {exampleUseCases.map((example, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{example.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                  <button
                    type="button"
                    onClick={() => loadExample(example)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Usar este ejemplo
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Consejos */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Consejos para un Mejor Análisis</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Incluye actores involucrados (clientes, empleados, sistemas)</li>
              <li>• Describe el flujo de procesos paso a paso</li>
              <li>• Menciona requisitos regulatorios específicos</li>
              <li>• Incluye integraciones con sistemas externos</li>
              <li>• Especifica datos y documentos necesarios</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUseCasePage; 