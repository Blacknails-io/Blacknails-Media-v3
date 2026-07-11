# Blacknails Sync iOS

Minimal native iOS client for syncing iPhone photos and videos into Blacknails Media.

## Current Scope

- SwiftUI app source files only.
- Login against `POST /api/auth/login`.
- Connection test against `GET /health`.
- Upload originals to `POST /api/mobile/uploads`.
- PhotoKit export of original photo/video resources to a temporary local file.
- Direct upload into the server import folder through the backend endpoint.
- Local sync history in `UserDefaults` so already uploaded PhotoKit asset identifiers are skipped on the next run.
- Progressive library window loading in 50-item steps, so older iPhone media can be synced after the latest items are uploaded.
- App icon asset catalog for installed iPhone builds.
- Limited Photos access support, including a `Manage Photo Access` action when iOS only exposes selected items.
- Screen idle timer suppression while uploads are running, to reduce interruptions during large video batches.
- Upload-friendly URL session with connectivity waiting, LAN/Wi-Fi network policy, and long resource timeouts for large iPhone videos.
- Cancel action for stopping long-running upload batches from the iPhone UI.

## Backend For iPhone Testing

From the repository root:

```bash
scripts/preflight-mobile-ios.sh
```

Then start the LAN backend:

```bash
ADMIN_USER=<admin-user> ADMIN_PASS=<admin-password> PORT=3000 scripts/start-mobile-lan-server.sh
```

Use one of the printed `http://<lan-ip>:3000` URLs in the iPhone app.
After the app is installed, you can also open the printed setup page URL, `http://<lan-ip>:3001/blacknails-sync-setup.html`, from Safari on the iPhone and tap a `blacknailssync://configure?server=...` link to set the server URL automatically.

Open `BlacknailsSync.xcodeproj` in Xcode. The project already references the Swift files under `Sources/BlacknailsSync/`.

## Required iOS Settings

The bundled `Info.plist` already includes:

- `NSPhotoLibraryUsageDescription`: `Blacknails Sync needs access to upload selected photos and videos to your private media server.`
- `NSLocalNetworkUsageDescription`: allows the app to connect to your LAN-hosted Blacknails Media server.
- `NSAppTransportSecurity.NSAllowsArbitraryLoads`: temporarily allows plain HTTP while the server runs on a private LAN URL such as `http://192.168.1.10:3000`.

The app requests read-only PhotoKit access.

Recommended deployment target: iOS 17 or newer.

## Install On iPhone

Full checklist: [INSTALL_ON_IPHONE.md](INSTALL_ON_IPHONE.md).

1. Open `ios/BlacknailsSync/BlacknailsSync.xcodeproj` in Xcode.
2. Select the `BlacknailsSync` target.
3. In `Signing & Capabilities`, choose your Apple ID team.
4. If Xcode reports the bundle identifier is already taken, change `com.blacknails.media.sync` to a unique value such as `com.<yourname>.blacknails.sync`.
5. Connect the iPhone by USB or enable wireless debugging.
6. Select the iPhone as the run destination.
7. Press Run.

With a free Apple ID, the installed development build may expire after 7 days. A paid Apple Developer account avoids that short free-provisioning window.

## Mac Build Check

On a Mac with Xcode installed:

```bash
ios/BlacknailsSync/scripts/doctor-on-mac.sh
ios/BlacknailsSync/scripts/build-on-mac.sh
```

If the backend is already running on the Blacknails host, set `SERVER_URL=http://<server-ip>:3000` or create `install.env` before running `doctor-on-mac.sh` to verify LAN reachability from the Mac.

## Package For Mac

If this repository is on the Blacknails host and the Mac is a different machine:

```bash
scripts/prepare-iphone-handoff.sh
```

This runs the mobile preflight, creates `ios/BlacknailsSync/build/BlacknailsSync-mac-handoff.tar.gz`, and prints the exact Mac commands for doctor checks and device install.

## Command-Line Install

On a Mac with an iPhone connected:

```bash
ios/BlacknailsSync/scripts/prepare-install-on-mac.sh
ios/BlacknailsSync/scripts/install-on-device.sh
```

The prepare script creates `install.env` from `install.env.example` if needed and lists connected iPhone devices. The install script loads `install.env`, requires `DEVELOPMENT_TEAM`, enables automatic signing provisioning through Xcode, checks the backend health endpoint when `SERVER_URL` is provided, and prints a deep link for configuring the installed app.

## Backend Contract

The iOS client builds backend URLs from path components (`api`, `auth`, `login`, etc.) so LAN base URLs with or without a trailing slash are accepted.

1. Login:

   `POST <server>/api/auth/login`

   Body:

   ```json
   { "username": "admin", "password": "password", "rememberMe": true }
   ```

2. Upload:

   `POST <server>/api/mobile/uploads`

   Headers:

   - `Authorization: Bearer <token>`
   - `X-Device-Id: <device-name>`

   Multipart field:

   - `media`: original image/video file

The server writes completed uploads directly into `IMPORT_DIR`, then the existing import worker owns deduplication and indexing.
