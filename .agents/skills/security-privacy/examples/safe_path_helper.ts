import * as path from 'path';

/**
 * EJEMPLO: Validación de Rutas (Path Traversal Prevention)
 * 
 * Este archivo demuestra cómo validar de forma segura que un path solicitado
 * por un usuario resida estrictamente dentro de un directorio base permitido.
 */

/**
 * Valida si targetPath está contenido dentro de baseDir.
 * Previene ataques de tipo Path Traversal (e.g. usando '../../etc/passwd').
 * 
 * @param targetPath Ruta solicitada (puede ser relativa o absoluta)
 * @param baseDir Directorio base permitido (absoluto)
 * @returns true si la ruta es segura, false en caso contrario
 */
export function isPathSafe(targetPath: string, baseDir: string): boolean {
  // 1. Resolver a rutas absolutas y normalizar (resuelve '.' y '..')
  const absoluteBaseDir = path.resolve(baseDir);
  const absoluteTargetPath = path.resolve(targetPath);

  // 2. Verificar que la ruta resuelta comience exactamente con el prefijo del directorio base
  // Añadimos el separador del sistema para evitar falsos positivos (p. ej., /app/data coincidiendo con /app/database)
  const baseDirWithSeparator = absoluteBaseDir.endsWith(path.sep)
    ? absoluteBaseDir
    : absoluteBaseDir + path.sep;

  return absoluteTargetPath.startsWith(baseDirWithSeparator) || absoluteTargetPath === absoluteBaseDir;
}

// ==========================================
// Ejemplo de Uso en un Controlador Express:
// ==========================================

export async function serveThumbnailController(req: any, res: any) {
  const filename = req.query.file; // e.g. "subdir/image.webp" o "../../etc/passwd"
  const THUMBNAILS_DIR = path.resolve('./library/storage/thumbnails');

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Parámetro "file" requerido.' });
  }

  // Combinamos la ruta
  const targetFilePath = path.join(THUMBNAILS_DIR, filename);

  // VALIDACIÓN CRÍTICA:
  if (!isPathSafe(targetFilePath, THUMBNAILS_DIR)) {
    console.warn(`[Security Alert] Intento de Path Traversal detectado: ${filename}`);
    return res.status(403).json({ error: 'Acceso denegado: Ruta no autorizada.' });
  }

  // De forma segura procedemos a leer o transmitir el archivo
  res.sendFile(targetFilePath);
}
