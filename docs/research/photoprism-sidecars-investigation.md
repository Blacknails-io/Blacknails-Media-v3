# Investigación: Sidecars en PhotoPrism (XMP/XML + YAML)

**Objetivo**: Analizar cómo PhotoPrism utiliza sidecars (principalmente XMP/XML y YAML) para almacenar metadatos, con el fin de hacer la base de datos de Blacknails-Media-v3 100% portable y recuperable en caso de desastre (pérdida de SQLite, migración, reconstrucción total).

**Fecha de investigación**: 2026-07-02  
**Fuentes**: Documentación oficial (docs.photoprism.app), código fuente del repositorio (rama release), guías de backup y metadata.

---

## Resumen General

PhotoPrism separa deliberadamente:
- Los **archivos originales** (fuente de verdad de las fotos y vídeos).
- Los **metadatos** (almacenados en sidecars + base de datos).

Esto permite que la base de datos (el "índice") sea reconstruible y que los metadatos sean independientes y portátiles.

PhotoPrism distingue claramente entre:
- **Sidecars de entrada** (que lee durante el indexado): XMP (XML), JSON y metadatos embebidos.
- **Sidecars de salida / backup** (que escribe): principalmente **YAML** legibles por humanos.

El objetivo explícito es recuperar metadatos (títulos, captions, etiquetas, personas, ubicación, etc.) incluso si se pierde completamente la base de datos.

---

## 1. Sidecars que PhotoPrism Lee (Input)

| Formato     | Tipo | Ubicación                              | Características |
|-------------|------|----------------------------------------|-----------------|
| **XMP**     | XML  | Archivos `.xmp` junto al original o embebidos dentro del archivo | Lector propio básico + soporte completo vía ExifTool. Cuando un campo viene de un XMP sidecar, ese dato es **autoritativo** y sobrescribe otras fuentes. |
| **JSON**    | JSON | Exports de Google Photos, ExifTool, Apple Photos, motion photos | Soporte específico para migraciones. |
| **Exif**    | Embebido | Dentro de los archivos originales     | Parser propio + ExifTool. |
| Otros       | -    | IPTC, etc.                             | Soporte parcial o vía ExifTool. |

**Orden de parsing** (aproximado):
Exif → XMP → JSON → nombre de carpeta/archivo → fecha de modificación del sistema de archivos.

Los XMP sidecars pueden actuar como fuente "oficial" para muchos campos (palabras clave jerárquicas, descripciones, etc.).

---

## 2. Sidecars que PhotoPrism Escribe (Output / Backup)

PhotoPrism genera **YAML sidecars** de forma automática:

### Para fotos (Photo Backups)
- Se crea un archivo YAML por cada foto primaria.
- Ubicación: Configurable mediante `PHOTOPRISM_SIDECAR_PATH` (por defecto dentro de la carpeta `storage/sidecar`).
- Controlado por la variable `PHOTOPRISM_SIDECAR_YAML=true` (valor por defecto).
- Se crean y actualizan:
  - Durante el proceso de indexado.
  - Cuando se editan manualmente campos (título, fecha, ubicación, etiquetas, etc.).

### Para álbumes (Album Backups)
- Archivos YAML separados para diferentes tipos de álbumes (manuales, folders, moments, months, states, etc.).
- Ubicación por defecto: `storage/backup/albums`.

**Importante**:
- Los sidecars YAML suelen guardarse en la carpeta `storage` (no dentro de `originals`). Esto permite montar la carpeta de originales en modo **read-only**.
- Cambios hechos manualmente en los archivos YAML **no se reflejan automáticamente** en la interfaz. Solo se usan cuando se re-indexa la biblioteca.

---

## 3. Contenido que se Almacena en los Sidecars YAML

### En los YAML de fotos:
- `TakenAt` y su fuente
- UID, tipo de archivo
- Título y fuente, Caption y fuente
- Nombre original del archivo
- Zona horaria
- Fuente del lugar
- Altitud, latitud, longitud
- Año, mes, día
- Información de cámara (ISO, exposición, apertura f-number, distancia focal)
- Calidad, estado de favorito, estado privado
- Keywords + fuente
- Notas, sujetos/personas + fuente
- Artista, Copyright, Licencia
- Timestamps de creación, actualización y edición
- Estado de eliminación

### En los YAML de álbumes:
- UID, slug, tipo, título, ubicación, categoría, descripción
- Orden de ordenación
- Asignaciones de fotos (con fecha de adición)
- Filtros (para álbumes dinámicos)
- País, año, mes, día (según tipo de álbum)

---

## 4. Portabilidad y Recuperación en Caso de Desastre

Este es el punto clave para el objetivo de Blacknails.

