# Blacknails Media v3 - Plan Alpha Local-First

## Contexto

Proyecto: **Blacknails Media v3**

Ruta remota:

```bash
/srv/storage/ai-lab/Blacknails-Media-v3
```

Repositorio:

```text
https://github.com/Blacknails-io/Blacknails-Media-v3
```

Tipo de app:

- Monorepo npm con workspaces: `shared`, `server`, `client`.
- Biblioteca multimedia privada/local-first.
- Importacion, indexado, thumbnails, sidecars, IA local/Ollama, NSFW, caras/personas y UI React.
- Proyecto personal, pero expuesto detras de Nginx en `https://media.blacknails.io`, asi que la seguridad minima importa.

## Estado Actual

Ya se hizo una primera estabilizacion:

- Git inicializado y subido a GitHub.
- `.gitignore` separa codigo de datos/media/build deps.
- Builds funcionando:

```bash
npm run build --workspace=@blacknails/shared
npm run build --workspace=blacknails-media-v3-server
npm run build --workspace=blacknails-media-v3-client
```

- Tests de servidor funcionando tras rebuild de `better-sqlite3`.
- Seguridad minima aplicada:
  - Registro publico bloqueado salvo `ALLOW_PUBLIC_REGISTRATION=true`.
  - Registro ya no permite elegir rol desde el body.
  - Seeds por defecto `admin/admin123` y `partner/partner123` eliminados.
  - Rutas `/api/people` protegidas.
  - Endpoint `/test/trigger-event` protegido/desactivable con `ENABLE_TEST_ENDPOINTS=true`.
  - Tokens por query string eliminados.
- UI inicial cambiada a estilo **neo glossy cyberpunk**.
- Login compactado y estabilizado:
  - No crece al fallar login.
  - Boton `ACCEDER A LA RED` visible sin hover.

Ultimos commits importantes:

```text
f5c8f7f Initial alpha baseline
6fa65f4 Stabilize login screen layout
```

## Reglas de Trabajo

Antes de editar:

```bash
cd /srv/storage/ai-lab/Blacknails-Media-v3
git status --short --branch
```

Normas:

- No borrar datos, media, bases de datos, thumbnails, sidecars ni carpetas de libreria sin autorizacion explicita.
- Mantener cambios pequenos y verificables.
- Hacer build/test despues de cambios relevantes.
- No hacer refactors grandes si no son necesarios para el objetivo inmediato.
- No commitear sin mostrar antes `git diff`, salvo que Ivan lo pida claramente.
- Si hay cambios ajenos en el working tree, no revertirlos.

## Vision de Producto

Queremos una **alpha local-first estable**, no una demo bonita solamente.

Prioridades:

1. Segura para uso personal expuesto tras Nginx.
2. Reproducible: arranque claro, env vars documentadas, estructura limpia.
3. Visualmente potente: neo glossy cyberpunk, pero usable.
4. Preparada para iterar: importacion, galeria, inspeccion, personas, IA local.

## Direccion Visual

Estilo deseado:

- Oscuro, premium, high contrast.
- Neon cyan/magenta/verde acido con moderacion.
- Cristal/gloss, paneles transluctidos, bordes finos, glow controlado.
- Cyberpunk funcional, no decoracion que estorbe.
- UI densa y practica: esto es una herramienta multimedia, no una landing page.

Evitar:

- Login enorme.
- Botones que solo aparecen en hover.
- Texto con poco contraste.
- Layouts que saltan al mostrar errores.
- Gradientes excesivos tipo plantilla generica.
- Tarjetas dentro de tarjetas.

## Plan por Fases

### Fase 1 - Cierre de Alpha Tecnica

Objetivo: que el proyecto sea seguro, arrancable y verificable.

Tareas:

- Revisar que no quedan endpoints sensibles sin auth.
- Revisar roles `ADMIN`, `PARTNER`, `VIEWER` y permisos reales.
- Documentar `.env` necesario.
- Documentar arranque local/remoto.
- Confirmar que tests y builds pasan en limpio.
- Confirmar que Nginx apunta al backend/frontend correcto.

Comandos de verificacion:

```bash
npm run test --workspace=blacknails-media-v3-server
npm run build --workspace=@blacknails/shared
npm run build --workspace=blacknails-media-v3-server
npm run build --workspace=blacknails-media-v3-client
```

