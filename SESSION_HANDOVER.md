# Session Handover: Blacknails Media v3

## 🎯 Objetivo Actual
Estamos construyendo la nueva arquitectura v3 de Blacknails Media. Se trata de un sistema "Event-driven" (basado en eventos) con un pipeline de procesamiento de medios (Daemon Workers) y un frontend en React (Vite) de temática ciberpunk/isométrica. 

## 🏗️ Estado de la Arquitectura
- **Backend (Mock Server)**: Tenemos un `mock-server.ts` que simula la infraestructura real, utilizando un `InMemoryEventBus` y un patrón Outbox (`OutboxDispatcher`) guardado en SQLite (`.mock-library/local_library.db`).
- **Workers**: Existen workers de indexación y procesamiento (ej. `ImportTaskRunner`, `IndexTaskRunner`) que extienden de `DaemonWorker` y exponen métricas como `pendingItems` y `currentlyProcessing`.
- **Frontend**: El cliente consume métricas desde `/api/admin/pipeline/workers` y dibuja un Canvas Isométrico en `/admin/pipeline` (`PipelineControlCenter.tsx`). 

## ✅ Lo que hemos logrado en esta sesión
1. **Pipeline Visualizer**: Integramos las métricas de carga (`pendingItems` / `currentlyProcessing`) del backend directamente en los nodos isométricos del frontend. Solucionamos todos los errores estrictos de TypeScript (`never[]`).
2. **E2E Testing (Zero Broken Windows)**: Implementamos y logramos pasar exitosamente 6 tests de Playwright para el frontend:
   - `login.spec.ts` (Validación y redirección)
   - `pipeline.spec.ts` (Renderizado del Canvas)
   - `people.spec.ts` (Directorio de personas)
   - `gallery.spec.ts` (End-to-End comprobando que los eventos del mock server renderizan el media en el frontend).
3. **Optimización**: Identificamos que ejecutar muchos workers de Playwright en paralelo colapsa temporalmente el servidor físico, acordamos usar `--workers=1` o limitar la concurrencia.

## 🧠 Reglas de Oro (Directrices del Usuario)
- **"El original es sagrado"**: Nunca se modifica el archivo multimedia original.
- **Testing Pyramid**: Los "Business tests" deben probar los UseCases directamente en el servidor (sin depender de versiones de API). El "Mock Server" se usa exclusivamente para que el Frontend pueda hacer tests E2E / Integración (como los de Playwright).

## 🚀 Siguientes Pasos (A abordar en la nueva sesión)
1. **Business Tests (Resilience)**: Implementar en el backend los test de lógica de negocio (formato GIVEN/WHEN/THEN) para los casos de fallo:
   - **Caso 4**: Content mismatch (desajuste de contenido).
   - **Caso 5**: Metadata corruption (corrupción de metadatos).
   - *Nota*: La inyección de datos para probar esto NO la hace el servidor, sino que forma parte de la configuración del test.
2. **Event-driven UI updates**: Transicionar los componentes del frontend para que se suscriban a los eventos SSE directamente y se actualicen en tiempo real, reemplazando el polling actual.
