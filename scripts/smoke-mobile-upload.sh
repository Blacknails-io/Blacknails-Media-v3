#!/usr/bin/env bash
set -euo pipefail

SERVER_URL="${SERVER_URL:-http://127.0.0.1:3000}"
USERNAME="${ADMIN_USER:-admin}"
PASSWORD="${ADMIN_PASS:-change-me-before-first-boot}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to parse the login response" >&2
  exit 1
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

sample_file="$tmp_dir/blacknails-mobile-smoke.jpg"
printf 'blacknails-mobile-smoke\n' > "$sample_file"

echo "Checking $SERVER_URL/health"
curl --fail --silent --show-error "$SERVER_URL/health" >/dev/null

echo "Logging in as $USERNAME"
login_response="$tmp_dir/login.json"
curl --fail --silent --show-error \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\",\"rememberMe\":true}" \
  "$SERVER_URL/api/auth/login" > "$login_response"

token="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!data.token) process.exit(1); process.stdout.write(data.token)" "$login_response")"

echo "Uploading smoke media file"
upload_response="$tmp_dir/upload.json"
curl --fail --silent --show-error \
  -H "Authorization: Bearer $token" \
  -H 'X-Device-Id: smoke-test' \
  -F "media=@$sample_file;filename=blacknails-mobile-smoke.jpg;type=image/jpeg" \
  "$SERVER_URL/api/mobile/uploads" > "$upload_response"

node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (data.status !== 'accepted') { console.error(data); process.exit(1); } console.log('Accepted:', data.importPath)" "$upload_response"
