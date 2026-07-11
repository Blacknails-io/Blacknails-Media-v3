#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
COOKIE_SECURE="${COOKIE_SECURE:-false}"
NODE_ENV="${NODE_ENV:-development}"
IMPORT_SCHEDULER_ENABLED="${IMPORT_SCHEDULER_ENABLED:-false}"
INDEX_SCHEDULER_ENABLED="${INDEX_SCHEDULER_ENABLED:-false}"
MOBILE_SETUP_PAGE="${MOBILE_SETUP_PAGE:-/tmp/blacknails-sync-setup.html}"
MOBILE_SETUP_PORT="${MOBILE_SETUP_PORT:-3001}"
declare -a MOBILE_SERVER_URLS=()
declare -a MOBILE_IP_ADDRESSES=()
declare -A MOBILE_SEEN_IP_ADDRESSES=()

print_lan_urls() {
  echo "Candidate iPhone server URLs:"

  if command -v hostname >/dev/null 2>&1; then
    while read -r ip_address; do
      print_server_url "$ip_address"
    done < <(hostname -I 2>/dev/null | tr ' ' '\n' | awk 'NF { print $1 }') || true
  fi

  if command -v ip >/dev/null 2>&1; then
    while read -r ip_address; do
      print_server_url "$ip_address"
    done < <(ip -4 addr show scope global 2>/dev/null | awk '/inet / { split($2, parts, "/"); print parts[1] }') || true
  fi

  if command -v ifconfig >/dev/null 2>&1; then
    while read -r ip_address; do
      print_server_url "$ip_address"
    done < <(ifconfig 2>/dev/null | awk '/inet / && $2 != "127.0.0.1" { print $2 }') || true
  fi
}

print_server_url() {
  local ip_address="$1"
  local server_url="http://$ip_address:$PORT"

  if [[ -n "${MOBILE_SEEN_IP_ADDRESSES[$ip_address]:-}" ]]; then
    return
  fi

  MOBILE_SEEN_IP_ADDRESSES[$ip_address]=1
  MOBILE_IP_ADDRESSES+=("$ip_address")
  MOBILE_SERVER_URLS+=("$server_url")
  echo "  $server_url"
  echo "    blacknailssync://configure?server=$(urlencode "$server_url")"
}

urlencode() {
  node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$1"
}

html_escape() {
  node -e "const value = process.argv[1]; process.stdout.write(value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\"', '&quot;').replaceAll(\"'\", '&#39;'))" "$1"
}

write_mobile_setup_page() {
  {
    cat <<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blacknails Sync Setup</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; line-height: 1.4; }
    a { display: block; margin: 12px 0; padding: 14px 16px; border: 1px solid #222; border-radius: 8px; color: #111; text-decoration: none; }
    code { word-break: break-all; }
  </style>
</head>
<body>
  <h1>Blacknails Sync Setup</h1>
  <p>Open one of these links on the iPhone after Blacknails Sync is installed.</p>
HTML

    for server_url in "${MOBILE_SERVER_URLS[@]}"; do
      local escaped_server_url
      local configure_url
      escaped_server_url="$(html_escape "$server_url")"
      configure_url="blacknailssync://configure?server=$(urlencode "$server_url")"
      printf '  <a href="%s">Use <code>%s</code></a>\n' "$configure_url" "$escaped_server_url"
    done

    cat <<'HTML'
</body>
</html>
HTML
  } > "$MOBILE_SETUP_PAGE"
}

print_setup_page_urls() {
  echo "Open this setup page from the iPhone after installing the app:"
  for ip_address in "${MOBILE_IP_ADDRESSES[@]}"; do
    echo "  http://$ip_address:$MOBILE_SETUP_PORT/$(basename "$MOBILE_SETUP_PAGE")"
  done
}

start_mobile_setup_server() {
  local setup_dir
  local setup_file

  setup_dir="$(dirname "$MOBILE_SETUP_PAGE")"
  setup_file="$(basename "$MOBILE_SETUP_PAGE")"

  MOBILE_SETUP_DIR="$setup_dir" MOBILE_SETUP_FILE="$setup_file" MOBILE_SETUP_PORT="$MOBILE_SETUP_PORT" node <<'NODE' &
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const setupDir = process.env.MOBILE_SETUP_DIR;
const setupFile = process.env.MOBILE_SETUP_FILE;
const setupPort = Number(process.env.MOBILE_SETUP_PORT);

const server = http.createServer((request, response) => {
  if (request.url !== '/' && request.url !== `/${setupFile}`) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const html = fs.readFileSync(path.join(setupDir, setupFile));
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
});

server.listen(setupPort, '0.0.0.0');
NODE
  MOBILE_SETUP_PID="$!"
  trap 'kill "$MOBILE_SETUP_PID" 2>/dev/null || true' EXIT
}

if [[ -z "${ADMIN_USER:-}" || -z "${ADMIN_PASS:-}" ]]; then
  echo "ADMIN_USER and ADMIN_PASS must be set so the iPhone app can log in." >&2
  echo "Example:" >&2
  echo "  ADMIN_USER=admin ADMIN_PASS=change-me PORT=3000 scripts/start-mobile-lan-server.sh" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to print Blacknails Sync configuration links." >&2
  exit 1
fi

print_lan_urls
write_mobile_setup_page
start_mobile_setup_server
echo
print_setup_page_urls
echo
echo "Starting Blacknails Media for iPhone sync on 0.0.0.0:$PORT"
echo "COOKIE_SECURE=$COOKIE_SECURE NODE_ENV=$NODE_ENV"
echo "Mobile setup page server on 0.0.0.0:$MOBILE_SETUP_PORT"
echo

PORT="$PORT" \
COOKIE_SECURE="$COOKIE_SECURE" \
NODE_ENV="$NODE_ENV" \
IMPORT_SCHEDULER_ENABLED="$IMPORT_SCHEDULER_ENABLED" \
INDEX_SCHEDULER_ENABLED="$INDEX_SCHEDULER_ENABLED" \
npm run dev -w server
