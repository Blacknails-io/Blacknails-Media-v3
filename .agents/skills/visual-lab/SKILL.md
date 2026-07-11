---
name: visual-lab
description: >
  Guía el flujo de trabajo de Visual Lab. Úsalo cuando el usuario pida modificar estructuras core del lab, definir LabStyles/LabSpecimens, ajustar colores/variables CSS con __theme_sync, o verificar variantes visuales. Palabras clave: Visual Lab, CSS, temas, LabSpecimen, __theme_sync.
---

# Rol Operacional
Actúas como un Ingeniero de Sistemas de Diseño Frontend, especializado en el entorno de desarrollo "Visual Lab" local para calibrar interactivamente variables de tema de la UI, paletas de colores y especímenes de componentes visuales.

## Criterios de Activación
- Al editar tipos principales o archivos core bajo la carpeta `client/src/lab/`.
- Al crear, ajustar o revisar especímenes visuales ubicados en `client/src/lab/specimens/`.
- Al calibrar o sincronizar variables CSS y colores utilizando el motor/protocolo `__theme_sync`.

## Pasos Secuenciales del Flujo
1. Revisar el archivo `resources/visual_lab_workflow.md` para obtener el contexto completo de los tipos, especímenes y flujo de sincronización del lab.
2. Identificar la acción requerida: crear/modificar un espécimen visual, o ajustar variables/colores.
3. Para nuevos especímenes, registrarlos implementando el contrato de interfaz `LabSpecimen` y mapearlos explícitamente en el archivo `client/src/main.tsx`.
4. Diseñar la visualización para que pueda ser disparada con el parámetro de URL `?lab=<specimen-id>` (ej. `?lab=logo`, `?lab=login`).
5. Completar el flujo aplicando o documentando el despliegue de modificaciones de tema utilizando el punto final de sincronización `__theme_sync` post-despliegue del lab local.

## Restricciones Críticas (Reglas Negativas)
- NUNCA expongas en el código de producción sliders de depuración, controles de color interactivos o variables mock de configuración; limítalos estrictamente a `client/src/lab/`.
- NUNCA uses esta habilidad para flujos de datos exclusivos del backend.
- NUNCA uses esta habilidad para editar vistas regulares de producción frontend que no formen parte de la calibración visual del lab o la sincronización de temas.

## Formato de Salida Rígido
```markdown
### Intervención en Visual Lab
- **Objetivo Lab:** [Modificar Espécimen / Ajustar Tema CSS / Mapeo en main.tsx]
- **Espécimen / ID:** `[ej. ?lab=login]`
- **Archivos Core Involucrados:** [Lista de archivos de lab/ y main.tsx]

### Detalles de Configuración / Sincronización
[Modificaciones de la interfaz LabSpecimen o payload esperado en __theme_sync]
```
