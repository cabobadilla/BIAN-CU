import OpenAI from 'openai';
import { logger } from '../utils/logger';

class OpenAIService {
  private openai: OpenAI | null = null;

  constructor() {
    // No inicializar OpenAI en el constructor para evitar crash al importar
  }

  private initializeOpenAI() {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey || apiKey === '...........') {
        logger.error('OPENAI_API_KEY no está configurada correctamente');
        throw new Error('OPENAI_API_KEY no está configurada correctamente');
      }

      // Log para verificar que la key está configurada (sin mostrar la key completa por seguridad)
      logger.info(`OpenAI API Key configurada: ${apiKey.length} caracteres, empieza con: ${apiKey.substring(0, 10)}...`);

      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
    return this.openai;
  }

  // Método para probar la conexión con OpenAI
  async testConnection() {
    try {
      const openai = this.initializeOpenAI();
      logger.info('Iniciando test de conexión con OpenAI...');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Test de conexión - responde con "OK"'
          }
        ],
        max_tokens: 10,
      });

      const response = completion.choices[0]?.message?.content;
      logger.info('Test de conexión OpenAI exitoso:', response);
      return { success: true, response };
    } catch (error) {
      logger.error('Error en test de conexión OpenAI:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
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
4. ACTORES: Actores adicionales que podrían estar involucrados
5. PRERREQUISITOS: Condiciones previas necesarias adicionales
6. FLUJO PRINCIPAL: Pasos principales del proceso
7. POSTCONDICIONES: Estados resultantes después del caso de uso
8. REGLAS DE NEGOCIO: Reglas importantes a considerar

IMPORTANTE: Responde ÚNICAMENTE en formato JSON válido, sin texto adicional antes o después. La estructura debe ser exactamente:

{
  "suggestedTitle": "Título mejorado o null",
  "suggestedDescription": "Descripción detallada...",
  "suggestedObjective": "Objetivo específico...",
  "additionalActors": ["actor1", "actor2"],
  "additionalPrerequisites": ["prerequisito1", "prerequisito2"],
  "suggestedMainFlow": [
    {"step": 1, "actor": "Cliente", "action": "Acción", "description": "Descripción"},
    {"step": 2, "actor": "Sistema", "action": "Acción", "description": "Descripción"}
  ],
  "suggestedPostconditions": ["postcondicion1", "postcondicion2"],
  "suggestedBusinessRules": ["regla1", "regla2"],
  "confidence": 0.85
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en análisis de procesos bancarios y casos de uso. Responde ÚNICAMENTE en formato JSON válido, sin explicaciones adicionales.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2500,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      logger.info('Respuesta bruta de OpenAI para suggestUseCaseContent:', response);

      // Función para extraer JSON válido de la respuesta
      const extractJSON = (text: string): string => {
        let cleaned = text.trim();
        
        // Log del contenido original
        logger.info('Texto original antes de limpiar:', cleaned.substring(0, 200) + '...');
        
        // Remover bloques de código markdown
        if (cleaned.includes('```')) {
          const match = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (match) {
            cleaned = match[1];
          } else {
            // Si hay ``` pero no encontramos el patrón, intentemos removerlos manualmente
            cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '').replace(/^\s*```/g, '').replace(/```\s*$/g, '');
          }
        }

        // Buscar el primer { y el último } para extraer solo el JSON
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        // Remover cualquier texto antes del primer {
        const jsonStart = cleaned.indexOf('{');
        if (jsonStart > 0) {
          cleaned = cleaned.substring(jsonStart);
        }

        // Remover cualquier texto después del último }
        const jsonEnd = cleaned.lastIndexOf('}');
        if (jsonEnd !== -1 && jsonEnd < cleaned.length - 1) {
          cleaned = cleaned.substring(0, jsonEnd + 1);
        }

        logger.info('JSON después de limpieza:', cleaned.substring(0, 200) + '...');
        return cleaned.trim();
      };

      let suggestions;
      try {
        const cleanedJSON = extractJSON(response);
        logger.info('JSON limpio extraído:', cleanedJSON);
        suggestions = JSON.parse(cleanedJSON);
      } catch (parseError) {
        logger.error('Error parseando JSON:', parseError);
        logger.error('JSON que falló:', response);
        
        // Fallback: devolver estructura básica con sugerencias mínimas
        return {
          suggestedTitle: null,
          suggestedDescription: "Se recomienda revisar y mejorar la descripción para mayor claridad",
          suggestedObjective: "Se recomienda definir un objetivo más específico y medible",
          additionalActors: ["Oficial de Cuenta", "Sistema de Compliance"],
          additionalPrerequisites: ["Validación de identidad del cliente", "Verificación de capacidad crediticia"],
          suggestedMainFlow: [],
          suggestedPostconditions: ["Registro actualizado en el sistema", "Notificación enviada al cliente"],
          suggestedBusinessRules: ["Cumplir con regulaciones bancarias vigentes", "Validar límites operacionales"],
          confidence: 0.3,
          error: "Error parseando respuesta de IA, usando sugerencias básicas"
        };
      }
      
      return {
        suggestedTitle: suggestions.suggestedTitle || null,
        suggestedDescription: suggestions.suggestedDescription || null,
        suggestedObjective: suggestions.suggestedObjective || null,
        additionalActors: suggestions.additionalActors || [],
        additionalPrerequisites: suggestions.additionalPrerequisites || [],
        suggestedMainFlow: suggestions.suggestedMainFlow || [],
        suggestedPostconditions: suggestions.suggestedPostconditions || [],
        suggestedBusinessRules: suggestions.suggestedBusinessRules || [],
        confidence: suggestions.confidence || 0.5
      };

    } catch (error) {
      logger.error('Error sugiriendo contenido de caso de uso:', error);
      
      // En caso de error total, devolver sugerencias básicas útiles
      return {
        suggestedTitle: null,
        suggestedDescription: "Se recomienda revisar y mejorar la descripción para mayor claridad y detalle",
        suggestedObjective: "Se recomienda definir un objetivo más específico, medible y orientado a resultados",
        additionalActors: ["Oficial de Cuenta", "Sistema de Compliance", "Supervisor de Operaciones"],
        additionalPrerequisites: [
          "Validación de identidad del cliente",
          "Verificación de capacidad crediticia",
          "Cumplimiento de requisitos regulatorios"
        ],
        suggestedMainFlow: [],
        suggestedPostconditions: [
          "Registro actualizado en el sistema central",
          "Notificación enviada al cliente",
          "Documentación generada y archivada"
        ],
        suggestedBusinessRules: [
          "Cumplir con regulaciones bancarias vigentes",
          "Validar límites operacionales establecidos",
          "Aplicar políticas de riesgo corporativo"
        ],
        confidence: 0.2,
        error: "Error en servicio de IA, usando sugerencias predeterminadas"
      };
    }
  }

  async suggestApisByDomain(domains: string[], useCaseContext: string) {
    try {
      const openai = this.initializeOpenAI();
      
      logger.info('=== Iniciando sugerencia de APIs ===');
      logger.info('Dominios recibidos:', domains);
      logger.info('Contexto del caso de uso:', useCaseContext.substring(0, 200) + '...');

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

IMPORTANTE: Responde ÚNICAMENTE en formato JSON válido, sin explicaciones adicionales. Estructura exacta:

{
  "suggestedApis": [
    {
      "name": "Customer Directory",
      "domain": "Customer Management",
      "reason": "Razón específica para este caso de uso"
    }
  ],
  "reasoning": "Explicación general",
  "confidence": 0.85
}`;

      logger.info('Prompt enviado a OpenAI:', prompt.substring(0, 300) + '...');

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en el estándar BIAN v13 y arquitectura de APIs bancarias. Responde ÚNICAMENTE en formato JSON válido.'
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
      
      logger.info('Respuesta completa de OpenAI:', response || 'RESPUESTA VACÍA');
      
      if (!response || response.trim() === '') {
        logger.error('OpenAI devolvió respuesta vacía o nula');
        // Retornar APIs básicas por dominio como fallback
        return this.generateBasicApiSuggestions(domains, useCaseContext);
      }

      logger.info('Respuesta bruta de OpenAI para suggestApisByDomain:', response);

      // Función para extraer JSON válido de la respuesta
      const extractJSON = (text: string): string => {
        let cleaned = text.trim();
        
        // Log del contenido original
        logger.info('Texto original antes de limpiar:', cleaned.substring(0, 200) + '...');
        
        // Remover bloques de código markdown
        if (cleaned.includes('```')) {
          const match = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (match) {
            cleaned = match[1];
          } else {
            // Si hay ``` pero no encontramos el patrón, intentemos removerlos manualmente
            cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '').replace(/^\s*```/g, '').replace(/```\s*$/g, '');
          }
        }

        // Buscar el primer { y el último } para extraer solo el JSON
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        // Remover cualquier texto antes del primer {
        const jsonStart = cleaned.indexOf('{');
        if (jsonStart > 0) {
          cleaned = cleaned.substring(jsonStart);
        }

        // Remover cualquier texto después del último }
        const jsonEnd = cleaned.lastIndexOf('}');
        if (jsonEnd !== -1 && jsonEnd < cleaned.length - 1) {
          cleaned = cleaned.substring(0, jsonEnd + 1);
        }

        logger.info('JSON después de limpieza:', cleaned.substring(0, 200) + '...');
        return cleaned.trim();
      };

      let suggestions;
      try {
        const cleanedJSON = extractJSON(response);
        logger.info('JSON limpio extraído para APIs:', cleanedJSON);
        suggestions = JSON.parse(cleanedJSON);
      } catch (parseError) {
        logger.error('Error parseando JSON para APIs:', parseError);
        logger.error('JSON que falló:', response);
        
        // Fallback: devolver APIs básicas por dominio
        return this.generateBasicApiSuggestions(domains, useCaseContext);
      }
      
      // Validar y transformar la estructura si es necesaria
      const result = {
        suggestedApis: suggestions.suggestedApis || [],
        reasoning: suggestions.reasoning || '',
        confidence: suggestions.confidence || 0.5
      };

      logger.info('Resultado final enviado al frontend:', JSON.stringify(result, null, 2));
      return result;

    } catch (error) {
      logger.error('Error sugiriendo APIs por dominio:', error);
      
      // En caso de error total, devolver APIs básicas
      return this.generateBasicApiSuggestions(domains, useCaseContext);
    }
  }

  // Método mejorado para sugerir APIs basado en APIs realmente disponibles
  async suggestApisFromAvailable(domains: string[], useCaseContext: string, availableApis: any[]) {
    try {
      const openai = this.initializeOpenAI();
      
      logger.info('=== Sugerencia de APIs basada en APIs disponibles ===');
      logger.info('Dominios seleccionados:', domains);
      logger.info('Número de dominios:', domains.length);
      logger.info('APIs disponibles:', availableApis.length);
      logger.info('APIs disponibles detalle:', availableApis.map(api => `${api.name} (${api.domain})`));

      if (availableApis.length === 0) {
        logger.warn('No hay APIs disponibles para los dominios seleccionados');
        return this.generateBasicApiSuggestions(domains, useCaseContext);
      }

      // NUEVA ESTRATEGIA: Hacer sugerencias por dominio individual y luego combinar
      logger.info('=== INICIANDO SUGERENCIAS POR DOMINIO INDIVIDUAL ===');
      
      const apisByDomain = domains.map(domain => {
        return {
          domain,
          apis: availableApis.filter(api => api.domain === domain)
        };
      });

      logger.info('APIs por dominio:', apisByDomain.map(d => `${d.domain}: ${d.apis.length} APIs`));

      let allSuggestions: any[] = [];
      let combinedReasoning: string[] = [];

      // Procesar cada dominio individualmente
      for (const domainData of apisByDomain) {
        if (domainData.apis.length === 0) {
          logger.warn(`No hay APIs disponibles para el dominio: ${domainData.domain}`);
          // Agregar APIs básicas para este dominio
          const basicApis = this.generateBasicApiSuggestions([domainData.domain], useCaseContext);
          allSuggestions.push(...basicApis.suggestedApis);
          combinedReasoning.push(`${domainData.domain}: APIs básicas generadas automáticamente`);
          continue;
        }

        logger.info(`=== Procesando dominio: ${domainData.domain} ===`);
        logger.info(`APIs disponibles para ${domainData.domain}:`, domainData.apis.map(api => api.name));

        const domainApisList = domainData.apis.map(api => 
          `- ${api.name}: ${api.description || 'API del dominio ' + api.domain}`
        ).join('\n');

        const domainPrompt = `
Basándote en el siguiente caso de uso bancario y las APIs BIAN disponibles para el dominio ${domainData.domain}, selecciona las más relevantes:

CASO DE USO:
${useCaseContext}

DOMINIO A PROCESAR: ${domainData.domain}

APIs DISPONIBLES PARA ${domainData.domain.toUpperCase()}:
${domainApisList}

INSTRUCCIONES:
1. Responde ÚNICAMENTE en formato JSON válido
2. Solo sugiere APIs de la lista del dominio ${domainData.domain}
3. Selecciona entre 1-3 APIs más relevantes para este dominio específico
4. Enfócate en las operaciones más importantes para el caso de uso

Estructura exacta:
{
  "suggestedApis": [
    {
      "name": "Nombre exacto de la API",
      "domain": "${domainData.domain}",
      "reason": "Razón específica para este caso de uso"
    }
  ],
  "reasoning": "Por qué estas APIs son relevantes para ${domainData.domain}"
}`;

        try {
          logger.info(`Enviando prompt para dominio ${domainData.domain}...`);
          
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `Eres un experto en BIAN v13. Analiza solo APIs del dominio ${domainData.domain}. Responde en JSON válido.`
              },
              {
                role: 'user',
                content: domainPrompt
              }
            ],
            temperature: 0.2,
            max_tokens: 800,
          });

          const response = completion.choices[0]?.message?.content;
          logger.info(`Respuesta OpenAI para ${domainData.domain}:`, response?.substring(0, 200) + '...');

          if (response && response.trim() !== '') {
            const cleanedJSON = this.extractJSON(response);
            const domainSuggestions = JSON.parse(cleanedJSON);
            
            // Validar APIs del dominio
            const validDomainApis = (domainSuggestions.suggestedApis || []).filter((api: any) => 
              domainData.apis.some(availableApi => availableApi.name === api.name)
            );

            logger.info(`APIs validadas para ${domainData.domain}:`, validDomainApis.map((api: any) => api.name));

            allSuggestions.push(...validDomainApis);
            combinedReasoning.push(`${domainData.domain}: ${domainSuggestions.reasoning || 'APIs seleccionadas'}`);
          } else {
            throw new Error('Respuesta vacía de OpenAI');
          }

        } catch (error) {
          logger.error(`Error procesando dominio ${domainData.domain}:`, error);
          // Fallback: usar la mejor API disponible para este dominio
          if (domainData.apis.length > 0) {
            const fallbackApi = domainData.apis[0]; // Tomar la primera API
            allSuggestions.push({
              name: fallbackApi.name,
              domain: domainData.domain,
              reason: `API principal para operaciones del dominio ${domainData.domain}`
            });
            combinedReasoning.push(`${domainData.domain}: API de fallback seleccionada`);
          }
        }
      }

      logger.info('=== RESULTADO FINAL COMBINADO ===');
      logger.info(`Total de APIs sugeridas: ${allSuggestions.length}`);
      logger.info('Dominios cubiertos:', [...new Set(allSuggestions.map(api => api.domain))]);
      logger.info('APIs finales:', allSuggestions.map(api => `${api.name} (${api.domain})`));

      const result = {
        suggestedApis: allSuggestions,
        reasoning: `Sugerencias generadas por dominio: ${combinedReasoning.join('; ')}`,
        confidence: allSuggestions.length === domains.length ? 0.9 : 0.7
      };

      return result;

    } catch (error) {
      logger.error('Error sugiriendo APIs desde disponibles:', error);
      return this.generateBasicApiSuggestions(domains, useCaseContext);
    }
  }

  // Método auxiliar para extraer JSON
  private extractJSON(text: string): string {
    let cleaned = text.trim();
    
    if (cleaned.includes('```')) {
      const match = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (match) {
        cleaned = match[1];
      } else {
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '').replace(/^\s*```/g, '').replace(/```\s*$/g, '');
      }
    }

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned.trim();
  }

  // Método auxiliar para generar sugerencias básicas de APIs
  private generateBasicApiSuggestions(domains: string[], useCaseContext: string) {
    logger.info('Generando sugerencias básicas de APIs para dominios:', domains);
    
    const apisByDomain: Record<string, Array<{name: string, reason: string}>> = {
      'Customer Management': [
        { name: 'Customer Directory - Retrieve', reason: 'Obtener información detallada del cliente' },
        { name: 'Customer Directory - Register', reason: 'Registrar nuevos clientes' },
        { name: 'Customer Relationship Management', reason: 'Gestión de relaciones con clientes' }
      ],
      'Product Management': [
        { name: 'Product Directory - Retrieve', reason: 'Consultar catálogo de productos bancarios' },
        { name: 'Product Directory - Register', reason: 'Registrar nuevos productos' },
        { name: 'Product Design', reason: 'Configuración de productos' }
      ],
      'Customer Offer': [
        { name: 'Customer Offer - Initiate', reason: 'Iniciar ofertas personalizadas' },
        { name: 'Customer Offer - Retrieve', reason: 'Consultar ofertas existentes' }
      ],
      'Customer Agreement': [
        { name: 'Customer Agreement - Initiate', reason: 'Iniciar contratos y acuerdos' },
        { name: 'Customer Agreement - Retrieve', reason: 'Consultar contratos existentes' }
      ],
      'Payment Order': [
        { name: 'Payment Order - Initiate', reason: 'Iniciar órdenes de pago' },
        { name: 'Payment Order - Retrieve', reason: 'Consultar órdenes de pago' },
        { name: 'Payment Order - Update', reason: 'Actualizar órdenes de pago' }
      ],
      'Payment Execution': [
        { name: 'Payment Execution - Initiate', reason: 'Ejecutar pagos' },
        { name: 'Payment Execution - Retrieve', reason: 'Consultar estado de pagos' }
      ],
      'Credit Management': [
        { name: 'Credit Facility - Initiate', reason: 'Iniciar facilidades crediticias' },
        { name: 'Credit Facility - Retrieve', reason: 'Consultar facilidades crediticias' }
      ],
      'Customer Position': [
        { name: 'Customer Position - Retrieve', reason: 'Consultar posiciones del cliente' },
        { name: 'Customer Position - Update', reason: 'Actualizar posiciones del cliente' }
      ]
    };

    // Asegurar que cada dominio tenga al menos una API sugerida
    const suggestedApis = domains.flatMap(domain => {
      const apis = apisByDomain[domain];
      if (apis && apis.length > 0) {
        // Para dominios conocidos, seleccionar las APIs más relevantes (mínimo 1, máximo 2)
        return apis.slice(0, 2).map(api => ({
          name: api.name,
          domain: domain,
          reason: api.reason
        }));
      } else {
        // Para dominios desconocidos, generar APIs básicas
        return [
          { 
            name: `${domain} - Retrieve`, 
            domain: domain, 
            reason: `Consultar información del dominio ${domain}` 
          },
          { 
            name: `${domain} - Initiate`, 
            domain: domain, 
            reason: `Iniciar operaciones del dominio ${domain}` 
          }
        ];
      }
    });

    logger.info(`Sugerencias básicas generadas: ${suggestedApis.length} APIs para ${domains.length} dominios`);

    return {
      suggestedApis,
      reasoning: `Sugerencias generadas para TODOS los dominios seleccionados: ${domains.join(', ')}. Se han seleccionado APIs básicas de Retrieve e Initiate para cada dominio para cubrir las operaciones fundamentales. ${useCaseContext ? 'Basado en el contexto del caso de uso.' : ''}`,
      confidence: 0.7
    };
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