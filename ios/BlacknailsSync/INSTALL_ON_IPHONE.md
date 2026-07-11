# Install Blacknails Sync On iPhone

## 0. Run Local Preflight

From the repository root on the Blacknails host:

```bash
scripts/preflight-mobile-ios.sh
```

This checks the mobile backend endpoint, the iOS project scaffold, helper script syntax, and the server build before you move to Xcode.

## 1. Start The Backend

From the repository root on the Blacknails host:

```bash
ADMIN_USER=<admin-user> ADMIN_PASS=<admin-password> PORT=3000 scripts/start-mobile-lan-server.sh
```

The script prints candidate LAN URLs. Make sure the iPhone and server are on the same network and use one of those URLs in the app, for example:

```text
http://192.168.1.10:3000
```

The script also prints matching configuration links:

```text
blacknailssync://configure?server=http%3A%2F%2F192.168.1.10%3A3000
```

It also starts a small setup page server and prints URLs like:

```text
http://192.168.1.10:3001/blacknails-sync-setup.html
```

After the app is installed, open that setup page from Safari on the iPhone and tap the matching server link to set the server URL automatically.

Check the backend from another machine or the iPhone browser:

```text
http://<server-ip>:3000/health
```

Optional backend smoke test from the repository root:

```bash
SERVER_URL=http://<server-ip>:3000 ADMIN_USER=<admin-user> ADMIN_PASS=<admin-password> scripts/smoke-mobile-upload.sh
```

This logs in, uploads a tiny `.jpg` test file through `POST /api/mobile/uploads`, and prints the accepted import filename.

## 2. Open The iOS Project

If the Mac can access this repository directly:

```bash
open ios/BlacknailsSync/BlacknailsSync.xcodeproj
```

If the Mac is a different machine, create a verified handoff package from the repository root first:

```bash
scripts/prepare-iphone-handoff.sh
```

This runs preflight and creates `ios/BlacknailsSync/build/BlacknailsSync-mac-handoff.tar.gz`.
Copy that package to the Mac, then extract and open:

```bash
tar -xzf BlacknailsSync-mac-handoff.tar.gz
open BlacknailsSync/BlacknailsSync.xcodeproj
```

Select the `BlacknailsSync` target and open `Signing & Capabilities`.

Optional: create a local install environment file so you do not need to retype the same values:

```bash
scripts/prepare-install-on-mac.sh
```

This creates `install.env` from the example if needed and lists connected iPhone devices.
You can also create the file manually:

```bash
cp install.env.example install.env
```

Then edit `install.env` with your `DEVICE_ID`, `DEVELOPMENT_TEAM`, `SERVER_URL`, and optional `PRODUCT_BUNDLE_IDENTIFIER`.
Do not leave placeholder values such as `REPLACE_WITH_SERVER_IP` or `com.REPLACE_WITH_YOUR_NAME.blacknails.sync`; the install script rejects placeholders before calling Xcode.

Before installing, run the Mac doctor. It loads `install.env` when present:

```bash
scripts/doctor-on-mac.sh
```

You can still pass `SERVER_URL` directly if you did not create `install.env`:

```bash
SERVER_URL=http://<server-ip>:3000 scripts/doctor-on-mac.sh
```

## 3. Configure Signing

- Choose your Apple ID team.
- For command-line install, use the Apple Developer Team ID shown in Xcode signing settings or in your Apple Developer membership details as `DEVELOPMENT_TEAM`.
- If Xcode says the bundle identifier is unavailable, change `com.blacknails.media.sync` to a unique value.
- Keep automatic signing enabled.

## 4. Install

### Option A: Xcode UI

- Connect the iPhone by USB, or enable wireless debugging.
- Select the iPhone as the run destination.
- Press Run in Xcode.
- On the iPhone, trust the developer profile if iOS asks for it.

### Option B: Command Line

On the Mac, list available devices:

```bash
ios/BlacknailsSync/scripts/install-on-device.sh --list-devices
```

Then install:

```bash
DEVICE_ID=<device-identifier> \
DEVELOPMENT_TEAM=<apple-team-id> \
SERVER_URL=http://<server-ip>:3000 \
ios/BlacknailsSync/scripts/install-on-device.sh
```

If you created `install.env`, you can install with:

```bash
ios/BlacknailsSync/scripts/install-on-device.sh
```

If the default bundle identifier is unavailable for your Apple ID, pass a unique one:

```bash
DEVICE_ID=<device-identifier> \
DEVELOPMENT_TEAM=<apple-team-id> \
SERVER_URL=http://<server-ip>:3000 \
PRODUCT_BUNDLE_IDENTIFIER=com.yourname.blacknails.sync \
ios/BlacknailsSync/scripts/install-on-device.sh
```

When `SERVER_URL` is set, the script checks `<server>/health` before building and prints a `blacknailssync://configure?...` link after installing.

## 5. First Run

1. Enter the server URL, for example `http://192.168.1.10:3000`, or open the printed setup page URL on the iPhone and tap the matching server link.
2. Tap `Test Connection`.
3. Enter the admin username and password.
4. Tap `Login`.
5. Tap `Load Latest 50`.
6. Grant Photos access.
7. Tap `Upload Pending`.
8. Tap `Load 50 More` after a batch finishes if you want to continue syncing older iPhone media.

If iOS shows only selected photos, the app shows `Manage Photo Access`; use it to add more items without leaving the app.
While uploads are running, the app keeps the iPhone awake to reduce interruptions during large video batches.
The network client waits for connectivity, avoids cellular/expensive networks, and allows long-running upload resources, which is important for large videos on local Wi-Fi.
Use `Cancel Upload` if you need to stop a long batch; pending items can be retried later.

Uploaded files land directly in `IMPORT_DIR`; the existing import worker owns deduplication and indexing.
The app remembers PhotoKit asset identifiers that were uploaded from this iPhone and skips them on later runs. Use `Reset Local Sync History` in the app only if you deliberately want to upload the same loaded assets again; the backend still deduplicates by file hash during import.

With a free Apple ID, the installed build may expire after 7 days. A paid Apple Developer membership avoids the short free-provisioning window.
