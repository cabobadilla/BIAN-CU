import OpenAI from 'openai';
import { logger } from '../utils/logger';

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeUseCase(originalText: string) {
    try {
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

      const completion = await this.openai.chat.completions.create({
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
        const analysis = JSON.parse(response);
        
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

      const completion = await this.openai.chat.completions.create({
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

      const result = JSON.parse(response);
      return result;

    } catch (error) {
      logger.error('Error sugiriendo dominios BIAN:', error);
      throw new Error('Error sugiriendo dominios BIAN');
    }
  }

  async generateCustomSchema(description: string, apiContext?: string) {
    try {
      const prompt = `
Genera un schema JSON para el siguiente requerimiento:

DESCRIPCIÓN:
${description}

${apiContext ? `CONTEXTO DE API: ${apiContext}` : ''}

Genera un schema JSON válido que incluya:
1. Propiedades relevantes con tipos apropiados
2. Validaciones necesarias (required, format, etc.)
3. Descripciones para cada campo
4. Ejemplos cuando sea apropiado

Responde con un JSON que contenga:
{
  "schema": {
    "type": "object",
    "properties": { ... },
    "required": [...],
    "additionalProperties": false
  },
  "example": { ... },
  "description": "Descripción del schema generado"
}
`;

      const completion = await this.openai.chat.completions.create({
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

      return JSON.parse(response);

    } catch (error) {
      logger.error('Error generando schema personalizado:', error);
      throw new Error('Error generando schema personalizado');
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