### Fase 2 - UX Principal

Objetivo: que entrar, navegar y ver media sea agradable y claro.

Tareas:

- Pulir login responsive desktop/mobile.
- Pulir shell principal: sidebar, topbar, galeria, inspector.
- Estados vacios: sin media, cargando, error, sin conexion.
- Filtros visibles y utiles.
- Acciones claras sobre assets: abrir, favoritos, tags, personas, borrar solo si esta bien protegido.
- Revisar que los thumbnails no rompen el layout.

Primera prioridad visual:

- Login final.
- Dashboard/galeria inicial.
- Inspector lateral del asset.

### Fase 3 - Importacion y Biblioteca

Objetivo: meter media sin miedo y saber que esta pasando.

Tareas:

- Revisar flujo de importacion.
- Mostrar progreso real de indexado.
- Mostrar errores de importacion.
- Evitar duplicados o documentar comportamiento.
- Confirmar sidecars y thumbnails.
- Separar claramente codigo, datos y media.

### Fase 4 - IA Local

Objetivo: integrar Ollama/IA local de forma util, no ornamental.

Tareas:

- Revisar conexion Ollama.
- Estados claros si Ollama no esta disponible.
- Jobs para tagging/descripcion/NSFW/personas.
- Cola o pipeline visible.
- No bloquear la UI si IA falla.

### Fase 5 - Documentacion y Operacion

Objetivo: que Ivan pueda recuperar el proyecto sin depender de memoria.

Archivos recomendados:

```text
README.md
docs/architecture.md
docs/deployment.md
docs/security.md
docs/design/neo-glossy-cyberpunk-vault.html
```

README minimo:

- Que es Blacknails Media.
- Requisitos.
- Instalacion.
- Variables de entorno.
- Comandos build/test/dev.
- Como levantar en servidor.
- Como acceder tras Nginx.
- Como crear usuario admin.

## Primer Encargo para el Codex Remoto

Trabaja en:

```bash
cd /srv/storage/ai-lab/Blacknails-Media-v3
```

Objetivo inmediato:

**Auditar y pulir la experiencia de login sin tocar backend.**

Pasos:

1. Revisar estado:

```bash
git status --short --branch
```

2. Revisar estos archivos:

```text
client/src/components/LoginScreen.tsx
client/src/components/LoginScreen.module.css
client/src/components/BrandLogo.module.css
client/src/App.css
```

3. Comprobar login en desktop y mobile:

- El panel no debe ser enorme.
- El boton debe verse sin hover.
- Los errores no deben cambiar el tamano de la tarjeta.
- Inputs y textos deben tener contraste suficiente.
- En pantallas bajas debe poder hacerse scroll.

4. Si haces cambios, mantenerlos pequenos.

5. Verificar:

```bash
npm run build --workspace=blacknails-media-v3-client
```

6. Mostrar:

```bash
git diff -- client/src/components/LoginScreen.tsx client/src/components/LoginScreen.module.css client/src/components/BrandLogo.module.css client/src/App.css
```

No hacer commit hasta que Ivan lo revise.

## Prompt Corto para Pegar

```text
Trabaja en /srv/storage/ai-lab/Blacknails-Media-v3.
Proyecto personal: Blacknails Media v3, biblioteca multimedia local-first.
Antes de editar ejecuta git status --short --branch.
No borres datos/media/DB/thumbnails/sidecars.

Objetivo ahora: auditar y pulir el login neo glossy cyberpunk.
Debe ser compacto, responsive, con boton visible sin hover, errores sin saltos de layout y contraste correcto.

Revisa:
- client/src/components/LoginScreen.tsx
- client/src/components/LoginScreen.module.css
- client/src/components/BrandLogo.module.css
- client/src/App.css

Si haces cambios, que sean pequenos. Al final ejecuta:
npm run build --workspace=blacknails-media-v3-client

Luego muestra git diff de los archivos tocados.
No hagas commit hasta que lo revise.
```

## Criterio de Aceptacion

Para considerar una tarea terminada:

- Build o tests relevantes pasan.
- No quedan cambios accidentales.
- El diff es entendible.
- La app sigue arrancando.
- La UI mejora sin romper funcionalidad.
- Se documenta cualquier decision importante.

