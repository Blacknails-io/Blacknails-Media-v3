import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { access, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../../..');
const iosRoot = resolve(repoRoot, 'ios/BlacknailsSync');
const swiftSourceRoot = resolve(iosRoot, 'Sources/BlacknailsSync');
const appIconRoot = resolve(iosRoot, 'Assets.xcassets/AppIcon.appiconset');

const requiredSwiftSources = [
  'BlacknailsAPIClient.swift',
  'BlacknailsSyncApp.swift',
  'ContentView.swift',
  'KeychainStore.swift',
  'Models.swift',
  'PhotoLibrarySyncService.swift',
  'SyncStateStore.swift',
];

describe('BlacknailsSync iOS project scaffold', () => {
  it('declares the iOS permissions needed to read and upload the photo library', async () => {
    const plist = await readFile(resolve(iosRoot, 'Info.plist'), 'utf8');
    const photoService = await readFile(resolve(swiftSourceRoot, 'PhotoLibrarySyncService.swift'), 'utf8');

    assert.match(plist, /CFBundleURLTypes/);
    assert.match(plist, /blacknailssync/);
    assert.match(plist, /NSPhotoLibraryUsageDescription/);
    assert.match(plist, /NSLocalNetworkUsageDescription/);
    assert.match(plist, /NSAppTransportSecurity/);
    assert.match(plist, /NSAllowsArbitraryLoads/);
    assert.match(photoService, /requestAuthorization\(for: \.readOnly\)/);
    assert.match(photoService, /PHPhotoLibrary\.authorizationStatus\(for: \.readOnly\)/);
    assert.match(photoService, /presentLimitedLibraryPicker/);
  });

  it('lets iPhone users expand limited Photos access from the sync screen', async () => {
    const contentView = await readFile(resolve(swiftSourceRoot, 'ContentView.swift'), 'utf8');

    assert.match(contentView, /isPhotoAccessLimited/);
    assert.match(contentView, /Manage Photo Access/);
    assert.match(contentView, /presentLimitedLibraryPicker/);
  });

  it('keeps the iPhone awake while uploading large media batches', async () => {
    const contentView = await readFile(resolve(swiftSourceRoot, 'ContentView.swift'), 'utf8');

    assert.match(contentView, /setIdleTimerDisabled/);
    assert.match(contentView, /UIApplication\.shared\.isIdleTimerDisabled = isDisabled/);
    assert.match(contentView, /setIdleTimerDisabled\(true\)/);
    assert.match(contentView, /setIdleTimerDisabled\(false\)/);
  });

  it('lets users cancel long-running sync batches from the iPhone', async () => {
    const contentView = await readFile(resolve(swiftSourceRoot, 'ContentView.swift'), 'utf8');

    assert.match(contentView, /isSyncing/);
    assert.match(contentView, /syncTask/);
    assert.match(contentView, /cancelSync/);
    assert.match(contentView, /Task\.isCancelled/);
    assert.match(contentView, /Cancel Upload/);
  });

  it('uses an upload-friendly URLSession for large iPhone media files', async () => {
    const apiClient = await readFile(resolve(swiftSourceRoot, 'BlacknailsAPIClient.swift'), 'utf8');

    assert.match(apiClient, /URLSessionConfiguration\.default/);
    assert.match(apiClient, /waitsForConnectivity = true/);
    assert.match(apiClient, /timeoutIntervalForRequest = 300/);
    assert.match(apiClient, /timeoutIntervalForResource = 7200/);
    assert.match(apiClient, /allowsCellularAccess = false/);
    assert.match(apiClient, /allowsConstrainedNetworkAccess = false/);
    assert.match(apiClient, /allowsExpensiveNetworkAccess = false/);
    assert.match(apiClient, /private let session: URLSession/);
    assert.doesNotMatch(apiClient, /URLSession\.shared\.upload/);
  });

  it('supports loading progressively larger photo library windows', async () => {
    const contentView = await readFile(resolve(swiftSourceRoot, 'ContentView.swift'), 'utf8');

    assert.match(contentView, /fetchLimit/);
    assert.match(contentView, /Load 50 More/);
    assert.match(contentView, /Button\("Load Latest/);
  });

  it('supports configuring the server URL from an iPhone deep link', async () => {
    const contentView = await readFile(resolve(swiftSourceRoot, 'ContentView.swift'), 'utf8');
    const lanServerScript = await readFile(resolve(repoRoot, 'scripts/start-mobile-lan-server.sh'), 'utf8');

    assert.match(contentView, /handleDeepLink/);
    assert.match(contentView, /url\.scheme == "blacknailssync"/);
    assert.match(contentView, /\.onOpenURL/);
    assert.match(lanServerScript, /blacknailssync:\/\/configure\?server=/);
    assert.match(lanServerScript, /encodeURIComponent/);
    assert.match(lanServerScript, /MOBILE_SETUP_PAGE/);
    assert.match(lanServerScript, /MOBILE_SETUP_PORT/);
    assert.match(lanServerScript, /blacknails-sync-setup\.html/);
    assert.match(lanServerScript, /Open this setup page from the iPhone/);
    assert.match(lanServerScript, /http\.createServer/);
    assert.match(lanServerScript, /0\.0\.0\.0/);
  });

  it('includes every Swift source file in the Xcode project', async () => {
    const project = await readFile(resolve(iosRoot, 'BlacknailsSync.xcodeproj/project.pbxproj'), 'utf8');

    for (const filename of requiredSwiftSources) {
      await access(resolve(swiftSourceRoot, filename), constants.R_OK);
      assert.match(project, new RegExp(filename.replace('.', '\\.')));
    }
  });

  it('includes a configured app icon asset catalog for the installed iPhone app', async () => {
    const project = await readFile(resolve(iosRoot, 'BlacknailsSync.xcodeproj/project.pbxproj'), 'utf8');
    const contentsJson = JSON.parse(await readFile(resolve(appIconRoot, 'Contents.json'), 'utf8')) as {
      images?: Array<{ filename?: string; size?: string; scale?: string; idiom?: string }>;
    };

    assert.match(project, /Assets\.xcassets/);
    assert.match(project, /ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon/);

    const images = contentsJson.images ?? [];
    assert.ok(images.some((image) => image.idiom === 'iphone' && image.size === '60x60' && image.scale === '3x'));
    assert.ok(images.some((image) => image.idiom === 'ios-marketing' && image.size === '1024x1024'));

    for (const image of images.filter((candidate) => candidate.filename)) {
      const icon = await readFile(resolve(appIconRoot, image.filename!));
      assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    }
  });

  it('keeps a shared scheme and Mac install scripts for physical iPhone deployment', async () => {
    const scheme = resolve(iosRoot, 'BlacknailsSync.xcodeproj/xcshareddata/xcschemes/BlacknailsSync.xcscheme');
    const preflightScript = resolve(repoRoot, 'scripts/preflight-mobile-ios.sh');
    const handoffScript = resolve(repoRoot, 'scripts/prepare-iphone-handoff.sh');
    const installEnvExample = resolve(iosRoot, 'install.env.example');
    const buildScript = resolve(iosRoot, 'scripts/build-on-mac.sh');
    const prepareInstallScript = resolve(iosRoot, 'scripts/prepare-install-on-mac.sh');
    const doctorScript = resolve(iosRoot, 'scripts/doctor-on-mac.sh');
    const installScript = resolve(iosRoot, 'scripts/install-on-device.sh');
    const packageScript = resolve(iosRoot, 'scripts/package-for-mac.sh');

    await access(scheme, constants.R_OK);
    await access(installEnvExample, constants.R_OK);
    await assertExecutable(preflightScript);
    await assertExecutable(handoffScript);
    await assertExecutable(buildScript);
    await assertExecutable(prepareInstallScript);
    await assertExecutable(doctorScript);
    await assertExecutable(installScript);
    await assertExecutable(packageScript);

    const preflightScriptText = await readFile(preflightScript, 'utf8');
    const handoffScriptText = await readFile(handoffScript, 'utf8');
    const installEnvExampleText = await readFile(installEnvExample, 'utf8');
    const prepareInstallScriptText = await readFile(prepareInstallScript, 'utf8');
    const doctorScriptText = await readFile(doctorScript, 'utf8');
    const installScriptText = await readFile(installScript, 'utf8');
    const packageScriptText = await readFile(packageScript, 'utf8');
    const installGuideText = await readFile(resolve(iosRoot, 'INSTALL_ON_IPHONE.md'), 'utf8');
    const gitignoreText = await readFile(resolve(repoRoot, '.gitignore'), 'utf8');
    assert.match(preflightScriptText, /MobileUploadController\.test\.ts/);
    assert.match(preflightScriptText, /ios-project-scaffold\.test\.ts/);
    assert.match(handoffScriptText, /preflight-mobile-ios\.sh/);
    assert.match(handoffScriptText, /package-for-mac\.sh/);
    assert.match(handoffScriptText, /BlacknailsSync-mac-handoff\.tar\.gz/);
    assert.match(handoffScriptText, /doctor-on-mac\.sh/);
    assert.match(handoffScriptText, /install-on-device\.sh/);
    assert.match(handoffScriptText, /Edit install\.env/);
    assert.match(handoffScriptText, /prepare-install-on-mac\.sh/);
    assert.match(handoffScriptText, /scripts\/doctor-on-mac\.sh/);
    assert.match(handoffScriptText, /scripts\/install-on-device\.sh/);
    assert.match(installEnvExampleText, /DEVICE_ID=/);
    assert.match(installEnvExampleText, /DEVELOPMENT_TEAM=/);
    assert.match(installEnvExampleText, /SERVER_URL=/);
    assert.match(installEnvExampleText, /PRODUCT_BUNDLE_IDENTIFIER=/);
    assert.match(installEnvExampleText, /REPLACE_WITH_DEVICE_ID/);
    assert.match(installEnvExampleText, /REPLACE_WITH_APPLE_TEAM_ID/);
    assert.match(installEnvExampleText, /REPLACE_WITH_SERVER_IP/);
    assert.doesNotMatch(installEnvExampleText, /<[^>]+>/);
    assert.match(prepareInstallScriptText, /install\.env\.example/);
    assert.match(prepareInstallScriptText, /install\.env/);
    assert.match(prepareInstallScriptText, /install-on-device\.sh" --list-devices/);
    assert.match(prepareInstallScriptText, /Edit .*INSTALL_ENV_PATH/);
    assert.match(doctorScriptText, /xcodebuild -list/);
    assert.match(doctorScriptText, /xcrun devicectl list devices/);
    assert.match(doctorScriptText, /INSTALL_ENV_PATH/);
    assert.match(doctorScriptText, /install\.env/);
    assert.match(doctorScriptText, /SERVER_URL/);
    assert.match(doctorScriptText, /\/health/);
    assert.match(installScriptText, /xcodebuild/);
    assert.match(installScriptText, /devicectl/);
    assert.match(installScriptText, /DEVICE_ID/);
    assert.match(installScriptText, /DEVELOPMENT_TEAM is required/);
    assert.match(installScriptText, /reject_placeholder/);
    assert.match(installScriptText, /REPLACE_WITH_/);
    assert.match(installScriptText, /DEVICE_ID/);
    assert.match(installScriptText, /DEVELOPMENT_TEAM/);
    assert.match(installScriptText, /SERVER_URL/);
    assert.match(installScriptText, /PRODUCT_BUNDLE_IDENTIFIER/);
    assert.match(installScriptText, /still contains a placeholder/);
    assert.match(installScriptText, /INSTALL_ENV_PATH/);
    assert.match(installScriptText, /install\.env/);
    assert.match(installScriptText, /-allowProvisioningUpdates/);
    assert.match(installScriptText, /CODE_SIGN_STYLE=Automatic/);
    assert.match(installScriptText, /SERVER_URL/);
    assert.match(installScriptText, /\/health/);
    assert.match(installScriptText, /blacknailssync:\/\/configure\?server=/);
    assert.match(packageScriptText, /tar/);
    assert.match(packageScriptText, /BlacknailsSync-mac-handoff\.tar\.gz/);
    assert.match(packageScriptText, /--exclude=.*install\.env/);
    assert.match(packageScriptText, /--exclude=.*build/);
    assert.match(packageScriptText, /--exclude=.*DerivedData/);
    assert.match(packageScriptText, /--exclude=.*xcuserdata/);
    assert.match(installGuideText, /cp install\.env\.example install\.env/);
    assert.match(installGuideText, /REPLACE_WITH_SERVER_IP/);
    assert.match(installGuideText, /scripts\/prepare-install-on-mac\.sh/);
    assert.match(installGuideText, /scripts\/doctor-on-mac\.sh/);
    assert.match(gitignoreText, /ios\/BlacknailsSync\/install\.env/);
  });
});

async function assertExecutable(path: string): Promise<void> {
  const file = await stat(path);
  assert.notEqual(file.mode & 0o111, 0, `${path} must be executable`);
}
