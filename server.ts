import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Check server-side Gemini key status
  app.get('/api/gemini/status', (req, res) => {
    res.json({
      hasServerKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
      defaultModel: 'gemini-3.1-flash-lite'
    });
  });

  // Generate Chapter endpoint
  app.post('/api/gemini/generate-chapter', async (req, res) => {
    try {
      const {
        apiKey: clientApiKey,
        storyTitle,
        chapterTitle,
        universeContext,
        charactersContext,
        previousChapter,
        userNote,
        chapterNumber,
        model = 'gemini-3.1-flash-lite'
      } = req.body;

      // Use user's client-provided API key or server-side environment key
      const effectiveKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY;

      if (!effectiveKey) {
        return res.status(400).json({
          error: 'No se encontró una Gemini API Key. Por favor ingresa y guarda tu Key en la pantalla principal.'
        });
      }

      const ai = new GoogleGenAI({
        apiKey: effectiveKey,
      });

      const titleRule = chapterTitle && chapterTitle.trim()
        ? `El título para este capítulo ha sido fijado por el usuario como: "${chapterTitle.trim()}". La primera línea del texto DEBE ser obligatoriamente: "# Capítulo ${chapterNumber}: ${chapterTitle.trim()}".`
        : `El usuario no ha indicado un título para este capítulo. Analiza el contenido de este capítulo y genera tú mismo un título evocador, poético e intrigante que resuma la esencia de los eventos narrados. La primera línea del texto DEBE ser: "# Capítulo ${chapterNumber}: [Título Generado]".`;

      const systemInstruction = `Eres un aclamado autor de literatura de ficción inmersiva en español para la obra "${storyTitle || 'Novela'}".
Tu tarea es escribir el Capítulo ${chapterNumber || 1} completo con una prosa rica, cautivadora, elegante y cinematográfica.

Reglas imperativas:
1. Respeta fielmente la coherencia del universo, las leyes del mundo y las fichas de los personajes provistas.
2. Continúa la trama desde los eventos del capítulo anterior de manera orgánica (o arranca la historia con fuerza si es el primer capítulo).
3. Integra las directrices y notas narrativas provistas de manera fluida y verosímil dentro de la trama.
4. ${titleRule}
5. Formato: Prosa literaria dividida en párrafos bien estructurados, diálogos inmersivos y atmósfera sensorial.
6. NO incluyas saludos, despedidas ni notas meta sobre el proceso dentro del texto del capítulo.
7. AL FINAL DEL CAPÍTULO, incluye obligatoriamente un bloque con 3 sugerencias breves, cautivadoras y diferentes (de 10 a 25 palabras cada una) para el siguiente capítulo (Capítulo ${(chapterNumber || 1) + 1}), usando exclusivamente los personajes oficiales de la historia y basadas en lo que acaba de suceder en este capítulo.
Delimita este bloque exactamente así:
[SUGERENCIAS_CONTINUACION]
- Sugerencia 1...
- Sugerencia 2...
- Sugerencia 3...
[/SUGERENCIAS_CONTINUACION]`;

      const prompt = `[TÍTULO DE LA HISTORIA]:
${storyTitle || 'Novela de Ficción'}

[CONTEXTO DEL UNIVERSO / LORE]:
${universeContext || 'Universo literario detallado.'}

[FICHAS DE PERSONAJES]:
${charactersContext || 'Personajes del elenco.'}

[CAPÍTULO ANTERIOR]:
${previousChapter || 'Inicio de la historia (primer capítulo).'}

[INSTRUCCIÓN / NOTA PARA ESTE CAPÍTULO]:
"${userNote || 'Comienza o avanza la narración profundizando en el conflicto central y el misterio latente.'}"

Escribe el Capítulo ${chapterNumber} completo ahora respetando la regla del título en la primera línea y el bloque [SUGERENCIAS_CONTINUACION] al final:`;

      // Sanitize model to prevent deprecated or unavailable models
      const sanitizeModel = (m?: string): string => {
        if (!m || m.includes('1.5') || m.includes('2.0') || m.includes('2.5') || m === 'gemini-pro') {
          return 'gemini-3.1-flash-lite';
        }
        return m;
      };

      const primaryModel = sanitizeModel(model);
      // If primary model is gemini-3.8-flash (which frequently suffers 503 high-demand spikes),
      // we ensure gemini-3.1-flash-lite and gemini-flash-latest follow immediately.
      const candidateModels = Array.from(
        new Set([
          primaryModel,
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          'gemini-3.8-flash'
        ])
      );

      let generatedText = '';
      let lastError: any = null;
      let usedModel = primaryModel;

      for (const m of candidateModels) {
        try {
          // Timeout protection: if a model is under heavy load or queued, timeout after 14s and switch
          let timeoutHandle: any;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => reject(new Error(`Model ${m} response timeout`)), 14000);
          });

          const generationPromise = ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.8,
            }
          });

          const response = await Promise.race([generationPromise, timeoutPromise]);
          clearTimeout(timeoutHandle);

          generatedText = response.text || '';
          if (generatedText) {
            usedModel = m;
            break;
          }
        } catch (err: any) {
          lastError = err;
          // Graceful silent fallback without noisy error strings
          console.log(`[Gemini Fallback] Model ${m} is temporarily unavailable or busy, trying next available model...`);
        }
      }

      if (!generatedText) {
        const errorMsg = lastError?.message || 'No se pudo generar contenido con los modelos de Gemini disponibles';
        throw new Error(errorMsg);
      }

      // Parse suggestions block if returned by model
      let suggestions: string[] = [];
      const suggestionsMatch = generatedText.match(/\[SUGERENCIAS_CONTINUACION\]([\s\S]*?)\[\/SUGERENCIAS_CONTINUACION\]/i);
      if (suggestionsMatch) {
        const suggestionsBlock = suggestionsMatch[1];
        suggestions = suggestionsBlock
          .split('\n')
          .map(s => s.replace(/^[-*•\d.]+\s*/, '').trim())
          .filter(s => s.length > 5)
          .slice(0, 3);

        // Remove suggestions block from clean chapter text
        generatedText = generatedText.replace(/\[SUGERENCIAS_CONTINUACION\][\s\S]*?\[\/SUGERENCIAS_CONTINUACION\]/i, '').trim();
      }

      // Parse title and clean content
      const lines = generatedText.split('\n');
      let title = `Capítulo ${chapterNumber}`;
      let content = generatedText;

      const firstLine = lines[0]?.trim();
      if (firstLine.startsWith('#')) {
        title = firstLine.replace(/^#+\s*/, '').trim();
        content = lines.slice(1).join('\n').trim();
      }

      // Ensure at least 3 contextual suggestions are provided
      if (suggestions.length < 3) {
        const charNames = (charactersContext || '')
          .match(/Nombre:\s*([^\n,]+)/gi)
          ?.map((m: string) => m.replace(/Nombre:\s*/i, '').trim()) || [];

        if (charNames.length >= 2) {
          suggestions.push(
            `${charNames[0]} y ${charNames[1]} se enfrentan a un dilema urgente tras los acontecimientos recientes.`,
            `${charNames[0]} toma la iniciativa para descubrir el enigma que rodea a ${charNames[1]}.`,
            `Una revelación imprevista pone en jaque la confianza mutua entre ${charNames[0]} y ${charNames[1]}.`
          );
        } else if (charNames.length === 1) {
          suggestions.push(
            `${charNames[0]} debe actuar deprisa para contener las consecuencias de lo ocurrido.`,
            `${charNames[0]} descubre un rastro inesperado que cambia el rumbo de sus planes.`,
            `Un nuevo obstáculo pone a prueba la determinación de ${charNames[0]}.`
          );
        } else {
          suggestions.push(
            'El conflicto narrativo se intensifica revelando nuevas revelaciones y peligros.',
            'Un giro de los acontecimientos cambia radicalmente el escenario actual.',
            'Se profundiza en el misterio con consecuencias inmediatas para la trama.'
          );
        }
      }

      return res.json({
        success: true,
        title,
        content,
        suggestions: suggestions.slice(0, 3),
        raw: generatedText
      });
    } catch (error: any) {
      console.error('Error generating chapter:', error);
      return res.status(500).json({
        error: error?.message || 'Ocurrió un error al contactar la API de Gemini.'
      });
    }
  });

  // Parse Characters and Relations from Text endpoint
  app.post('/api/gemini/parse-characters', async (req, res) => {
    try {
      const {
        apiKey: clientApiKey,
        text,
        model = 'gemini-3.1-flash-lite'
      } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Debes proporcionar un texto con las descripciones de los personajes.'
        });
      }

      const effectiveKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY;
      if (!effectiveKey) {
        return res.status(400).json({
          error: 'No se encontró una Gemini API Key. Por favor ingresa tu Key.'
        });
      }

      const ai = new GoogleGenAI({ apiKey: effectiveKey });

      const prompt = `Analiza y extrae minuciosamente todos los personajes y sus relaciones a partir del siguiente texto de autor:

---
${text.trim()}
---

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta (sin texto previo ni posterior, sin formato markdown ni comillas invertidas):
{
  "characters": [
    {
      "name": "Nombre o alias del personaje",
      "gender": "Femenino | Masculino | No binario | Otro",
      "role": "protagonista | antagonista | secundario | misterioso",
      "history": "Historia, pasado o motivaciones del personaje",
      "description": "Descripción física y rasgos de personalidad",
      "relations": [
        {
          "targetName": "Nombre exacto de otro personaje mencionado",
          "relationshipType": "amistad | odio | amor | amor secreto | rivalidad | familia | mentor/aprendiz | lealtad | desconfianza | alianza secreta | otro",
          "notes": "Breve explicación de su vínculo o dinámica"
        }
      ]
    }
  ]
}`;

      const sanitizeModel = (m?: string): string => {
        if (!m || m.includes('1.5') || m.includes('2.0') || m.includes('2.5') || m === 'gemini-pro') {
          return 'gemini-3.1-flash-lite';
        }
        return m;
      };

      const candidateModels = Array.from(
        new Set([
          sanitizeModel(model),
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          'gemini-3.8-flash'
        ])
      );

      let rawResponse = '';
      let lastError: any = null;

      for (const m of candidateModels) {
        try {
          let timeoutHandle: any;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => reject(new Error(`Timeout with model ${m}`)), 14000);
          });

          const generationPromise = ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2
            }
          });

          const response = await Promise.race([generationPromise, timeoutPromise]);
          clearTimeout(timeoutHandle);

          rawResponse = response.text || '';
          if (rawResponse) break;
        } catch (err: any) {
          lastError = err;
          console.log(`[Parse Characters Fallback] Model ${m} busy, trying next available model...`);
        }
      }

      if (!rawResponse) {
        throw new Error(lastError?.message || 'No se pudo procesar la información de los personajes.');
      }

      // Clean JSON string if wrapped in markdown code fence
      let cleanJson = rawResponse.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }

      const parsed = JSON.parse(cleanJson);
      const rawCharacters = Array.isArray(parsed.characters) ? parsed.characters : [];

      if (rawCharacters.length === 0) {
        return res.status(400).json({
          error: 'No se detectaron personajes en el texto proporcionado. Verifica el formato e intenta nuevamente.'
        });
      }

      // Build structured characters with IDs and valid relationship IDs
      const charactersWithIds = rawCharacters.map((c: any, index: number) => ({
        id: `char-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        name: (c.name || `Personaje ${index + 1}`).trim(),
        gender: c.gender || 'Femenino',
        history: c.history || '',
        role: ['protagonista', 'antagonista', 'secundario', 'misterioso'].includes(c.role)
          ? c.role
          : 'secundario',
        description: c.description || '',
        rawRelations: Array.isArray(c.relations) ? c.relations : []
      }));

      // Map names to IDs for resolving relationship targets
      const nameToIdMap = new Map<string, string>();
      charactersWithIds.forEach((c: any) => {
        nameToIdMap.set(c.name.toLowerCase(), c.id);
        // Also map first word or alias if single word
        const firstName = c.name.split(' ')[0]?.toLowerCase();
        if (firstName && !nameToIdMap.has(firstName)) {
          nameToIdMap.set(firstName, c.id);
        }
      });

      const allowedRelTypes = [
        'amistad', 'odio', 'amor', 'amor secreto', 'rivalidad', 
        'familia', 'mentor/aprendiz', 'lealtad', 'desconfianza', 
        'alianza secreta', 'otro'
      ];

      const finalCharacters = charactersWithIds.map((c: any) => {
        const relations = c.rawRelations
          .map((r: any, rIdx: number) => {
            const targetName = (r.targetName || '').toLowerCase().trim();
            let targetId = nameToIdMap.get(targetName);
            if (!targetId && targetName) {
              // Try finding partial match
              for (const [nameKey, idVal] of nameToIdMap.entries()) {
                if (nameKey.includes(targetName) || targetName.includes(nameKey)) {
                  targetId = idVal;
                  break;
                }
              }
            }

            if (!targetId || targetId === c.id) return null;

            const relType = allowedRelTypes.includes(r.relationshipType)
              ? r.relationshipType
              : 'otro';

            return {
              id: `rel-${Date.now()}-${rIdx}-${Math.random().toString(36).substring(2, 6)}`,
              targetCharacterId: targetId,
              relationshipType: relType,
              notes: r.notes || ''
            };
          })
          .filter(Boolean);

        return {
          id: c.id,
          name: c.name,
          gender: c.gender,
          history: c.history,
          role: c.role,
          description: c.description,
          relations
        };
      });

      return res.json({
        success: true,
        characters: finalCharacters
      });
    } catch (error: any) {
      console.error('Error parsing characters:', error);
      return res.status(500).json({
        error: error?.message || 'Error al procesar los personajes con Gemini.'
      });
    }
  });

  // Suggest Next Chapter Ideas endpoint (Strictly grounded in current chapter and existing characters)
  app.post('/api/gemini/suggest-next', async (req, res) => {
    try {
      const {
        apiKey: clientApiKey,
        storyTitle,
        chapterNumber,
        chapterTitle,
        chapterSnippet,
        characters = [],
        worldName,
        worldRules,
        model = 'gemini-3.1-flash-lite'
      } = req.body;

      const effectiveKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY;

      if (!effectiveKey) {
        return res.status(400).json({
          error: 'No se encontró una Gemini API Key.'
        });
      }

      const ai = new GoogleGenAI({ apiKey: effectiveKey });

      const charList = characters.length > 0
        ? characters.map((c: any) => `- ${c.name} (${c.role || 'personaje'}): ${c.description || c.history || ''}`).join('\n')
        : 'No especificados';

      const prompt = `Analiza este capítulo y a los personajes que participan en la historia. Genera exactamente 3 sugerencias breves, cautivadoras y diferentes de directrices narrativas para el siguiente capítulo (Capítulo ${chapterNumber + 1}).

[MUNDO]: ${worldName || 'Mundo narrativo'}
${worldRules ? `[REGLAS]:\n${worldRules}\n` : ''}
[HISTORIA]: "${storyTitle || 'Relato'}"
[PERSONAJES OFICIALES DE LA HISTORIA]:
${charList}

[FINAL / RESUMEN DEL CAPÍTULO ACTUAL (${chapterTitle || `Capítulo ${chapterNumber}`})]:
"""
${chapterSnippet || 'Inicio del relato.'}
"""

REGLAS OBLIGATORIAS:
1. Las 3 sugerencias DEBEN estar directamente inspiradas en lo que acaba de suceder en el texto del capítulo actual.
2. Utiliza EXCLUSIVAMENTE los nombres de los personajes que están en la lista oficial de arriba. ESTÁ TOTALMENTE PROHIBIDO inventar nombres que no existan en la lista (como Carla, Kaelen, Lyra u otros nombres que no figuren arriba).
3. Cada sugerencia debe ser una frase directa de 10 a 25 palabras lista para usar como instrucción de redacción.
4. Devuelve ÚNICAMENTE un objeto JSON válido con la propiedad "suggestions", un array de 3 strings.

Ejemplo de formato:
{
  "suggestions": [
    "Sugerencia 1 basada en los personajes de la lista y el desenlace del capítulo...",
    "Sugerencia 2 con un giro inesperado...",
    "Sugerencia 3 explorando el conflicto entre ellos..."
  ]
}`;

      // Prioritize fast, high-rate-limit models like gemini-3.1-flash-lite
      const candidateModels = Array.from(
        new Set([
          'gemini-3.1-flash-lite',
          model || 'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          'gemini-3.8-flash'
        ])
      );

      let rawText = '';
      for (const m of candidateModels) {
        try {
          let timeoutHandle: any;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => reject(new Error('Timeout de sugerencias')), 10000);
          });

          const apiCall = ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              temperature: 0.8,
              maxOutputTokens: 600,
              responseMimeType: 'application/json'
            }
          });

          const result: any = await Promise.race([apiCall, timeoutPromise]);
          clearTimeout(timeoutHandle);

          const extracted = typeof result?.text === 'string'
            ? result.text
            : (typeof result?.text === 'function' ? (result.text as any)() : (result?.candidates?.[0]?.content?.parts?.[0]?.text || ''));

          if (extracted && extracted.trim().length > 0) {
            rawText = extracted;
            break;
          }
        } catch (e) {
          // Graceful fallback without noisy logs
          console.log(`[Suggestions fallback] Model ${m} unavailable, trying next...`);
        }
      }

      let suggestions: string[] = [];

      if (rawText) {
        try {
          const cleanJson = rawText.replace(/```(?:json)?\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed?.suggestions)) {
            suggestions = parsed.suggestions
              .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
              .slice(0, 3);
          }
        } catch (err) {
          // Fallback line-by-line parsing if JSON parse failed
          suggestions = rawText
            .split('\n')
            .map((l: string) => l.replace(/^[-*•\d.]+\s*/, '').trim())
            .filter((l: string) => l.length > 8 && !l.startsWith('{') && !l.startsWith('}'))
            .slice(0, 3);
        }
      }

      // If AI generation didn't yield 3 suggestions, provide contextual suggestions grounded strictly in the real characters
      if (suggestions.length < 3) {
        const charNames = characters
          .map((c: any) => (c.name || '').trim())
          .filter((n: string) => n.length > 0);

        const defaultFallbacks: string[] = [];
        if (charNames.length >= 2) {
          defaultFallbacks.push(
            `${charNames[0]} y ${charNames[1]} se enfrentan a un dilema urgente tras los acontecimientos recientes.`,
            `${charNames[0]} toma la iniciativa para descubrir el enigma que rodea a ${charNames[1]}.`,
            `Una revelación imprevista pone en jaque la confianza mutua entre ${charNames[0]} y ${charNames[1]}.`
          );
        } else if (charNames.length === 1) {
          defaultFallbacks.push(
            `${charNames[0]} debe actuar deprisa para contener las consecuencias de lo ocurrido.`,
            `${charNames[0]} descubre un rastro inesperado que cambia el rumbo de sus planes.`,
            `Un nuevo obstáculo pone a prueba la determinación de ${charNames[0]}.`
          );
        } else {
          defaultFallbacks.push(
            'El conflicto narrativo se intensifica revelando nuevas revelaciones y peligros.',
            'Un giro de los acontecimientos cambia radicalmente el escenario actual.',
            'Se profundiza en el misterio con consecuencias inmediatas para la trama.'
          );
        }

        while (suggestions.length < 3 && defaultFallbacks.length > 0) {
          const fb = defaultFallbacks.shift()!;
          if (!suggestions.includes(fb)) {
            suggestions.push(fb);
          }
        }
      }

      return res.json({
        success: true,
        suggestions: suggestions.slice(0, 3)
      });
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      return res.status(500).json({
        error: error?.message || 'Error al generar sugerencias para el siguiente capítulo.'
      });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
