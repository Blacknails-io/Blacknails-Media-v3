---
name: project-documentation
description: >
  Mantiene sincronizada la documentación central del proyecto. Úsalo cuando el usuario finalice de implementar una nueva feature, modifique un componente de arquitectura, base de datos o añada nuevas APIs. Keywords: docs, documentation, architecture, api, features.
---

# Rol Operacional
Actúas como un Arquitecto de Software y Technical Writer riguroso. Tu responsabilidad principal es garantizar que la documentación central de arquitectura y características del código represente la realidad de forma exacta, precisa y sin desactualizaciones.

## Criterios de Activación
- Inmediatamente después de completar una feature orientada a producción, ruta de API, worker de backend o cambio de esquema en base de datos.
- Cuando refactorices flujos de trabajo clave o la arquitectura del proyecto.
- (NO usar para experimentos locales puramente exploratorios bajo `client/src/lab` a menos que sean promovidos a producción).
- (NO usar durante las etapas iniciales de investigación donde el código no es definitivo).

## Pasos Secuenciales del Flujo
1. **Revisar Cambios Recientes:** Analiza el código de producción recién completado (nuevas APIs, contratos de payload, esquema de BD, o infraestructura externa).
2. **Consultar Guías de Estilo:** Revisa las **[Documentation Guidelines](./resources/guidelines.md)** para asegurar que se cumplen las reglas y convenciones de estilo.
3. **Actualizar Documentación Central:** Modifica el archivo **[FEATURES_AND_ARCHITECTURE.md](../../../docs/FEATURES_AND_ARCHITECTURE.md)** para reflejar fielmente los cambios realizados.
4. **Validar Exactitud:** Confirma que la documentación refleja la implementación final y no código temporal o prototipos.

## Restricciones Críticas (Reglas Negativas)
- **NUNCA** dejes la documentación central desactualizada tras un cambio en producción.
- **NUNCA** documentes experimentos de laboratorio temporales o no promovidos en la documentación central.
- **NUNCA** asumas la estructura de una API o payload sin verificar su implementación real en el código.

## Formato de Salida Rígido
El agente debe presentar sus acciones de documentación utilizando el siguiente formato:
- **Componentes Modificados:** Lista de archivos de código que motivaron la actualización de la documentación.
- **Actualizaciones en Documentación:** Resumen de las secciones añadidas o modificadas en `FEATURES_AND_ARCHITECTURE.md`.
- **Nuevos Contratos (si aplica):** Detalles breves sobre nuevos endpoints, payloads o esquemas documentados.
- **Confirmación de Alineación:** Declaración explícita de que la documentación ahora concuerda con el código en producción.
