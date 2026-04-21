#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const RTC_CALL_SMOKE_DEVICE_ID = 'device-smoke';
const RTC_SIGNALING_TRANSPORT_STANDARD = Object.freeze({
  transportTerm: 'websocket-only',
  authConfigPath: 'connectOptions.webSocketAuth',
  authPassThroughTerm: 'signaling-sdk-pass-through',
  recommendedAuthMode: 'automatic',
  deviceIdAuthorityTerm: 'top-level-device-id',
  connectOptionsDeviceIdRuleTerm: 'must-match-top-level-device-id',
  liveConnectionTerm: 'shared-im-live-connection',
  pollingFallbackTerm: 'not-supported',
  authFailureTerm: 'fail-fast',
});

function fail(message) {
  const error = new Error(message);
  error.code = 'sdkwork_rtc_flutter_call_smoke_error';
  throw error;
}

function writeLine(writer, line = '') {
  writer.write(`${line}\n`);
}

function quoteWindowsCmdArgument(argument) {
  const value = String(argument);
  if (!/[\s"]/u.test(value)) {
    return value;
  }
  return `"${value.replace(/"/gu, '""')}"`;
}

function buildWindowsCommandLine(command, args) {
  return [command, ...args.map(quoteWindowsCmdArgument)].join(' ');
}

function resolveFlutterBinDirectory(workspaceRoot) {
  const packageConfigPath = path.join(workspaceRoot, '.dart_tool', 'package_config.json');
  const packageConfig = JSON.parse(readFileSync(packageConfigPath, 'utf8'));
  const flutterRootUrl = new URL(packageConfig.flutterRoot);
  return path.join(fileURLToPath(flutterRootUrl), 'bin');
}

function buildWindowsFlutterCommandLine(flutterBinDirectory, args) {
  const bootstrapPath = [
    'C:\\Windows\\System32',
    'C:\\Windows',
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0',
    'C:\\Program Files\\Git\\cmd',
    flutterBinDirectory,
  ].join(';');

  return `set CONDA_NO_PLUGINS=true&& set PATH=${bootstrapPath}&& ${buildWindowsCommandLine(
    'flutter',
    args,
  )}`;
}

function parseArgs(argv) {
  const parsed = {
    help: false,
    json: false,
    reuseLiveConnection: false,
  };

  for (const token of argv) {
    if (token === '--help' || token === '-h') {
      parsed.help = true;
      continue;
    }
    if (token === '--json') {
      parsed.json = true;
      continue;
    }
    if (token === '--reuse-live-connection') {
      parsed.reuseLiveConnection = true;
      continue;
    }
    fail(`Unexpected positional argument "${token}".`);
  }

  return parsed;
}

function getHelpText() {
  return [
    'SDKWork RTC Flutter call smoke CLI',
    '',
    'Usage:',
    '  node ./bin/sdk-call-smoke.mjs [--json] [--reuse-live-connection]',
    '',
    'Behavior:',
    '  runs an analyze-backed smoke for the public Flutter rtc_sdk call stack',
    '  verifies the sdk-call-smoke.dart scenario source compiles under flutter analyze',
    '  the analyzed source covers both RTC-owned WebSocket signaling and shared liveConnection reuse',
    '  summary output includes the resolved RTC signaling transport descriptor contract',
    '  current toolchain note: the official volc_engine_rtc package crashes under Dart VM CLI compilation,',
    '  so this wrapper is the executable standard smoke entrypoint until vendor/runtime support improves',
  ].join('\n');
}

function buildRtcCallSmokeSignalingTransportSummary(parsed) {
  return {
    deviceId: RTC_CALL_SMOKE_DEVICE_ID,
    connectOptionsDeviceId: RTC_CALL_SMOKE_DEVICE_ID,
    authMode: RTC_SIGNALING_TRANSPORT_STANDARD.recommendedAuthMode,
    usesSharedLiveConnection: parsed.reuseLiveConnection,
    transportTerm: RTC_SIGNALING_TRANSPORT_STANDARD.transportTerm,
    authConfigPath: RTC_SIGNALING_TRANSPORT_STANDARD.authConfigPath,
    authPassThroughTerm: RTC_SIGNALING_TRANSPORT_STANDARD.authPassThroughTerm,
    recommendedAuthMode: RTC_SIGNALING_TRANSPORT_STANDARD.recommendedAuthMode,
    deviceIdAuthorityTerm: RTC_SIGNALING_TRANSPORT_STANDARD.deviceIdAuthorityTerm,
    connectOptionsDeviceIdRuleTerm:
      RTC_SIGNALING_TRANSPORT_STANDARD.connectOptionsDeviceIdRuleTerm,
    liveConnectionTerm: RTC_SIGNALING_TRANSPORT_STANDARD.liveConnectionTerm,
    pollingFallbackTerm: RTC_SIGNALING_TRANSPORT_STANDARD.pollingFallbackTerm,
    authFailureTerm: RTC_SIGNALING_TRANSPORT_STANDARD.authFailureTerm,
  };
}

function buildSummary(workspaceRoot, parsed) {
  return {
    language: 'flutter',
    smokeMode: 'analysis-backed',
    runtimeStatus: 'vendor-sdk-cli-runtime-blocked',
    defaultProviderKey: 'volcengine',
    scenarioVariant: parsed.reuseLiveConnection ? 'reuse-live-connection' : 'default-connection',
    signalingTransport: buildRtcCallSmokeSignalingTransportSummary(parsed),
    verifiedEntrypoint: path.join('sdkwork-rtc-sdk-flutter', 'bin', 'sdk-call-smoke.dart'),
    verifiedSurface: [
      'createStandardRtcCallControllerStack',
      'CreateStandardRtcCallControllerStackOptions.deviceId',
      'CreateStandardRtcCallControllerStackOptions.liveConnection',
      'createOfficialVolcengineFlutterRtcDriver',
      'ImSdkClient.create',
      'ImSdkClient.connect',
      'ImConnectOptions.webSocketAuth',
      'WebSocket-only signaling without polling fallback',
      'RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY',
    ],
    workspaceRoot,
  };
}

function createTextSummary(summary) {
  return [
    'SDKWork RTC Flutter call smoke',
    `smoke mode: ${summary.smokeMode}`,
    `runtime status: ${summary.runtimeStatus}`,
    `default provider: ${summary.defaultProviderKey}`,
    `scenario variant: ${summary.scenarioVariant}`,
    `signaling transport: ${summary.signalingTransport.transportTerm}`,
    `signaling auth mode: ${summary.signalingTransport.authMode}`,
    `signaling device id: ${summary.signalingTransport.deviceId}`,
    `signaling connectOptions.deviceId: ${summary.signalingTransport.connectOptionsDeviceId}`,
    `signaling shared live connection: ${summary.signalingTransport.usesSharedLiveConnection}`,
    `signaling polling fallback: ${summary.signalingTransport.pollingFallbackTerm}`,
    `verified entrypoint: ${summary.verifiedEntrypoint}`,
    `verified surface: ${summary.verifiedSurface.join(', ')}`,
  ].join('\n');
}

async function runFlutterAnalyze(workspaceRoot) {
  const flutterBinDirectory = resolveFlutterBinDirectory(workspaceRoot);
  const commandToRun = process.platform === 'win32' ? process.env.ComSpec ?? 'cmd.exe' : 'flutter';
  const argsToRun =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', buildWindowsFlutterCommandLine(flutterBinDirectory, ['analyze', './bin/sdk-call-smoke.dart'])]
      : ['analyze', './bin/sdk-call-smoke.dart'];

  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(commandToRun, argsToRun, {
      cwd: workspaceRoot,
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`flutter analyze terminated with signal ${signal}.`));
        return;
      }
      resolve(code ?? 0);
    });
  });

  if (exitCode !== 0) {
    fail(`flutter analyze failed with exit code ${exitCode}.`);
  }
}

export async function runFlutterCallSmokeCli(argv = process.argv.slice(2), deps = {}) {
  const stdout = deps.stdout ?? process.stdout;
  const workspaceRoot =
    deps.workspaceRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const parsed = parseArgs(argv);

  if (parsed.help) {
    writeLine(stdout, getHelpText());
    return {
      help: true,
      exitCode: 0,
    };
  }

  await runFlutterAnalyze(workspaceRoot);
  const summary = buildSummary(workspaceRoot, parsed);

  if (parsed.json) {
    writeLine(stdout, JSON.stringify(summary, null, 2));
  } else {
    writeLine(stdout, createTextSummary(summary));
  }

  return {
    exitCode: 0,
    summary,
  };
}

const directInvocationPath = process.argv[1] ? fileURLToPath(import.meta.url) : null;

if (directInvocationPath && path.resolve(process.argv[1]) === directInvocationPath) {
  runFlutterCallSmokeCli().catch((error) => {
    console.error(`[sdkwork-rtc-sdk-flutter] ${error.message}`);
    process.exit(1);
  });
}
