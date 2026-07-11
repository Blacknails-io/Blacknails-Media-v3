#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_ENV_PATH="${INSTALL_ENV_PATH:-$PROJECT_DIR/install.env}"
INSTALL_ENV_EXAMPLE_PATH="$PROJECT_DIR/install.env.example"

if [[ ! -f "$INSTALL_ENV_PATH" ]]; then
  cp "$INSTALL_ENV_EXAMPLE_PATH" "$INSTALL_ENV_PATH"
  echo "Created $INSTALL_ENV_PATH from install.env.example"
else
  echo "Using existing $INSTALL_ENV_PATH"
fi

echo
echo "Connected iPhone devices:"
"$PROJECT_DIR/scripts/install-on-device.sh" --list-devices

echo
echo "Edit $INSTALL_ENV_PATH with DEVICE_ID, DEVELOPMENT_TEAM, SERVER_URL, and optional PRODUCT_BUNDLE_IDENTIFIER."
echo "Then run:"
echo "  scripts/doctor-on-mac.sh"
echo "  scripts/install-on-device.sh"
