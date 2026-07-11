#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="$PROJECT_DIR/BlacknailsSync.xcodeproj"

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "xcodebuild was not found. Run this on a Mac with Xcode installed." >&2
  exit 1
fi

xcodebuild -list -project "$PROJECT_PATH"
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme BlacknailsSync \
  -destination 'generic/platform=iOS' \
  -configuration Debug \
  build
