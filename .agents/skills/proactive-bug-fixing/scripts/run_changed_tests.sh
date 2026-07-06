#!/usr/bin/env bash

# Script para ejecutar tests asociados a los archivos modificados en Git.
#
# Uso: ./run_changed_tests.sh

set -e

# Asegurar que estamos en la raíz del proyecto
cd "$(git rev-parse --show-toplevel)"

echo "=== Buscando archivos modificados en Git ==="
MODIFIED_FILES=$(git status --porcelain | awk '{print $2}' | grep -E '\.ts$|\.tsx$' || true)

if [ -z "$MODIFIED_FILES" ]; then
  echo "No se encontraron archivos de TypeScript modificados en el estado de Git."
  echo "Ejecutando todos los tests por defecto..."
  npm run test --workspace=blacknails-media-v3-server
  exit 0
fi

echo "Archivos modificados detectados:"
echo "$MODIFIED_FILES"
echo ""
echo "=== Emparejando y ejecutando tests ==="

# Buscar tests que coincidan con los nombres de archivos modificados
TESTS_TO_RUN=()
for FILE in $MODIFIED_FILES; do
  BASENAME=$(basename "$FILE" | sed -E 's/\.(ts|tsx)$//')
  
  # Buscar un archivo de test en la carpeta tests del servidor
  TEST_FILE=$(find server/tests -name "${BASENAME}.test.ts" -o -name "${BASENAME}.spec.ts" | head -n 1 || true)
  
  if [ -n "$TEST_FILE" ]; then
    echo "Asociando: $FILE -> $TEST_FILE"
    TESTS_TO_RUN+=("$TEST_FILE")
  fi
done

if [ ${#TESTS_TO_RUN[@]} -eq 0 ]; then
  echo "No se encontraron archivos de test directos para las modificaciones actuales."
  echo "Ejecutando todos los tests para asegurar que no hay regresiones..."
  npm run test --workspace=blacknails-media-v3-server
else
  echo "Ejecutando los siguientes tests:"
  for TEST in "${TESTS_TO_RUN[@]}"; do
    echo " - $TEST"
  done
  echo ""
  
  # Ejecutar los tests asociados
  # Usamos tsx para importar y correr en caliente los tests individuales
  node --import tsx --test "${TESTS_TO_RUN[@]}"
fi
