import OpenAI from 'openai';
import { logger } from '../utils/logger';

class OpenAIService {
  private openai: OpenAI | null = null;

  constructor() {
    // No inicializar OpenAI en el constructor para evitar crash al importar
  }

  private initializeOpenAI() {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '...........') {
        throw new Error('OPENAI_API_KEY no está configurada correctamente');
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  async analyzeUseCase(originalText: string) {
    try {
      const openai = this.initializeOpenAI();
      const prompt = `
Analiza el siguiente caso de uso bancario y extrae la información estructurada:

CASO DE USO:
${originalText}

Por favor, analiza y extrae:

1. OBJETIVOS DEL NEGOCIO: Lista los principales objetivos de negocio que se buscan alcanzar
2. ACTORES: Identifica todos los actores involucrados (clientes, empleados, sistemas, etc.)
3. EVENTOS: Lista los eventos principales que desencadenan el proceso
4. FLUJOS: Describe los flujos principales del proceso paso a paso
5. DOMINIOS BIAN SUGERIDOS: Sugiere qué dominios del estándar BIAN v13 serían más relevantes para este caso de uso

Responde en formato JSON con la siguiente estructura:
{
  "businessObjectives": ["objetivo1", "objetivo2", ...],
  "actors": ["actor1", "actor2", ...],
  "events": ["evento1", "evento2", ...],
  "flows": ["paso1", "paso2", ...],
  "suggestedDomains": ["dominio1", "dominio2", ...],
  "confidence": 0.85
}

El campo confidence debe ser un número entre 0 y 1 indicando tu confianza en el análisis.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en análisis de procesos bancarios y el estándar BIAN. Analiza casos de uso y extrae información estructurada.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      // Intentar parsear la respuesta JSON
      try {
        // Limpiar la respuesta de markdown si existe
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const analysis = JSON.parse(cleanResponse);
        
        // Validar estructura básica
        if (!analysis.businessObjectives || !analysis.actors || !analysis.events || 
            !analysis.flows || !analysis.suggestedDomains) {
          throw new Error('Estructura de respuesta inválida');
        }

        return {
          businessObjectives: analysis.businessObjectives || [],
          actors: analysis.actors || [],
          events: analysis.events || [],
          flows: analysis.flows || [],
          suggestedDomains: analysis.suggestedDomains || [],
          confidence: analysis.confidence || 0.5
        };

      } catch (parseError) {
        logger.error('Error parseando respuesta de OpenAI:', parseError);
        
        // Fallback: extraer información básica del texto
        return this.extractBasicInfo(originalText);
      }

    } catch (error) {
      logger.error('Error en análisis de OpenAI:', error);
      throw new Error('Error analizando el caso de uso con IA');
    }
  }

  async suggestBianDomains(useCaseText: string, existingAnalysis?: any) {
    try {
      const openai = this.initializeOpenAI();
      const prompt = `
Basándote en el siguiente caso de uso bancario, sugiere los dominios BIAN v13 más relevantes:

CASO DE USO:
${useCaseText}

${existingAnalysis ? `
ANÁLISIS PREVIO:
- Objetivos: ${existingAnalysis.businessObjectives?.join(', ')}
- Actores: ${existingAnalysis.actors?.join(', ')}
- Eventos: ${existingAnalysis.events?.join(', ')}
` : ''}

Los dominios BIAN v13 incluyen (entre otros):
- Customer Management
- Product Management
- Customer Offer
- Customer Agreement
- Customer Position
- Payment Order
- Payment Execution
- Card Transaction
- Credit Management
- Loan
- Deposit
- Investment Account
- Securities Position
- Market Analysis
- Risk Management
- Compliance
- Fraud Detection
- Customer Behavioral Insights
- Channel Activity Analysis

Responde con un JSON que contenga:
{
  "suggestedDomains": ["dominio1", "dominio2", ...],
  "reasoning": "Explicación de por qué estos dominios son relevantes",
  "confidence": 0.85
}
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en el estándar BIAN v13 para arquitectura bancaria. Sugiere dominios relevantes para casos de uso específicos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      // Limpiar la respuesta de markdown si existe
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const result = JSON.parse(cleanResponse);
      return result;

    } catch (error) {
      logger.error('Error sugiriendo dominios BIAN:', error);
      throw new Error('Error sugiriendo dominios BIAN');
    }
  }

  async generateCustomSchema(description: string, apiContext?: string) {
    try {
      const openai = this.initializeOpenAI();
      const prompt = `
Genera un schema JSON para el siguiente requerimiento:

DESCRIPCIÓN:
${description}

${apiContext ? `CONTEXTO DE API: ${apiContext}` : ''}

Crea un schema JSON Schema (draft-07) que incluya:
1. Propiedades relevantes para el caso de uso
2. Tipos de datos apropiados
3. Validaciones necesarias (required, pattern, etc.)
4. Descripciones claras para cada campo
5. Ejemplos cuando sea apropiado

Responde SOLO con un JSON válido que contenga:
{
  "schema": { ... }, // El JSON Schema generado
  "example": { ... }, // Un ejemplo de datos que cumplan el schema
  "description": "Descripción del schema generado"
}
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en diseño de APIs y schemas JSON. Genera schemas bien estructurados y validados.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      // Limpiar la respuesta de markdown si existe
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(cleanResponse);

    } catch (error) {
      logger.error('Error generando schema personalizado:', error);
      throw new Error('Error generando schema personalizado');
    }
  }

  async analyzeCaseForSuggestions(structuredText: string) {
    try {
      const openai = this.initializeOpenAI();
      const prompt = `
Analiza el siguiente caso de uso bancario y proporciona sugerencias de mejora:

CASO DE USO:
${structuredText}

Por favor, analiza el caso de uso y proporciona:

1. ANÁLISIS GENERAL: Una evaluación general del caso de uso
2. MEJORAS SUGERIDAS: Mejoras específicas para título, descripción y objetivo
3. ACTORES SUGERIDOS: Actores adicionales que podrían estar faltando
4. PRERREQUISITOS SUGERIDOS: Prerrequisitos adicionales importantes
5. POSTCONDICIONES SUGERIDAS: Postcondiciones que podrían faltar
6. REGLAS DE NEGOCIO SUGERIDAS: Reglas de negocio importantes
7. RECOMENDACIONES: Recomendaciones generales para mejorar el caso de uso

Responde en formato JSON con la siguiente estructura:
{
  "analysis": "Análisis general del caso de uso...",
  "improvedTitle": "Título mejorado (solo si es necesario)",
  "improvedDescription": "Descripción mejorada (solo si es necesario)",
  "improvedObjective": "Objetivo mejorado (solo si es necesario)",
  "suggestedActors": {
    "primary": ["actor1", "actor2"],
    "secondary": ["actor3", "actor4"],
    "systems": ["sistema1", "sistema2"]
  },
  "suggestedPrerequisites": ["prerequisito1", "prerequisito2"],
  "suggestedPostconditions": ["postcondicion1", "postcondicion2"],
  "suggestedBusinessRules": ["regla1", "regla2"],
  "recommendations": ["recomendacion1", "recomendacion2"],
  "confidence": 0.85
}

Solo incluye campos de mejora si realmente hay algo que mejorar. Si un campo está bien, no lo incluyas en la respuesta.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en análisis de casos de uso bancarios y metodologías de ingeniería de software. Proporciona sugerencias constructivas y específicas para mejorar casos de uso.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      // Limpiar la respuesta de markdown si existe
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const suggestions = JSON.parse(cleanResponse);
      
      return {
        analysis: suggestions.analysis || 'Análisis completado',
        improvedTitle: suggestions.improvedTitle || null,
        improvedDescription: suggestions.improvedDescription || null,
        improvedObjective: suggestions.improvedObjective || null,
        suggestedActors: suggestions.suggestedActors || null,
        suggestedPrerequisites: suggestions.suggestedPrerequisites || [],
        suggestedPostconditions: suggestions.suggestedPostconditions || [],
        suggestedBusinessRules: suggestions.suggestedBusinessRules || [],
        recommendations: suggestions.recommendations || [],
        confidence: suggestions.confidence || 0.5
      };

    } catch (error) {
      logger.error('Error analizando caso para sugerencias:', error);
      throw new Error('Error analizando el caso de uso para sugerencias');
    }
  }

  async suggestUseCaseContent(context: string) {
    try {
      const openai = this.initializeOpenAI();
      const prompt = `
Basándote en el siguiente contexto de caso de uso bancario, sugiere contenido mejorado para los campos:

CONTEXTO ACTUAL:
${context}

Por favor, analiza y sugiere mejoras para:

1. TÍTULO: Un título más descriptivo y profesional
2. DESCRIPCIÓN: Una descripción clara y completa del caso de uso
3. OBJETIVO: Un objetivo específico y medible
4. ACTORES: Actores principales, secundarios y sistemas involucrados
5. PRERREQUISITOS: Condiciones previas necesarias
6. FLUJO PRINCIPAL: Pasos principales del proceso
7. POSTCONDICIONES: Estados resultantes después del caso de uso
8. REGLAS DE NEGOCIO: Reglas importantes a considerar

Responde en formato JSON con la siguiente estructura:
{
  "suggestedTitle": "Título mejorado",
  "suggestedDescription": "Descripción detallada...",
  "suggestedObjective": "Objetivo específico...",
  "suggestedActors": {
    "primary": ["actor1", "actor2"],
    "secondary": ["actor3", "actor4"],
    "systems": ["sistema1", "sistema2"]
  },
  "suggestedPrerequisites": ["prerequisito1", "prerequisito2"],
  "suggestedMainFlow": [
    {"step": 1, "actor": "Cliente", "action": "Acción", "description": "Descripción"},
    {"step": 2, "actor": "Sistema", "action": "Acción", "description": "Descripción"}
  ],
  "suggestedPostconditions": ["postcondicion1", "postcondicion2"],
  "suggestedBusinessRules": ["regla1", "regla2"],
  "confidence": 0.85
}
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en análisis de procesos bancarios y casos de uso. Proporciona sugerencias detalladas y profesionales para mejorar la documentación de casos de uso.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      // Limpiar la respuesta de markdown si existe
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const suggestions = JSON.parse(cleanResponse);
      
      return {
        suggestedTitle: suggestions.suggestedTitle || null,
        suggestedDescription: suggestions.suggestedDescription || null,
        suggestedObjective: suggestions.suggestedObjective || null,
        suggestedActors: suggestions.suggestedActors || null,
        suggestedPrerequisites: suggestions.suggestedPrerequisites || [],
        suggestedMainFlow: suggestions.suggestedMainFlow || [],
        suggestedPostconditions: suggestions.suggestedPostconditions || [],
        suggestedBusinessRules: suggestions.suggestedBusinessRules || [],
        confidence: suggestions.confidence || 0.5
      };

    } catch (error) {
      logger.error('Error sugiriendo contenido de caso de uso:', error);
      throw new Error('Error sugiriendo contenido para el caso de uso');
    }
  }

  async suggestApisByDomain(domains: string[], useCaseContext: string) {
    try {
      const openai = this.initializeOpenAI();
      const prompt = `
Basándote en el siguiente caso de uso bancario y los dominios BIAN seleccionados, sugiere las APIs más relevantes para cada dominio:

CASO DE USO:
${useCaseContext}

DOMINIOS SELECCIONADOS:
${domains.join(', ')}

Para cada dominio, sugiere las APIs BIAN más relevantes considerando:
- El contexto específico del caso de uso
- Las operaciones típicas de cada dominio
- La integración entre dominios

APIs disponibles por dominio (ejemplos):

Customer Management:
- Customer Directory (gestión de datos básicos)
- Customer Relationship Management (relaciones y segmentación)
- Customer Behavioral Insights (análisis de comportamiento)

Product Management:
- Product Directory (catálogo de productos)
- Product Design (diseño y configuración)

Customer Offer:
- Customer Offer (ofertas personalizadas)

Customer Agreement:
- Customer Agreement (contratos y acuerdos)

Payment Order:
- Payment Order - Initiate (iniciar pagos)
- Payment Order - Retrieve (consultar pagos)
- Payment Order - Update (actualizar pagos)

Payment Execution:
- Payment Execution (ejecutar pagos)

Credit Management:
- Credit Facility (facilidades crediticias)

Loan:
- Loan (gestión de préstamos)

Card Transaction:
- Card Transaction (transacciones con tarjetas)

Responde en formato JSON con la siguiente estructura:
{
  "domainSuggestions": [
    {
      "domain": "Customer Management",
      "suggestedApis": [
        {
          "apiId": "customer-directory",
          "apiName": "Customer Directory",
          "reason": "Razón por la cual es relevante para este caso de uso",
          "priority": "high|medium|low",
          "confidence": 0.9
        }
      ]
    }
  ],
  "overallRecommendation": "Recomendación general sobre las APIs sugeridas",
  "confidence": 0.85
}
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en el estándar BIAN v13 y arquitectura de APIs bancarias. Sugiere las APIs más relevantes para casos de uso específicos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      // Limpiar la respuesta de markdown si existe
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const suggestions = JSON.parse(cleanResponse);
      
      return {
        domainSuggestions: suggestions.domainSuggestions || [],
        overallRecommendation: suggestions.overallRecommendation || '',
        confidence: suggestions.confidence || 0.5
      };

    } catch (error) {
      logger.error('Error sugiriendo APIs por dominio:', error);
      throw new Error('Error sugiriendo APIs por dominio');
    }
  }

  private extractBasicInfo(text: string) {
    // Fallback básico cuando falla el parsing de OpenAI
    const words = text.toLowerCase().split(/\s+/);
    
    const businessKeywords = ['objetivo', 'meta', 'propósito', 'beneficio', 'resultado'];
    const actorKeywords = ['cliente', 'usuario', 'empleado', 'sistema', 'banco', 'entidad'];
    const eventKeywords = ['solicitud', 'petición', 'transacción', 'proceso', 'operación'];
    
    return {
      businessObjectives: businessKeywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      ).map(keyword => `Análisis básico: ${keyword} identificado`),
      actors: actorKeywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      ).map(keyword => `${keyword} (detectado automáticamente)`),
      events: eventKeywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      ).map(keyword => `${keyword} (detectado automáticamente)`),
      flows: ['Análisis detallado requiere procesamiento manual'],
      suggestedDomains: ['Customer Management', 'Product Management'],
      confidence: 0.3
    };
  }
}

export const openaiService = new OpenAIService(); 