#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_ROOT="$REPO_ROOT/ios/BlacknailsSync"
PACKAGE_PATH="${PACKAGE_PATH:-$IOS_ROOT/build/BlacknailsSync-mac-handoff.tar.gz}"

echo "Running mobile iOS preflight"
"$REPO_ROOT/scripts/preflight-mobile-ios.sh"

echo
echo "Creating Mac handoff package"
PACKAGE_PATH="$PACKAGE_PATH" "$IOS_ROOT/scripts/package-for-mac.sh"

if [[ ! -f "$PACKAGE_PATH" ]]; then
  echo "Expected package was not created at $PACKAGE_PATH" >&2
  exit 1
fi

echo
echo "iPhone handoff package is ready:"
echo "  $PACKAGE_PATH"
echo
echo "Copy it to the Mac, then run:"
echo "  tar -xzf BlacknailsSync-mac-handoff.tar.gz"
echo "  cd BlacknailsSync"
echo "  scripts/prepare-install-on-mac.sh"
echo "  Edit install.env with DEVICE_ID, DEVELOPMENT_TEAM, SERVER_URL, and optional PRODUCT_BUNDLE_IDENTIFIER"
echo "  scripts/doctor-on-mac.sh"
echo "  scripts/install-on-device.sh"
