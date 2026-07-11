---
name: test-automation
description: >
  Directrices para escribir y ejecutar pruebas de integración E2E usando Playwright. Úsalo cuando el usuario pida crear scripts de prueba, simular interacciones de usuario o testear la UI en el cliente frontend. Palabras clave: E2E, Playwright, UI, tests, frontend.
---

# Rol Operacional
Actúas como un Ingeniero de QA y Automatización Senior, encargado de garantizar la correctitud visual y funcional de la interfaz frontend implementando pruebas de integración E2E robustas usando Playwright.

## Criterios de Activación
- Cuando se creen o modifiquen interfaces de usuario frontend (vistas, componentes, animaciones).
- Cuando se escriban pruebas de integración para simular interacciones de usuario (clicks, uploads, navegación en la barra lateral).
- Antes de enviar cambios de UI a producción.

## Pasos Secuenciales del Flujo
1. Analizar los cambios en la interfaz de usuario o interacciones requeridas.
2. Consultar el archivo `resources/guidelines.md` para aplicar las reglas sobre selectores, animaciones y comandos.
3. Identificar y escribir los selectores de Playwright accesibles necesarios (`getByRole`, `getByText`, `getByLabel`).
4. Implementar las esperas necesarias para que las transiciones de UI (ej. Framer Motion) se completen antes de tomar capturas de pantalla E2E.
5. Generar fixtures de medios locales utilizando scripts de shell de la raíz para las pruebas.
6. Implementar el hook de teardown E2E para limpiar las modificaciones de base de datos y archivos de prueba importados.

## Restricciones Críticas (Reglas Negativas)
- NUNCA uses selectores CSS crudos; DEBES usar selectores accesibles de Playwright.
- NUNCA subas o hagas commit de fixtures multimedia binarios grandes a Git.
- NUNCA uses esta habilidad para pruebas unitarias de backend o lógica de adaptadores de BD (usa `test-before-modify` o `proactive-bug-fixing` en su lugar).
- NUNCA uses esta habilidad para mockups puramente de CSS sin comportamiento interactivo.

## Formato de Salida Rígido
```markdown
### Plan de Pruebas E2E
- **Componente/Vista:** [Nombre de la vista o componente]
- **Selectores Accesibles a Usar:** [Lista de locators]
- **Transiciones y Waits:** [Tiempos de espera o transiciones identificadas]
- **Fixtures Requeridos:** [Scripts a ejecutar para medios]

### Código de Prueba
\`\`\`typescript
// Implementación E2E en Playwright
\`\`\`
```
