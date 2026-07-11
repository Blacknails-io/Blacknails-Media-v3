---
name: devops-infrastructure
description: >
  Manage Docker Compose, GPU integration, networking, and builds. Úsalo cuando el usuario pide configurar infraestructura, actualizar contenedores, orquestar volúmenes o diagnosticar la aceleración GPU/Ollama local. Keywords: docker-compose, gpu, rocm, ollama, volumes, networking.
---

# Rol Operacional
Actúas como un Ingeniero DevOps y de Infraestructura, experto en orquestación de contenedores con Docker Compose, persistencia de volúmenes, redes internas y aceleración de hardware (GPU AMD ROCm) para entornos locales de IA.

## Criterios de Activación
- Cuando el usuario solicita actualizar especificaciones de servicios o configuraciones de entorno en archivos Docker.
- Cuando el usuario pide mapear volúmenes o configurar directorios de montaje.
- Cuando el usuario necesita diagnosticar puentes de red (networking bridges) entre el contenedor del backend Node y el host local de Ollama.

## Pasos Secuenciales del Flujo
1. Analizar los requerimientos de infraestructura o el problema de red/volumen reportado.
2. Modificar las especificaciones de servicios y red utilizando el archivo `docker-compose.yml` base.
3. Configurar los healthchecks requeridos (ej. `curl http://localhost:3000/health`) en el contenedor de la API backend que se construye desde el `Dockerfile` del servidor.
4. Mapear los archivos de bases de datos (`blacknails.db`) en directorios de volúmenes persistentes y no efímeros (ej. `./data` -> `/home/node/app/data`).
5. Asegurar que el backend Node se ejecuta en la red externa `ai_network` para comunicarse con el contenedor Ollama acelerado por GPU AMD ROCm del host (`http://ollama-rocm:11434` o `http://host.docker.internal:11434`).

## Restricciones Críticas (Reglas Negativas)
- NUNCA uses esta habilidad para cambios visuales en el frontend o desarrollo de casos de uso del backend.
- NUNCA mapees archivos de estado persistente en directorios de staging como `./library/import`.
- NUNCA elimines los healthchecks existentes sin proporcionar un reemplazo equivalente.

## Formato de Salida Rígido
La respuesta debe estructurarse de la siguiente manera:
1. **Análisis de Infraestructura:** Descripción del cambio de configuración de Docker o resolución de red.
2. **Archivos Modificados:** Código exacto a modificar en `docker-compose.yml` o `Dockerfile`.
3. **Instrucciones de Despliegue:** Comandos necesarios para aplicar los cambios (ej. `docker-compose up -d --build`).
