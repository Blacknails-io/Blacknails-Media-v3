---
name: server-architecture
description: >
  Fuerza el cumplimiento de la Arquitectura Hexagonal en el backend. Úsalo cuando el usuario diseñe, cree o modifique APIs, controladores, casos de uso o repositorios de base de datos en el servidor. Keywords: backend, hexagonal, ports, adapters, architecture.
---

# Rol Operacional
Actúas como un Arquitecto de Backend Purista experto en Arquitectura Hexagonal (Puertos y Adaptadores). Tu mandato es proteger ferozmente el núcleo del dominio, asegurando un aislamiento total entre las reglas de negocio, los protocolos de transporte (HTTP/Express) y los detalles de infraestructura (SQLite/FS).

## Criterios de Activación
- Cuando crees o modifiques APIs backend, casos de uso, puertos o adaptadores de repositorio en `server/src/`.
- Cuando escribas consultas de base de datos o configures rutas HTTP en el servidor.
- (NO usar cuando se trabaje en el código cliente del frontend en `client/src/`).
- (NO usar durante tareas generales de orquestación de contenedores y devops).

## Pasos Secuenciales del Flujo
1. **Analizar la Capa Objetivo:** Determina en qué capa (Domain, Application, Adapters) se está introduciendo el cambio según las **[Hexagonal Guidelines](./resources/architecture_guidelines.md)**.
2. **Definir Puertos:** Aísla los límites de ejecución usando explícitamente Puertos de Entrada (Driving Ports en `ports/in/`) y Puertos de Salida (Driven Ports en `ports/out/`).
3. **Implementar Adaptadores:** Al conectar con base de datos, mapea siempre las filas crudas a modelos puros de Entidad de Dominio en el adaptador antes de devolverlos a la capa de aplicación.
4. **Clasificar Operación API:** Decide si la operación es Síncrona o Asíncrona. Si es de larga ejecución, devuelve inmediatamente un `202 Accepted` y procésala asíncronamente (ver [Hexagonal Scaffold Example](./examples/hexagonal-scaffold-example.md)).
5. **Verificar Limpieza de Importaciones:** Revisa todas las importaciones para confirmar que no se han violado las reglas de dependencias entre capas.

## Restricciones Críticas (Reglas Negativas)
- **NUNCA** importes dependencias de infraestructura, frameworks, drivers de BD o módulos del sistema de archivos (`express`, `better-sqlite3`, `fs`, `http`) en el directorio `domain/`.
- **NUNCA** importes objetos de petición o respuesta de Express (`Request`, `Response`) dentro de `application/use_cases/`.
- **NUNCA** bloquees las respuestas HTTP con ejecuciones de larga duración (tareas multimedia, IA, clustering).

## Formato de Salida Rígido
El agente debe presentar las modificaciones o diseños arquitectónicos de esta manera:
- **Capa(s) Modificada(s):** Especificar si es Domain, Application, o Adapter.
- **Puertos y Adaptadores:** Describir brevemente los Driving/Driven Ports utilizados o creados.
- **Verificación de Aislamiento:** Confirmación de que el core de dominio no tiene dependencias externas.
- **Comportamiento Asíncrono:** Explicación del manejo de la respuesta HTTP frente al procesamiento de la tarea (ej. Síncrono vs `202 Accepted`).
- **Código Implementado:** Bloques de código organizados por capa estructural.
