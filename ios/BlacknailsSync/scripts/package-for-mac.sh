#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PARENT="$(dirname "$PROJECT_DIR")"
PACKAGE_DIR="${PACKAGE_DIR:-$PROJECT_DIR/build}"
PACKAGE_PATH="${PACKAGE_PATH:-$PACKAGE_DIR/BlacknailsSync-mac-handoff.tar.gz}"
TMP_PACKAGE_PATH="$(mktemp -t BlacknailsSync-mac-handoff.XXXXXX.tar.gz)"
trap 'rm -f "$TMP_PACKAGE_PATH"' EXIT

mkdir -p "$PACKAGE_DIR"
rm -f "$PACKAGE_PATH"

tar \
  --exclude='BlacknailsSync/build' \
  --exclude='BlacknailsSync/build/*' \
  --exclude='BlacknailsSync/install.env' \
  --exclude='BlacknailsSync/DerivedData' \
  --exclude='BlacknailsSync/DerivedData/*' \
  --exclude='BlacknailsSync/BlacknailsSync.xcodeproj/xcuserdata' \
  --exclude='BlacknailsSync/BlacknailsSync.xcodeproj/project.xcworkspace/xcuserdata' \
  --exclude='*.xcuserstate' \
  --exclude='*.xcscmblueprint' \
  -czf "$TMP_PACKAGE_PATH" \
  -C "$PROJECT_PARENT" \
  BlacknailsSync

mv "$TMP_PACKAGE_PATH" "$PACKAGE_PATH"
trap - EXIT

echo "Created Mac handoff package:"
echo "  $PACKAGE_PATH"
echo
echo "On the Mac:"
echo "  tar -xzf BlacknailsSync-mac-handoff.tar.gz"
echo "  open BlacknailsSync/BlacknailsSync.xcodeproj"
