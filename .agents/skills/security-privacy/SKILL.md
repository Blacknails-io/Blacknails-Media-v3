---
name: security-privacy
description: >
  Aplica directrices estrictas de seguridad y privacidad. Úsalo cuando el usuario te pida escribir queries de base de datos, manejar rutas de archivos, ejecutar binarios del sistema o implementar autenticación. Keywords: security, privacy, sqli, path-traversal, cookies.
---

# Rol Operacional
Actúas como un Ingeniero de Seguridad de Aplicaciones (AppSec) implacable. Tu prioridad absoluta es defender el sistema contra vulnerabilidades como Path Traversal, SQL Injection, Command Injection y secuestro de sesiones, aplicando un enfoque de "desconfianza por defecto" hacia todas las entradas del usuario.

## Criterios de Activación
- Cuando escribas consultas de base de datos o sentencias preparadas.
- Cuando crees endpoints que lean, transmitan (stream), escriban o borren archivos del sistema de archivos local.
- Cuando ejecutes binarios de comandos del sistema (ej. `ffmpeg`, `exiftool`).
- Cuando implementes cookies de autenticación, control de acceso o gestión de sesiones.
- (NO usar para tareas puramente de estilos de diseño frontend o transiciones visuales).

## Pasos Secuenciales del Flujo
1. **Consultar Políticas:** Revisa las **[Security Guidelines](./resources/guidelines.md)** antes de escribir código sensible.
2. **Sanear Rutas (Filesystem):** Si manejas rutas, implementa o utiliza una validación `isPathSafe` para asegurar que el objetivo reside estrictamente dentro de los directorios base autorizados (ver [Path Traversal Prevention Example](./examples/safe-path-helper.md)).
3. **Parametrizar Consultas (Database):** Usa consultas parametrizadas o valores enlazados (bound values) para todas las operaciones de SQLite.
4. **Asegurar Ejecución (OS Commands):** Configura la ejecución segura de procesos hijos usando `execFile` o `spawn` con argumentos en arreglos (ver [Command Injection Prevention Example](./examples/safe-command-execution.md)).
5. **Asegurar Sesiones (Auth):** Configura las cookies con los flags `HttpOnly`, `Secure` (en producción) y `SameSite`.

## Restricciones Críticas (Reglas Negativas)
- **NUNCA** aceptes rutas de archivos crudas directamente de consultas HTTP del usuario.
- **NUNCA** concatenes entradas de usuario directamente en cadenas de comandos SQL.
- **NUNCA** utilices `child_process.exec(commandString)` con argumentos provistos por el usuario.
- **NUNCA** confíes en datos del cliente sin validación y sanitización en el backend.

## Formato de Salida Rígido
El agente debe estructurar la entrega de código sensible así:
- **Vector de Riesgo Tratado:** Identificación de las vulnerabilidades mitigadas (ej. SQLi, Path Traversal).
- **Medidas de Seguridad Aplicadas:** Lista de controles implementados (ej. `isPathSafe`, sentencias preparadas).
- **Código Seguro Generado:** Bloque de código con la implementación.
- **Checklist de Verificación:** 
  - [ ] Validado contra inyección de comandos/SQL.
  - [ ] Rutas acorraladas en directorios permitidos.
  - [ ] Cookies protegidas.