### Estrategia de PhotoPrism:
- Los **originals** son la fuente de verdad de los archivos multimedia.
- Los **sidecars** (XMP + YAML) actúan como almacenamiento portátil y secundario de los metadatos.
- Si se pierde la base de datos (SQLite o MariaDB):
  - Es posible recuperar **una parte significativa** de los metadatos y de los álbumes usando solo los archivos YAML.
  - Recomendación oficial: realizar un re-indexado (preferiblemente "Complete Rescan").
  - El indexador lee automáticamente todos los sidecars existentes (XMP + YAML + JSON) y repuebla la base de datos.

**Citas textuales de la documentación**:
- "Some of the metadata and your albums can also be recovered from YAML sidecar files even if you don’t have a copy of the index database, unless you have disabled this feature."
- "Even if `PHOTOPRISM_SIDECAR_YAML` is set to `false`, the indexer will look for existing sidecar files and use them."

### Recomendaciones oficiales de backup:
- Respaldar la carpeta **originals**.
- Respaldar la carpeta completa **storage** (incluye sidecars, thumbnails, configuración y la propia base de datos si se usa SQLite).
- Opcionalmente: backups programados de la base de datos + YAML de álbumes.

Con solo originales + sidecars YAML es posible reconstruir una biblioteca funcional (con algunas limitaciones en datos muy internos).

---

## 5. Aspectos Técnicos

- El paquete `internal/meta/` es responsable del pipeline de metadatos:
  - Parsing de Exif (`exif.go`, `exif_parser.go`)
  - Parsing de XMP (`xmp.go`, `xmp_document.go`)
  - Parsing de JSON (Google Photos, ExifTool, motion photos)
  - Manejo de keywords, sanitización, GPS, etc.
- Mantiene trazabilidad de la **fuente** de cada campo de metadatos.
- Los YAML se generan como exportación legible por humanos.
- El indexador siempre busca sidecars existentes, independientemente de si la creación de YAML está activada o no.
- PhotoPrism **no escribe** de vuelta dentro de los archivos originales (excepto rotación/orientación) para evitar pérdida de datos y conflictos con otras aplicaciones.

---

## 6. Situación Actual en Blacknails-Media-v3

Del análisis del workspace:

- Blacknails **ya utiliza sidecars XMP** (formato XML).
- Ubicación: `library/storage/sidecars/` (con subdirectorios por hash, ej. `01/`, `02/`, etc.).
- Existe `XmlSidecarService`.
- Los workers de **Description**, **Tags** y **Title** ya llaman a `sidecarService.write(asset)`.
- La entidad `Asset` tiene el campo `sidecarPath`.
- La tabla `assets` en SQLite incluye la columna `sidecar_path`.
- Actualmente los sidecars se usan principalmente para persistir resultados de IA (descripción, etiquetas, título).
- La base de datos SQLite sigue siendo la fuente canónica de la mayoría del estado.

---

## 7. Lecciones y Conclusiones para Blacknails

PhotoPrism demuestra un modelo muy efectivo para lograr una base de datos **altamente portable y recuperable**:

### Ventajas del enfoque de sidecars:
- Metadatos independientes de la base de datos.
- Formato humano legible (YAML) + estándar de industria (XMP/XML).
- Permite montar `originals` en modo read-only.
- Recuperación parcial o total mediante re-indexado.
- Actualización automática de sidecars en ediciones manuales e indexado.

### Recomendaciones derivadas de la investigación:

1. **Ampliar el uso actual de sidecars** en Blacknails para cubrir **todos** los metadatos importantes (no solo los generados por IA).
2. Considerar escribir tanto **XMP** (para compatibilidad) como **YAML** (para riqueza de datos y legibilidad), similar a PhotoPrism.
3. Asegurar que **cada worker** que genera o modifica metadatos (descripción, tags, título, NSFW, calidad, caras, etc.) escriba consistentemente en el sidecar.
4. Implementar una ruta clara de **reconstrucción de base de datos** a partir de sidecars + escaneo de archivos originales.
5. Documentar claramente el flujo de recuperación en caso de desastre.
6. Evaluar si almacenar los sidecars fuera de `originals` (como hace PhotoPrism) para escenarios de montaje read-only.

---

**Conclusión**:
PhotoPrism usa sidecars de forma madura y deliberada como mecanismo de portabilidad y recuperación. El patrón de "originals + sidecars como fuente secundaria de metadatos" es directamente aplicable a Blacknails para conseguir el objetivo de una base de datos 100% portable y recuperable en caso de desastre.

---

*Documento generado exclusivamente con fines de investigación. Contiene solo el análisis de PhotoPrism.*