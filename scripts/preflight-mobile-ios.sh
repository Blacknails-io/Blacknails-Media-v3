#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "Checking mobile helper scripts"
bash -n \
  scripts/start-mobile-lan-server.sh \
  scripts/smoke-mobile-upload.sh \
  scripts/preflight-mobile-ios.sh \
  ios/BlacknailsSync/scripts/build-on-mac.sh \
  ios/BlacknailsSync/scripts/doctor-on-mac.sh \
  ios/BlacknailsSync/scripts/install-on-device.sh \
  ios/BlacknailsSync/scripts/package-for-mac.sh

echo "Checking iOS scaffold"
node --import tsx --test server/tests/integration/ios-project-scaffold.test.ts

echo "Checking mobile upload endpoint"
node --import tsx --test server/tests/adapters/in/http/MobileUploadController.test.ts

echo "Building server"
npm run build -w server

cat <<'MSG'

Mobile iOS preflight passed.

Next steps:
  1. Start the LAN backend:
     ADMIN_USER=<admin-user> ADMIN_PASS=<admin-password> PORT=3000 scripts/start-mobile-lan-server.sh
  2. On a Mac, open:
     ios/BlacknailsSync/BlacknailsSync.xcodeproj
  3. Select your Apple development team, connect the iPhone, and run the app.
MSG
