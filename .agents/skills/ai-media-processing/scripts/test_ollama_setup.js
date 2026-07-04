#!/usr/bin/env node

/**
 * SCRIPT: Verificar Conectividad y Modelos de Ollama
 * 
 * Este script comprueba que Ollama esté levantado y respondiendo en el puerto
 * configurado, y que los modelos para visión y texto estén disponibles localmente.
 * 
 * Uso: node test_ollama_setup.js
 */

import http from 'http';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'blacknails-vision';
const TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || 'blacknails-text';

console.log('=== Diagnóstico de Ollama ===');
console.log(`Endpoint: ${OLLAMA_URL}`);
console.log(`Modelo de Visión Requerido: ${VISION_MODEL}`);
console.log(`Modelo de Texto Requerido: ${TEXT_MODEL}`);
console.log('-----------------------------');

const requestUrl = (urlPath, parseJson = true) => {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, OLLAMA_URL);
    const req = http.request(fullUrl, { method: 'GET', timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          if (parseJson) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error('La respuesta no es JSON válido.'));
            }
          } else {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Tiempo de espera agotado (Timeout)'));
    });
    req.end();
  });
};

async function run() {
  try {
    // 1. Probar conectividad básica (Ping)
    console.log('1. Probando conexión básica...');
    const pingResult = await requestUrl('/', false);
    console.log(`✔ Conexión establecida con éxito con el servidor Ollama: "${pingResult.trim()}"`);
    
    // 2. Obtener lista de modelos locales
    console.log('\n2. Obteniendo lista de modelos instalados...');
    const tagsData = await requestUrl('/api/tags');
    
    if (!tagsData || !Array.isArray(tagsData.models)) {
      throw new Error('Formato de respuesta incorrecto de Ollama /api/tags');
    }

    const installedModels = tagsData.models.map(m => m.name);
    console.log(`Modelos instalados detectados (${installedModels.length}):`);
    installedModels.forEach(name => console.log(` - ${name}`));

    // 3. Validar modelos requeridos
    console.log('\n3. Comprobando modelos necesarios...');
    
    // Comprobar modelo de texto
    const textModelInstalled = installedModels.some(m => m.startsWith(TEXT_MODEL));
    if (textModelInstalled) {
      console.log(`✔ Modelo de texto "${TEXT_MODEL}": INSTALADO.`);
    } else {
      console.warn(`✖ Modelo de texto "${TEXT_MODEL}": NO ENCONTRADO.`);
      console.warn(`  Sugerencia: Ejecuta 'ollama pull ${TEXT_MODEL}' en tu máquina/contenedor.`);
    }

    // Comprobar modelo de visión
    const visionModelInstalled = installedModels.some(m => m.startsWith(VISION_MODEL));
    if (visionModelInstalled) {
      console.log(`✔ Modelo de visión "${VISION_MODEL}": INSTALADO.`);
    } else {
      console.warn(`✖ Modelo de visión "${VISION_MODEL}": NO ENCONTRADO.`);
      console.warn(`  Sugerencia: Ejecuta 'ollama pull ${VISION_MODEL}' en tu máquina/contenedor.`);
    }

    if (textModelInstalled && visionModelInstalled) {
      console.log('\n🎉 ¡Configuración de Ollama correcta para Blacknails-Media-v3!');
    } else {
      console.log('\n⚠ Faltan modelos para que el pipeline funcione al 100%. Revisa los pasos anteriores.');
    }

  } catch (error) {
    console.error('\n✖ Error al conectarse a Ollama:', error.message);
    console.error('Comprueba que Ollama esté ejecutándose y que OLLAMA_URL sea correcta.');
    process.exit(1);
  }
}

run();
