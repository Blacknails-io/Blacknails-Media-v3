import { IOllamaService } from '../../../../server/src/application/ports/out/IOllamaService.js';

/**
 * EJEMPLO: Consulta y Extracción de JSON con Ollama (Defensive JSON Extraction)
 * 
 * Este archivo muestra el patrón recomendado para consultar modelos locales de Ollama,
 * adquirir los locks de concurrencia requeridos para proteger la GPU y parsear
 * de manera defensiva el JSON devuelto para evitar caídas del servidor.
 */
export class SafeOllamaClient {
  constructor(private readonly ollama: IOllamaService) {}

  /**
   * Extrae etiquetas (tags) de una descripción de forma segura.
   */
  public async extractTagsSafely(description: string): Promise<string[]> {
    const workerId = 'tags-worker';

    // 1. CONTROL DE CONCURRENCIA (VRAM LOCK):
    // Es crítico adquirir el lock antes de ejecutar la llamada para no ahogar la GPU.
    const hasLock = this.ollama.acquireLock(workerId);
    if (!hasLock) {
      console.warn(`[SafeOllama] No se pudo adquirir lock para ${workerId}. Reintentando luego...`);
      return [];
    }

    try {
      const prompt = `Analiza la siguiente descripción de imagen y devuelve una lista de etiquetas en formato JSON.
Ejemplo de formato esperado:
{
  "tags": ["paisaje", "naturaleza", "atardecer"]
}

Descripción:
"${description}"`;

      // 2. EJECUCIÓN DE LA LLAMADA (Usando el puerto del sistema):
      const result = await this.ollama.extractJson(description, prompt, 'tags');

      // 3. PARSEO DEFENSIVO CON FALLBACK:
      // OllamaService.extractJson devuelve un Record<string, any>. Debemos validar
      // que tenga la estructura que esperamos antes de usar los datos.
      if (!result || typeof result !== 'object') {
        console.error('[SafeOllama] El resultado devuelto no es un objeto válido.');
        return [];
      }

      if (!Array.isArray(result.tags)) {
        console.warn('[SafeOllama] La propiedad "tags" no existe o no es una lista.');
        return [];
      }

      // Filtrar y limpiar las etiquetas
      return result.tags
        .filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
        .map((tag: string) => tag.toLowerCase().trim());

    } catch (error: any) {
      // 4. CONTROL DE EXCEPCIONES:
      // Aseguramos que cualquier fallo de red, timeout o parseo de Ollama
      // no tumbe el hilo del servidor y se maneje como un fallo controlado.
      console.error(`[SafeOllama] Error consultando Ollama: ${error.message}`);
      return [];
    } finally {
      // 5. LIBERACIÓN OBLIGATORIA DEL LOCK:
      // Siempre liberar el lock en el bloque finally para evitar "leaks" de concurrencia.
      this.ollama.releaseLock(workerId);
    }
  }
}
