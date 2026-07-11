#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="$PROJECT_DIR/BlacknailsSync.xcodeproj"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$PROJECT_DIR/build/DerivedData}"
APP_PATH="$DERIVED_DATA_PATH/Build/Products/Debug-iphoneos/BlacknailsSync.app"
INSTALL_ENV_PATH="${INSTALL_ENV_PATH:-$PROJECT_DIR/install.env}"

urlencode() {
  node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$1"
}

reject_placeholder() {
  local variable_name="$1"
  local variable_value="$2"

  if [[ "$variable_value" == *'<'* || "$variable_value" == *'>'* || "$variable_value" == *'REPLACE_WITH_'* ]]; then
    echo "$variable_name still contains a placeholder. Edit $INSTALL_ENV_PATH before installing." >&2
    exit 1
  fi
}

if [[ -f "$INSTALL_ENV_PATH" ]]; then
  set -a
  source "$INSTALL_ENV_PATH"
  set +a
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "xcodebuild was not found. Run this on a Mac with Xcode installed." >&2
  exit 1
fi

if ! xcrun devicectl --help >/dev/null 2>&1; then
  echo "xcrun devicectl was not found. Install a recent Xcode version and command line tools." >&2
  exit 1
fi

if [[ "${1:-}" == "--list-devices" ]]; then
  xcrun devicectl list devices
  exit 0
fi

if [[ -z "${DEVICE_ID:-}" ]]; then
  echo "DEVICE_ID is required. List devices with:" >&2
  echo "  ios/BlacknailsSync/scripts/install-on-device.sh --list-devices" >&2
  echo "Then run:" >&2
  echo "  DEVICE_ID=<identifier> DEVELOPMENT_TEAM=<team-id> ios/BlacknailsSync/scripts/install-on-device.sh" >&2
  exit 1
fi

reject_placeholder DEVICE_ID "$DEVICE_ID"

if [[ -z "${DEVELOPMENT_TEAM:-}" ]]; then
  echo "DEVELOPMENT_TEAM is required for physical iPhone signing." >&2
  echo "Find it in Apple Developer account membership details or Xcode signing settings." >&2
  echo "Then run:" >&2
  echo "  DEVICE_ID=<identifier> DEVELOPMENT_TEAM=<team-id> ios/BlacknailsSync/scripts/install-on-device.sh" >&2
  exit 1
fi

reject_placeholder DEVELOPMENT_TEAM "$DEVELOPMENT_TEAM"

if [[ -n "${SERVER_URL:-}" ]]; then
  reject_placeholder SERVER_URL "$SERVER_URL"
fi

if [[ -n "${PRODUCT_BUNDLE_IDENTIFIER:-}" ]]; then
  reject_placeholder PRODUCT_BUNDLE_IDENTIFIER "$PRODUCT_BUNDLE_IDENTIFIER"
fi

if [[ -n "${SERVER_URL:-}" ]]; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required when SERVER_URL is set." >&2
    exit 1
  fi

  if ! command -v node >/dev/null 2>&1; then
    echo "node is required when SERVER_URL is set." >&2
    exit 1
  fi

  echo "Checking $SERVER_URL/health"
  curl --fail --silent --show-error "$SERVER_URL/health" >/dev/null
fi

build_settings=(
  -project "$PROJECT_PATH"
  -scheme BlacknailsSync
  -configuration Debug
  -destination "platform=iOS,id=$DEVICE_ID"
  -derivedDataPath "$DERIVED_DATA_PATH"
  -allowProvisioningUpdates
  CODE_SIGN_STYLE=Automatic
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM"
)

if [[ -n "${PRODUCT_BUNDLE_IDENTIFIER:-}" ]]; then
  build_settings+=(PRODUCT_BUNDLE_IDENTIFIER="$PRODUCT_BUNDLE_IDENTIFIER")
fi

xcodebuild "${build_settings[@]}" build

if [[ ! -d "$APP_PATH" ]]; then
  echo "Build completed but app bundle was not found at $APP_PATH" >&2
  exit 1
fi

xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"
echo "Installed BlacknailsSync on device $DEVICE_ID"

if [[ -n "${SERVER_URL:-}" ]]; then
  echo "Open this on the iPhone to configure the installed app:"
  echo "  blacknailssync://configure?server=$(urlencode "$SERVER_URL")"
fi
