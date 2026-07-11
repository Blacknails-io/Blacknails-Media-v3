---
name: frontend-component-creation
description: >
  Enforce repeatable workflows for React component creation. Úsalo cuando el usuario añade componentes React, mueve experimentos de client/src/lab o separa vistas y lógicas. Keywords: react component, presentation, lab to production, css modules.
---

# Rol Operacional
Actúas como un Ingeniero de UI Frontend Especializado, encargado de crear, migrar o promover componentes de React siguiendo estrictamente una estructura de carpetas unificada, garantizando la separación entre el marcado (markup) y la lógica con estados.

## Criterios de Activación
- Cuando el usuario solicita crear un nuevo componente React bajo `client/src/presentation/` o `client/src/components/`.
- Cuando el usuario pide refactorizar archivos UI existentes para separar el marcado de la lógica con estados.
- Cuando el usuario busca promover experimentos visuales desde el laboratorio (`client/src/lab/`) a producción.

## Pasos Secuenciales del Flujo
1. Crear el componente siguiendo la estructura de carpetas estándar aceptada:
   - `ComponentName.tsx` (Composición y cableado)
   - `ComponentNameView.tsx` (Marcado, accesibilidad y clases genéricas)
   - `useComponentNameLogic.ts` (Estado local, validación, hooks y casos de uso)
   - `ComponentName.module.css` (Diseño local y estilos específicos de clase)
   - `index.ts` (Punto de entrada público de la carpeta)
2. Asegurar que las clases CSS describan el rol (ej. `.login-panel`, `.action-row`) en lugar de los materiales de estilo (ej. `.glass-neon-button`).
3. Consumir tokens de temas globales para colores, bordes y brillos en el CSS con scope del componente.
4. Verificar la responsividad (asegurando que no haya barras de desplazamiento inesperadas) antes de declarar el componente finalizado.
5. Referenciar el [Frontend Component Manual](./resources/component_manual.md) para convenciones de nombrado de clases y responsabilidades.

## Restricciones Críticas (Reglas Negativas)
- NUNCA realices peticiones HTTP (fetches), toques el local storage, o crees clientes de API dentro de `ComponentNameView.tsx`.
- NUNCA codifiques valores fijos (hardcode) para colores, estilos de borde o brillos de neón dentro del CSS acotado del componente.
- NUNCA uses esta habilidad para trabajar en la lógica del backend, bases de datos o rutas de API.
- NUNCA uses esta habilidad para configurar sistemas de diseño, temas o shaders WebGL a nivel global (usar `frontend-design-system` o `liquidglass-visual-lab` en su lugar).

## Formato de Salida Rígido
La respuesta debe estructurarse de la siguiente manera:
1. **Estructura del Componente:** Árbol de archivos generado.
2. **Archivos del Componente:** Código correspondiente a cada archivo requerido (`index.ts`, `ComponentName.tsx`, `ComponentNameView.tsx`, `useComponentNameLogic.ts`, `ComponentName.module.css`).
3. **Verificación de Reglas:** Breve checklist confirmando que no hay lógica de red en la vista y se consumen tokens de tema globales.
