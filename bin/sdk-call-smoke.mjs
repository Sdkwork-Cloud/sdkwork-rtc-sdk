#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const IMPLEMENTED_LANGUAGES = new Set(['typescript', 'flutter']);
const OFFICIAL_LANGUAGES = [
  'typescript',
  'flutter',
  'rust',
  'java',
  'csharp',
  'swift',
  'kotlin',
  'go',
  'python',
];

function fail(message) {
  const error = new Error(message);
  error.code = 'sdk_call_smoke_dispatch_error';
  throw error;
}

function writeLine(writer, line = '') {
  writer.write(`${line}\n`);
}

function resolveFlutterBinDirectory(workspacePath) {
  const packageConfigPath = path.join(workspacePath, '.dart_tool', 'package_config.json');
  if (!existsSync(packageConfigPath)) {
    return null;
  }

  try {
    const packageConfig = JSON.parse(readFileSync(packageConfigPath, 'utf8'));
    const flutterRoot = packageConfig?.flutterRoot;
    if (typeof flutterRoot !== 'string' || !flutterRoot) {
      return null;
    }
    const flutterRootUrl = new URL(flutterRoot);
    if (flutterRootUrl.protocol !== 'file:') {
      return null;
    }
    return path.join(fileURLToPath(flutterRootUrl), 'bin');
  } catch {
    return null;
  }
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

export function parseSdkCallSmokeArgs(argv) {
  const parsed = {
    language: 'typescript',
    help: false,
    forwardArgs: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index]);
    if (token === '--language') {
      const value = String(argv[index + 1] ?? '').trim().toLowerCase();
      if (!value) {
        fail('Missing value for --language.');
      }
      parsed.language = value;
      index += 1;
      continue;
    }
    if (token === '--help' || token === '-h') {
      parsed.help = true;
      continue;
    }
    parsed.forwardArgs.push(token);
  }

  return parsed;
}

export function resolveSdkCallSmokeTarget({ workspaceRoot, language }) {
  if (!OFFICIAL_LANGUAGES.includes(language)) {
    fail(`Unsupported language: ${language}.`);
  }
  if (!IMPLEMENTED_LANGUAGES.has(language)) {
    fail(`sdk-call-smoke for language "${language}" is not implemented yet.`);
  }

  const relativeWorkspace = `sdkwork-rtc-sdk-${language}`;
  const workspacePath = path.join(workspaceRoot, relativeWorkspace);
  if (language === 'typescript') {
    const scriptPath = path.join(workspacePath, 'bin', 'sdk-call-smoke.mjs');
    if (!existsSync(scriptPath)) {
      fail(`Missing sdk-call-smoke entrypoint for ${language}: ${scriptPath}`);
    }
    return {
      language,
      workspacePath,
      command: process.execPath,
      args: [scriptPath],
    };
  }

  if (language === 'flutter') {
    const scriptPath = path.join(workspacePath, 'bin', 'sdk-call-smoke.mjs');
    if (!existsSync(scriptPath)) {
      fail(`Missing sdk-call-smoke entrypoint for ${language}: ${scriptPath}`);
    }
    return {
      language,
      workspacePath,
      command: process.execPath,
      args: [scriptPath],
    };
  }

  fail(`sdk-call-smoke target resolution is missing for language "${language}".`);
}

export function getSdkCallSmokeHelpText() {
  return [
    'SDKWork RTC SDK call smoke dispatcher',
    '',
    'Usage:',
    '  node ./bin/sdk-call-smoke.mjs [--language <language>] <language-cli-args>',
    '',
    'Behavior:',
    '  --language defaults to typescript',
    '  remaining arguments are forwarded to the target language call-smoke CLI unchanged',
    '',
    `Official languages: ${OFFICIAL_LANGUAGES.join(', ')}`,
    `Implemented today: ${Array.from(IMPLEMENTED_LANGUAGES).join(', ')}`,
  ].join('\n');
}

async function defaultRun(command, args, options) {
  const flutterBinDirectory =
    process.platform === 'win32' && command === 'flutter'
      ? resolveFlutterBinDirectory(options.cwd)
      : null;
  const commandToRun = flutterBinDirectory ? process.env.ComSpec ?? 'cmd.exe' : command;
  const argsToRun = flutterBinDirectory
    ? ['/d', '/s', '/c', buildWindowsFlutterCommandLine(flutterBinDirectory, args)]
    : args;

  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(commandToRun, argsToRun, {
      cwd: options.cwd,
      stdio: options.stdio ?? 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`sdk-call-smoke child terminated with signal ${signal}.`));
        return;
      }
      resolve(code ?? 0);
    });
  });

  if (exitCode !== 0) {
    throw new Error(`sdk-call-smoke child exited with code ${exitCode}.`);
  }

  return {
    exitCode,
  };
}

export async function runSdkCallSmokeDispatcher(
  argv = process.argv.slice(2),
  deps = {},
) {
  const stdout = deps.stdout ?? process.stdout;
  const workspaceRoot =
    deps.workspaceRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const parsed = Array.isArray(argv) ? parseSdkCallSmokeArgs(argv) : argv;

  if (parsed.help) {
    writeLine(stdout, getSdkCallSmokeHelpText());
    return {
      help: true,
      exitCode: 0,
    };
  }

  const target = resolveSdkCallSmokeTarget({
    workspaceRoot,
    language: parsed.language,
  });
  const run = deps.run ?? defaultRun;

  return run(
    target.command,
    [...target.args, ...parsed.forwardArgs],
    {
      cwd: target.workspacePath,
      stdio: deps.stdio ?? 'inherit',
    },
  );
}

const directInvocationPath = process.argv[1] ? fileURLToPath(import.meta.url) : null;

if (directInvocationPath && path.resolve(process.argv[1]) === directInvocationPath) {
  runSdkCallSmokeDispatcher().catch((error) => {
    console.error(`[sdkwork-rtc-sdk] ${error.message}`);
    process.exit(1);
  });
}
