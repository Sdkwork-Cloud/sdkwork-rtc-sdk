#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  resolveRtcSdkAppRootFromWorkspaceRoot,
  resolveRtcSdkWorkspaceRoot,
} from './rtc-standard-file-helpers.mjs';

function fail(message) {
  throw new Error(message);
}

function runCommand(label, command, args, cwd, options = {}) {
  const optional = options.optional === true;

  console.log(`[sdkwork-rtc-sdk] ${optional ? 'optional' : 'required'} step: ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    if (optional && result.error.code === 'ENOENT') {
      console.log(
        `[sdkwork-rtc-sdk] skipped optional step "${label}" because "${command}" is not available`,
      );
      return {
        label,
        status: 'skipped',
        reason: `command "${command}" is not available`,
      };
    }

    fail(`${label} failed to start: ${result.error.message}`);
  }

  if (result.signal) {
    fail(`${label} terminated with signal ${result.signal}`);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    fail(`${label} failed with exit code ${result.status}`);
  }

  return {
    label,
    status: 'passed',
  };
}

function runRequiredNodeStep(label, args, cwd) {
  return runCommand(label, process.execPath, args, cwd);
}

function runOptionalCommand(label, command, args, cwd) {
  return runCommand(label, command, args, cwd, { optional: true });
}

function collectFilesRecursively(directory, matcher, bucket) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectFilesRecursively(entryPath, matcher, bucket);
      continue;
    }

    if (matcher(entryPath)) {
      bucket.push(entryPath);
    }
  }
}

function listSourceFiles(sourceRoot, extension) {
  if (!existsSync(sourceRoot)) {
    fail(`Source root is missing: ${sourceRoot}`);
  }

  const sourceFiles = [];
  collectFilesRecursively(sourceRoot, (entryPath) => entryPath.endsWith(extension), sourceFiles);

  if (sourceFiles.length === 0) {
    fail(`Source root does not contain any ${extension} files: ${sourceRoot}`);
  }

  sourceFiles.sort();
  return sourceFiles;
}

function buildJavaCompileStep(workspaceRoot) {
  const javaRoot = path.join(workspaceRoot, 'sdkwork-rtc-sdk-java');
  const javaSourceRoot = path.join(javaRoot, 'src', 'main', 'java');
  const javaTargetRoot = path.join(javaRoot, 'target', 'classes');
  const sourceFiles = listSourceFiles(javaSourceRoot, '.java');

  rmSync(javaTargetRoot, { recursive: true, force: true });
  mkdirSync(javaTargetRoot, { recursive: true });

  return {
    label: 'java:javac',
    command: 'javac',
    args: ['-d', javaTargetRoot, ...sourceFiles],
    cwd: javaRoot,
  };
}

function buildKotlinCompileStep(workspaceRoot) {
  const kotlinRoot = path.join(workspaceRoot, 'sdkwork-rtc-sdk-kotlin');
  const kotlinSourceRoot = path.join(kotlinRoot, 'src', 'main', 'kotlin');
  const kotlinTargetRoot = path.join(kotlinRoot, 'build', 'classes');
  const sourceFiles = listSourceFiles(kotlinSourceRoot, '.kt');

  rmSync(kotlinTargetRoot, { recursive: true, force: true });
  mkdirSync(kotlinTargetRoot, { recursive: true });

  return {
    label: 'kotlin:kotlinc',
    command: 'kotlinc',
    args: ['-d', kotlinTargetRoot, ...sourceFiles],
    cwd: kotlinRoot,
  };
}

function printSummary(requiredResults, optionalPassed, optionalSkipped) {
  console.log('[sdkwork-rtc-sdk] full regression summary');
  console.log(
    `[sdkwork-rtc-sdk] required steps passed (${requiredResults.length}): ${requiredResults
      .map((entry) => entry.label)
      .join(', ')}`,
  );

  if (optionalPassed.length > 0) {
    console.log(
      `[sdkwork-rtc-sdk] optional smoke steps passed (${optionalPassed.length}): ${optionalPassed
        .map((entry) => entry.label)
        .join(', ')}`,
    );
  }

  if (optionalSkipped.length > 0) {
    console.log(
      `[sdkwork-rtc-sdk] optional smoke steps skipped (${optionalSkipped.length}): ${optionalSkipped
        .map((entry) => `${entry.label} [${entry.reason}]`)
        .join(', ')}`,
    );
  }
}

export function runRtcSdkSmoke(workspaceRoot) {
  const requiredResults = [];
  const optionalPassed = [];
  const optionalSkipped = [];
  const repoRoot = resolveRtcSdkAppRootFromWorkspaceRoot(workspaceRoot);

  requiredResults.push(
    runRequiredNodeStep(
      'root:materialize',
      [path.join(workspaceRoot, 'bin', 'materialize-sdk.mjs')],
      repoRoot,
    ),
  );
  requiredResults.push(
    runRequiredNodeStep(
      'root:automation-tests',
      [path.join(workspaceRoot, 'test', 'verify-sdk-automation.test.mjs')],
      repoRoot,
    ),
  );
  requiredResults.push(
    runRequiredNodeStep(
      'root:verify',
      [path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')],
      repoRoot,
    ),
  );
  requiredResults.push(
    runRequiredNodeStep(
      'typescript:test',
      [path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'bin', 'package-task.mjs'), 'test'],
      repoRoot,
    ),
  );

  const optionalSteps = [
    {
      label: 'python:compileall',
      command: 'python',
      args: ['-m', 'compileall', '-q', 'sdkwork-rtc-sdk-python/sdkwork_rtc_sdk'],
      cwd: workspaceRoot,
    },
    {
      label: 'flutter:dart-analyze',
      command: 'dart',
      args: ['analyze', 'lib'],
      cwd: path.join(workspaceRoot, 'sdkwork-rtc-sdk-flutter'),
    },
    {
      label: 'rust:cargo-check',
      command: 'cargo',
      args: ['check'],
      cwd: path.join(workspaceRoot, 'sdkwork-rtc-sdk-rust'),
    },
    {
      label: 'go:go-build',
      command: 'go',
      args: ['build', './...'],
      cwd: path.join(workspaceRoot, 'sdkwork-rtc-sdk-go'),
    },
    {
      label: 'csharp:dotnet-build',
      command: 'dotnet',
      args: ['build', 'src/SDKWork.Rtc.Sdk/SDKWork.Rtc.Sdk.csproj', '-nologo'],
      cwd: path.join(workspaceRoot, 'sdkwork-rtc-sdk-csharp'),
    },
    buildJavaCompileStep(workspaceRoot),
    {
      label: 'swift:swift-build',
      command: 'swift',
      args: ['build'],
      cwd: path.join(workspaceRoot, 'sdkwork-rtc-sdk-swift'),
    },
    buildKotlinCompileStep(workspaceRoot),
  ];

  for (const step of optionalSteps) {
    const result = runOptionalCommand(step.label, step.command, step.args, step.cwd);
    if (result.status === 'passed') {
      optionalPassed.push(result);
      continue;
    }

    optionalSkipped.push(result);
  }

  printSummary(requiredResults, optionalPassed, optionalSkipped);
}

const workspaceRoot = resolveRtcSdkWorkspaceRoot(import.meta.url);
const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
const isCliEntry = invokedPath === import.meta.url;

if (isCliEntry) {
  try {
    runRtcSdkSmoke(workspaceRoot);
  } catch (error) {
    console.error(`[sdkwork-rtc-sdk] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
