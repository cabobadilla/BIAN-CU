import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Save, FileText, Plus, Trash2, Users, Target, CheckSquare, GitBranch, Shield, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useCaseService } from '../services/api';

interface FlowStep {
  step: number;
  actor: string;
  action: string;
  description: string;
}

interface AlternativeFlow {
  name: string;
  condition: string;
  steps: FlowStep[];
}

const CreateUseCasePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Campos básicos
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  
  // Actores
  const [primaryActors, setPrimaryActors] = useState<string[]>(['']);
  const [secondaryActors, setSecondaryActors] = useState<string[]>(['']);
  const [systemActors, setSystemActors] = useState<string[]>(['']);
  
  // Flujos
  const [prerequisites, setPrerequisites] = useState<string[]>(['']);
  const [mainFlow, setMainFlow] = useState<FlowStep[]>([
    { step: 1, actor: '', action: '', description: '' }
  ]);
  const [alternativeFlows, setAlternativeFlows] = useState<AlternativeFlow[]>([]);
  const [postconditions, setPostconditions] = useState<string[]>(['']);
  
  // Reglas y restricciones
  const [businessRules, setBusinessRules] = useState<string[]>(['']);
  const [assumptions, setAssumptions] = useState<string[]>(['']);
  const [constraints, setConstraints] = useState<string[]>(['']);
  
  // Metadatos
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedEffort, setEstimatedEffort] = useState('');
  
  // Requisitos no funcionales
  const [performance, setPerformance] = useState('');
  const [security, setSecurity] = useState('');
  const [usability, setUsability] = useState('');
  const [availability, setAvailability] = useState('');

  // Estados para análisis IA
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Estados para sugerencias de contenido AI
  const [showContentSuggestions, setShowContentSuggestions] = useState(false);
  const [contentSuggestions, setContentSuggestions] = useState<any>(null);
  const [isGettingContentSuggestions, setIsGettingContentSuggestions] = useState(false);

  const createMutation = useMutation({
    mutationFn: useCaseService.create,
    onSuccess: (response) => {
      console.log('Caso de uso creado exitosamente:', response.data);
      // La respuesta viene en response.data.data según la estructura de la API
      const useCaseData = (response.data as any).data;
      const useCaseId = useCaseData?._id;
      if (useCaseId) {
        console.log('Navegando a selección de dominios para caso de uso:', useCaseId);
        navigate(`/use-cases/${useCaseId}/select-domains`);
      } else {
        console.error('No se recibió ID del caso de uso creado. Estructura de respuesta:', response.data);
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      console.error('Error creando caso de uso:', error);
      alert('Error al crear el caso de uso. Por favor intenta de nuevo.');
    },
  });

  // Funciones auxiliares para manejar arrays
  const addToArray = (array: string[], setArray: (arr: string[]) => void) => {
    setArray([...array, '']);
  };

  const removeFromArray = (array: string[], setArray: (arr: string[]) => void, index: number) => {
    setArray(array.filter((_, i) => i !== index));
  };

  const updateArrayItem = (array: string[], setArray: (arr: string[]) => void, index: number, value: string) => {
    const newArray = [...array];
    newArray[index] = value;
    setArray(newArray);
  };

  // Funciones para manejar flujo principal
  const addMainFlowStep = () => {
    setMainFlow([...mainFlow, { step: mainFlow.length + 1, actor: '', action: '', description: '' }]);
  };

  const removeMainFlowStep = (index: number) => {
    const newFlow = mainFlow.filter((_, i) => i !== index);
    // Renumerar pasos
    const renumberedFlow = newFlow.map((step, i) => ({ ...step, step: i + 1 }));
    setMainFlow(renumberedFlow);
  };

  const updateMainFlowStep = (index: number, field: keyof FlowStep, value: string | number) => {
    const newFlow = [...mainFlow];
    newFlow[index] = { ...newFlow[index], [field]: value };
    setMainFlow(newFlow);
  };

  // Función para analizar con IA
  const handleAnalyzeWithAI = async () => {
    if (!title.trim() || !description.trim() || !objective.trim()) {
      alert('Por favor completa al menos el título, descripción y objetivo antes de analizar');
      return;
    }

    setIsAnalyzing(true);
    try {
      const useCaseData = {
        title: title.trim(),
        description: description.trim(),
        objective: objective.trim(),
        actors: {
          primary: primaryActors.filter(a => a.trim()),
          secondary: secondaryActors.filter(a => a.trim()),
          systems: systemActors.filter(a => a.trim())
        },
        prerequisites: prerequisites.filter(p => p.trim()),
        mainFlow: mainFlow.filter(s => s.description.trim()),
        postconditions: postconditions.filter(p => p.trim()),
        businessRules: businessRules.filter(r => r.trim())
      };

      const response = await useCaseService.analyzeWithAI(useCaseData);
      setAiSuggestions((response.data as any).data);
      setShowAiAnalysis(true);
    } catch (error) {
      console.error('Error analizando con IA:', error);
      alert('Error al analizar el caso de uso con IA. Por favor intenta de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Función para obtener sugerencias de contenido AI
  const handleGetContentSuggestions = async () => {
    if (!title.trim()) {
      alert('Por favor ingresa al menos un título para obtener sugerencias');
      return;
    }

    setIsGettingContentSuggestions(true);
    try {
      const response = await useCaseService.aiSuggestContent({
        title: title.trim(),
        description: description.trim() || undefined,
        objective: objective.trim() || undefined
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

  // Función para aplicar sugerencias de contenido
  const applyContentSuggestions = () => {
    if (!contentSuggestions) return;

    // Aplicar sugerencias a los campos
    if (contentSuggestions.suggestedTitle) setTitle(contentSuggestions.suggestedTitle);
    if (contentSuggestions.suggestedDescription) setDescription(contentSuggestions.suggestedDescription);
    if (contentSuggestions.suggestedObjective) setObjective(contentSuggestions.suggestedObjective);
    
    if (contentSuggestions.suggestedActors) {
      if (contentSuggestions.suggestedActors.primary) setPrimaryActors([...contentSuggestions.suggestedActors.primary, '']);
      if (contentSuggestions.suggestedActors.secondary) setSecondaryActors([...contentSuggestions.suggestedActors.secondary, '']);
      if (contentSuggestions.suggestedActors.systems) setSystemActors([...contentSuggestions.suggestedActors.systems, '']);
    }

    if (contentSuggestions.suggestedPrerequisites) {
      setPrerequisites([...contentSuggestions.suggestedPrerequisites, '']);
    }

    if (contentSuggestions.suggestedMainFlow) {
      setMainFlow([...contentSuggestions.suggestedMainFlow]);
    }

    if (contentSuggestions.suggestedPostconditions) {
      setPostconditions([...contentSuggestions.suggestedPostconditions, '']);
    }

    if (contentSuggestions.suggestedBusinessRules) {
      setBusinessRules([...contentSuggestions.suggestedBusinessRules, '']);
    }

    setShowContentSuggestions(false);
    setContentSuggestions(null);
  };

  // Función para aplicar sugerencias de IA
  const applySuggestions = () => {
    if (!aiSuggestions) return;

    // Aplicar sugerencias a los campos
    if (aiSuggestions.improvedTitle) setTitle(aiSuggestions.improvedTitle);
    if (aiSuggestions.improvedDescription) setDescription(aiSuggestions.improvedDescription);
    if (aiSuggestions.improvedObjective) setObjective(aiSuggestions.improvedObjective);
    
    if (aiSuggestions.suggestedActors) {
      if (aiSuggestions.suggestedActors.primary) setPrimaryActors([...aiSuggestions.suggestedActors.primary, '']);
      if (aiSuggestions.suggestedActors.secondary) setSecondaryActors([...aiSuggestions.suggestedActors.secondary, '']);
      if (aiSuggestions.suggestedActors.systems) setSystemActors([...aiSuggestions.suggestedActors.systems, '']);
    }

    if (aiSuggestions.suggestedPrerequisites) {
      setPrerequisites([...aiSuggestions.suggestedPrerequisites, '']);
    }

    if (aiSuggestions.suggestedPostconditions) {
      setPostconditions([...aiSuggestions.suggestedPostconditions, '']);
    }

    if (aiSuggestions.suggestedBusinessRules) {
      setBusinessRules([...aiSuggestions.suggestedBusinessRules, '']);
    }

    setShowAiAnalysis(false);
    setAiSuggestions(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !objective.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Construir el texto original estructurado para análisis de IA
    const structuredText = `
TÍTULO: ${title}

OBJETIVO: ${objective}

DESCRIPCIÓN: ${description}

ACTORES PRIMARIOS: ${primaryActors.filter(a => a.trim()).join(', ')}
ACTORES SECUNDARIOS: ${secondaryActors.filter(a => a.trim()).join(', ')}
SISTEMAS: ${systemActors.filter(a => a.trim()).join(', ')}

PRERREQUISITOS:
${prerequisites.filter(p => p.trim()).map((p, i) => `${i + 1}. ${p}`).join('\n')}

FLUJO PRINCIPAL:
${mainFlow.filter(s => s.description.trim()).map(s => `${s.step}. ${s.actor}: ${s.action} - ${s.description}`).join('\n')}

POSTCONDICIONES:
${postconditions.filter(p => p.trim()).map((p, i) => `${i + 1}. ${p}`).join('\n')}

REGLAS DE NEGOCIO:
${businessRules.filter(r => r.trim()).map((r, i) => `${i + 1}. ${r}`).join('\n')}

PRIORIDAD: ${priority}
COMPLEJIDAD: ${complexity}
${estimatedEffort ? `ESFUERZO ESTIMADO: ${estimatedEffort}` : ''}

${performance ? `RENDIMIENTO: ${performance}` : ''}
${security ? `SEGURIDAD: ${security}` : ''}
${usability ? `USABILIDAD: ${usability}` : ''}
${availability ? `DISPONIBILIDAD: ${availability}` : ''}
    `.trim();

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      originalText: structuredText,
      objective: objective.trim(),
      actors: {
        primary: primaryActors.filter(a => a.trim()),
        secondary: secondaryActors.filter(a => a.trim()),
        systems: systemActors.filter(a => a.trim())
      },
      prerequisites: prerequisites.filter(p => p.trim()),
      mainFlow: mainFlow.filter(s => s.description.trim()),
      alternativeFlows,
      postconditions: postconditions.filter(p => p.trim()),
      businessRules: businessRules.filter(r => r.trim()),
      nonFunctionalRequirements: {
        performance: performance.trim() || undefined,
        security: security.trim() || undefined,
        usability: usability.trim() || undefined,
        availability: availability.trim() || undefined
      },
      assumptions: assumptions.filter(a => a.trim()),
      constraints: constraints.filter(c => c.trim()),
      priority,
      complexity,
      estimatedEffort: estimatedEffort.trim() || undefined
    });
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Caso de Uso</h1>
          <p className="mt-2 text-gray-600">
            Define un caso de uso bancario estructurado para análisis con BIAN v13
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Información Básica */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Información Básica</h2>
              </div>
              <button
                type="button"
                onClick={handleGetContentSuggestions}
                disabled={isGettingContentSuggestions || !title.trim()}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGettingContentSuggestions ? (
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
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Caso de Uso *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Proceso de Apertura de Cuenta Corriente"
                  required
                />
              </div>

              <div>
                <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivo del Caso de Uso *
                </label>
                <textarea
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="¿Qué se busca lograr con este caso de uso?"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción General *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe brevemente el caso de uso..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="complexity" className="block text-sm font-medium text-gray-700 mb-2">
                    Complejidad
                  </label>
                  <select
                    id="complexity"
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="estimatedEffort" className="block text-sm font-medium text-gray-700 mb-2">
                    Esfuerzo Estimado
                  </label>
                  <input
                    type="text"
                    id="estimatedEffort"
                    value={estimatedEffort}
                    onChange={(e) => setEstimatedEffort(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 2 semanas, 40 horas"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actores */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Actores</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Actores Primarios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actores Primarios
                </label>
                {primaryActors.map((actor, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={actor}
                      onChange={(e) => updateArrayItem(primaryActors, setPrimaryActors, index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Cliente, Ejecutivo de cuenta"
                    />
                    {primaryActors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFromArray(primaryActors, setPrimaryActors, index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addToArray(primaryActors, setPrimaryActors)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar actor primario
                </button>
              </div>

              {/* Actores Secundarios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actores Secundarios
                </label>
                {secondaryActors.map((actor, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={actor}
                      onChange={(e) => updateArrayItem(secondaryActors, setSecondaryActors, index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Supervisor, Auditor"
                    />
                    {secondaryActors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFromArray(secondaryActors, setSecondaryActors, index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addToArray(secondaryActors, setSecondaryActors)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar actor secundario
                </button>
              </div>

              {/* Sistemas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sistemas Involucrados
                </label>
                {systemActors.map((system, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={system}
                      onChange={(e) => updateArrayItem(systemActors, setSystemActors, index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Core Banking, CRM, Sistema de Riesgo"
                    />
                    {systemActors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFromArray(systemActors, setSystemActors, index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addToArray(systemActors, setSystemActors)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar sistema
                </button>
              </div>
            </div>
          </div>

          {/* Prerrequisitos */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-6">
              <CheckSquare className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Prerrequisitos</h2>
            </div>
            
            {prerequisites.map((prereq, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={prereq}
                  onChange={(e) => updateArrayItem(prerequisites, setPrerequisites, index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Cliente debe estar autenticado, Cuenta debe existir"
                />
                {prerequisites.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFromArray(prerequisites, setPrerequisites, index)}
                    className="ml-2 p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addToArray(prerequisites, setPrerequisites)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar prerrequisito
            </button>
          </div>

          {/* Flujo Principal */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-6">
              <GitBranch className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Flujo Principal</h2>
            </div>
            
            {mainFlow.map((step, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Paso</label>
                  <input
                    type="number"
                    value={step.step}
                    onChange={(e) => updateMainFlowStep(index, 'step', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Actor</label>
                  <input
                    type="text"
                    value={step.actor}
                    onChange={(e) => updateMainFlowStep(index, 'actor', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Cliente"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Acción</label>
                  <input
                    type="text"
                    value={step.action}
                    onChange={(e) => updateMainFlowStep(index, 'action', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Solicita"
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={step.description}
                    onChange={(e) => updateMainFlowStep(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Descripción detallada del paso"
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  {mainFlow.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMainFlowStep(index)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addMainFlowStep}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar paso
            </button>
          </div>

          {/* Postcondiciones */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Postcondiciones</h2>
            </div>
            
            {postconditions.map((postcond, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={postcond}
                  onChange={(e) => updateArrayItem(postconditions, setPostconditions, index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Cuenta creada exitosamente, Cliente notificado"
                />
                {postconditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFromArray(postconditions, setPostconditions, index)}
                    className="ml-2 p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addToArray(postconditions, setPostconditions)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar postcondición
            </button>
          </div>

          {/* Reglas de Negocio */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Reglas de Negocio y Restricciones</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reglas de Negocio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reglas de Negocio
                </label>
                {businessRules.map((rule, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => updateArrayItem(businessRules, setBusinessRules, index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Monto mínimo $1000"
                    />
                    {businessRules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFromArray(businessRules, setBusinessRules, index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addToArray(businessRules, setBusinessRules)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar regla
                </button>
              </div>

              {/* Supuestos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supuestos
                </label>
                {assumptions.map((assumption, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={assumption}
                      onChange={(e) => updateArrayItem(assumptions, setAssumptions, index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Sistema disponible 24/7"
                    />
                    {assumptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFromArray(assumptions, setAssumptions, index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addToArray(assumptions, setAssumptions)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar supuesto
                </button>
              </div>

              {/* Restricciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restricciones
                </label>
                {constraints.map((constraint, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={constraint}
                      onChange={(e) => updateArrayItem(constraints, setConstraints, index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Solo horario bancario"
                    />
                    {constraints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFromArray(constraints, setConstraints, index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addToArray(constraints, setConstraints)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar restricción
                </button>
              </div>
            </div>
          </div>

          {/* Requisitos No Funcionales */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Requisitos No Funcionales</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="performance" className="block text-sm font-medium text-gray-700 mb-2">
                  Rendimiento
                </label>
                <input
                  type="text"
                  id="performance"
                  value={performance}
                  onChange={(e) => setPerformance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Respuesta < 2 segundos"
                />
              </div>

              <div>
                <label htmlFor="security" className="block text-sm font-medium text-gray-700 mb-2">
                  Seguridad
                </label>
                <input
                  type="text"
                  id="security"
                  value={security}
                  onChange={(e) => setSecurity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Encriptación SSL, Autenticación 2FA"
                />
              </div>

              <div>
                <label htmlFor="usability" className="block text-sm font-medium text-gray-700 mb-2">
                  Usabilidad
                </label>
                <input
                  type="text"
                  id="usability"
                  value={usability}
                  onChange={(e) => setUsability(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Interfaz intuitiva, máximo 3 clics"
                />
              </div>

              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                  Disponibilidad
                </label>
                <input
                  type="text"
                  id="availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 99.9% uptime, 24/7"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing}
              className="px-6 py-3 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analizar con IA
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Caso de Uso
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal de Sugerencias de Contenido AI */}
        {showContentSuggestions && contentSuggestions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Sparkles className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Sugerencias de Contenido AI</h3>
                  </div>
                  <button
                    onClick={() => setShowContentSuggestions(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información Básica Sugerida */}
                  <div className="grid grid-cols-1 gap-6">
                    {contentSuggestions.suggestedTitle && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Título Sugerido</h4>
                        <p className="text-sm text-gray-600 mb-2">Actual: {title}</p>
                        <p className="text-sm text-green-600 font-medium">Sugerido: {contentSuggestions.suggestedTitle}</p>
                      </div>
                    )}

                    {contentSuggestions.suggestedDescription && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Descripción Sugerida</h4>
                        <p className="text-sm text-gray-600 mb-2">Actual: {description || 'No especificada'}</p>
                        <p className="text-sm text-green-600">{contentSuggestions.suggestedDescription}</p>
                      </div>
                    )}

                    {contentSuggestions.suggestedObjective && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Objetivo Sugerido</h4>
                        <p className="text-sm text-gray-600 mb-2">Actual: {objective || 'No especificado'}</p>
                        <p className="text-sm text-green-600">{contentSuggestions.suggestedObjective}</p>
                      </div>
                    )}
                  </div>

                  {/* Actores Sugeridos */}
                  {contentSuggestions.suggestedActors && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Actores Sugeridos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {contentSuggestions.suggestedActors.primary && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Primarios</h5>
                            <ul className="text-sm text-green-600 space-y-1">
                              {contentSuggestions.suggestedActors.primary.map((actor: string, index: number) => (
                                <li key={index}>• {actor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {contentSuggestions.suggestedActors.secondary && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Secundarios</h5>
                            <ul className="text-sm text-green-600 space-y-1">
                              {contentSuggestions.suggestedActors.secondary.map((actor: string, index: number) => (
                                <li key={index}>• {actor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {contentSuggestions.suggestedActors.systems && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Sistemas</h5>
                            <ul className="text-sm text-green-600 space-y-1">
                              {contentSuggestions.suggestedActors.systems.map((system: string, index: number) => (
                                <li key={index}>• {system}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prerrequisitos Sugeridos */}
                  {contentSuggestions.suggestedPrerequisites && contentSuggestions.suggestedPrerequisites.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Prerrequisitos Sugeridos</h4>
                      <ul className="text-sm text-green-600 space-y-1">
                        {contentSuggestions.suggestedPrerequisites.map((prereq: string, index: number) => (
                          <li key={index}>• {prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Flujo Principal Sugerido */}
                  {contentSuggestions.suggestedMainFlow && contentSuggestions.suggestedMainFlow.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Flujo Principal Sugerido</h4>
                      <div className="space-y-2">
                        {contentSuggestions.suggestedMainFlow.map((step: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-gray-700">{step.step}. {step.actor}:</span>
                            <span className="text-green-600 ml-2">{step.action} - {step.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Postcondiciones Sugeridas */}
                  {contentSuggestions.suggestedPostconditions && contentSuggestions.suggestedPostconditions.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Postcondiciones Sugeridas</h4>
                      <ul className="text-sm text-green-600 space-y-1">
                        {contentSuggestions.suggestedPostconditions.map((post: string, index: number) => (
                          <li key={index}>• {post}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reglas de Negocio Sugeridas */}
                  {contentSuggestions.suggestedBusinessRules && contentSuggestions.suggestedBusinessRules.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Reglas de Negocio Sugeridas</h4>
                      <ul className="text-sm text-green-600 space-y-1">
                        {contentSuggestions.suggestedBusinessRules.map((rule: string, index: number) => (
                          <li key={index}>• {rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Nivel de Confianza */}
                  {contentSuggestions.confidence && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Nivel de Confianza</h4>
                      <div className="flex items-center">
                        <div className="flex-1 bg-blue-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${contentSuggestions.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-blue-800 font-medium">
                          {Math.round(contentSuggestions.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowContentSuggestions(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Rechazar Sugerencias
                  </button>
                  <button
                    onClick={applyContentSuggestions}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aplicar Sugerencias
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Sugerencias IA */}
        {showAiAnalysis && aiSuggestions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Sparkles className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Sugerencias de IA</h3>
                  </div>
                  <button
                    onClick={() => setShowAiAnalysis(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Análisis General */}
                  {aiSuggestions.analysis && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Análisis General</h4>
                      <p className="text-blue-800">{aiSuggestions.analysis}</p>
                    </div>
                  )}

                  {/* Mejoras Sugeridas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiSuggestions.improvedTitle && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Título Mejorado</h4>
                        <p className="text-sm text-gray-600 mb-2">Actual: {title}</p>
                        <p className="text-sm text-green-600">Sugerido: {aiSuggestions.improvedTitle}</p>
                      </div>
                    )}

                    {aiSuggestions.improvedDescription && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Descripción Mejorada</h4>
                        <p className="text-sm text-gray-600 mb-2">Actual: {description}</p>
                        <p className="text-sm text-green-600">Sugerido: {aiSuggestions.improvedDescription}</p>
                      </div>
                    )}

                    {aiSuggestions.improvedObjective && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Objetivo Mejorado</h4>
                        <p className="text-sm text-gray-600 mb-2">Actual: {objective}</p>
                        <p className="text-sm text-green-600">Sugerido: {aiSuggestions.improvedObjective}</p>
                      </div>
                    )}
                  </div>

                  {/* Sugerencias Adicionales */}
                  {aiSuggestions.suggestedActors && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Actores Sugeridos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {aiSuggestions.suggestedActors.primary && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Primarios</h5>
                            <ul className="text-sm text-green-600 space-y-1">
                              {aiSuggestions.suggestedActors.primary.map((actor: string, index: number) => (
                                <li key={index}>• {actor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiSuggestions.suggestedActors.secondary && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Secundarios</h5>
                            <ul className="text-sm text-green-600 space-y-1">
                              {aiSuggestions.suggestedActors.secondary.map((actor: string, index: number) => (
                                <li key={index}>• {actor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiSuggestions.suggestedActors.systems && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Sistemas</h5>
                            <ul className="text-sm text-green-600 space-y-1">
                              {aiSuggestions.suggestedActors.systems.map((system: string, index: number) => (
                                <li key={index}>• {system}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recomendaciones */}
                  {aiSuggestions.recommendations && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Recomendaciones</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {aiSuggestions.recommendations.map((rec: string, index: number) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowAiAnalysis(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Rechazar Sugerencias
                  </button>
                  <button
                    onClick={applySuggestions}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aplicar Sugerencias
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateUseCasePage; 