#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="$PROJECT_DIR/BlacknailsSync.xcodeproj"
INSTALL_ENV_PATH="${INSTALL_ENV_PATH:-$PROJECT_DIR/install.env}"

if [[ -f "$INSTALL_ENV_PATH" ]]; then
  set -a
  source "$INSTALL_ENV_PATH"
  set +a
fi

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name was not found. $install_hint" >&2
    exit 1
  fi
}

require_command xcodebuild "Install Xcode and open it once to accept required setup."
require_command xcrun "Install Xcode command line tools."

if [[ ! -d "$PROJECT_PATH" ]]; then
  echo "Xcode project was not found at $PROJECT_PATH" >&2
  exit 1
fi

echo "Checking Xcode project and schemes"
xcodebuild -list -project "$PROJECT_PATH"

echo
echo "Checking connected iPhone devices"
xcrun devicectl list devices

if [[ -n "${SERVER_URL:-}" ]]; then
  require_command curl "curl is required to check the Blacknails backend health endpoint."
  echo
  echo "Checking $SERVER_URL/health"
  curl --fail --silent --show-error "$SERVER_URL/health" >/dev/null
fi

cat <<'MSG'

Mac doctor passed.

Next install command:
  scripts/install-on-device.sh
MSG
