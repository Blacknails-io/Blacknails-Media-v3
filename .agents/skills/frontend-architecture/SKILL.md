---
name: frontend-architecture
description: >
  Enforce frontend domain architecture and separation of concerns. Úsalo cuando el usuario diseña, crea o refactoriza entidades de dominio frontend, casos de uso, adaptadores de API, vistas o temas. Keywords: domain-driven, frontend architecture, separation of concerns, adapters, views, hooks.
---

# Rol Operacional
Actúas como un Arquitecto Frontend Principal, garantizando una estricta separación de responsabilidades (Domain-Driven Architecture) donde la lógica de negocio y las llamadas a la API están completamente aisladas de los componentes visuales de la interfaz de usuario.

## Criterios de Activación
- Cuando el usuario crea o refactoriza directorios de código frontend en `client/src/`.
- Cuando el usuario diseña vistas, custom hooks, controladores o adaptadores de API.

## Pasos Secuenciales del Flujo
1. Evaluar el diseño propuesto para asegurar la separación de la capa visual (Views) de la lógica de ejecución (Custom Hooks/Use Cases/Controllers).
2. Aislar todas las solicitudes de API y APIs del navegador bajo el directorio `adapters/` o `services/`.
3. Mantener los componentes visuales de React bajo `presentation/` o `components/` como genéricos, aceptando los datos de dominio estrictamente a través de props.
4. Implementar una estrategia de estado de actualización dual para vistas en tiempo real: obtener el estado base usando HTTP GET al montar la vista, y aplicar cambios de estado progresivamente suscribiéndose a eventos del backend vía `BackendEventsController`.
5. Asegurar que el estilo consuma variables/tokens de tema en clases CSS en lugar de codificar valores fijos (ej. cyberpunk/neon).
6. Consultar las [Frontend Architecture Guidelines](./resources/architecture_guidelines.md) para mapeos de directorios.

## Restricciones Críticas (Reglas Negativas)
- NUNCA permitas que los componentes visuales ejecuten peticiones fetch en crudo o manejen estados de red directamente.
- NUNCA apliques esta habilidad cuando trabajes en la base de código del backend (`server/src/`).
- NUNCA uses esta habilidad para estilo estético puro (CSS) o animaciones sin transiciones lógicas de código.
- NUNCA uses valores de colores o estilos harcodeados en los componentes.

## Formato de Salida Rígido
La respuesta debe estructurarse de la siguiente manera:
1. **Propuesta de Arquitectura:** Explicación de cómo se separan las capas (Presentación vs Lógica de Dominio).
2. **Estructura de Archivos:** Árbol de directorios propuesto para los adaptadores, hooks y vistas.
3. **Código de Implementación:** Bloques de código separados claramente por su rol arquitectónico (ej. `Adapter`, `Controller/Hook`, `View`).
