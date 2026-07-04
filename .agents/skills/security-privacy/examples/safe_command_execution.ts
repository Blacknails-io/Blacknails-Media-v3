import { execFile, spawn } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * EJEMPLO: Ejecución Segura de Comandos del Sistema (Command Injection Prevention)
 * 
 * Este archivo muestra cómo invocar herramientas CLI del sistema (como ffmpeg o exiftool)
 * de forma segura, previniendo vulnerabilidades de inyección de comandos.
 */

/**
 * INCORRECTO (Vulnerable a Inyección de Comandos):
 * 
 * NEVER use child_process.exec(commandString) with user inputs directly.
 * E.g., exec(`ffmpeg -i "${userInputFilename}" output.mp4`)
 * If userInputFilename is: 'img.jpg"; rm -rf /; "', the shell executes the injected command.
 */

/**
 * CORRECTO (Uso de execFile con arrays de argumentos):
 * 
 * Al usar execFile pasándole un array de argumentos separado, Node.js NO
 * invoca una shell intermedia (/bin/sh). Los argumentos se pasan directamente
 * a la tabla de ejecución de procesos del sistema operativo, neutralizando
 * cualquier intento de concatenar comandos.
 */
export async function extractVideoDuration(videoPath: string): Promise<number> {
  const args = [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    videoPath // El argumento se pasa tal cual, sin expansión de shell
  ];

  try {
    const { stdout } = await execFileAsync('ffprobe', args);
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : duration;
  } catch (error: any) {
    console.error(`[FFprobe] Error al extraer duración: ${error.message}`);
    throw new Error('No se pudo procesar el archivo de vídeo.');
  }
}

/**
 * CORRECTO (Uso de spawn para streams o salidas muy grandes):
 * 
 * Si el binario va a generar una salida pesada (que pueda desbordar el buffer de execFile)
 * o requiere procesamiento en streaming, se debe usar spawn.
 */
export function generateThumbnailStream(imagePath: string) {
  const args = [
    '-y',                     // Sobrescribir sin preguntar
    '-i', imagePath,          // Archivo de entrada
    '-vf', 'scale=300:-1',    // Redimensionar ancho a 300px
    '-f', 'image2',           // Formato de salida
    '-vcodec', 'mjpeg',       // Codec
    '-'                       // Enviar el output directamente a stdout (stream)
  ];

  // Ejecutamos spawn directamente (no invoca shell)
  const processInstance = spawn('ffmpeg', args);

  processInstance.stderr.on('data', (data) => {
    // Ffmpeg escribe sus logs informativos en stderr
    const log = data.toString();
    if (log.includes('Error')) {
      console.warn(`[FFmpeg Log] ${log.trim()}`);
    }
  });

  return processInstance.stdout; // Devolvemos el Readable Stream
}
