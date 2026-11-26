#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { accessSync, constants, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startGuard } from './mcp-guard.mjs';

const env = process.env;

function isFile(path, mode = constants.R_OK) {
  try {
    accessSync(path, mode);
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveCli() {
  if (env.CALCITE_CLI) {
    const cli = resolve(env.CALCITE_CLI);
    if (isFile(cli)) return realpathSync(cli);
    throw new Error('CALCITE_CLI must point to a readable Calcite CLI file.');
  }
  try {
    // The package exports its ESM entry, while the CLI is a sibling bin file.
    const entry = fileURLToPath(import.meta.resolve('@bkm016/calcite'));
    const cli = join(dirname(entry), 'cli.js');
    if (isFile(cli)) return realpathSync(cli);
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND' && error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error;
  }
  throw new Error('Calcite CLI not found. Install with npm i -g @bkm016/calcite and set CALCITE_CLI to its CLI file, or install the package in a Node-resolvable parent directory.');
}

function resolveJava() {
  const binary = process.platform === 'win32' ? 'java.exe' : 'java';
  const homes = [env.CALCITE_JAVA_21, env.JAVA_HOME].filter(Boolean);
  const path = (env.PATH ?? '').split(delimiter).filter(Boolean);
  const executables = [...homes.map((home) => resolve(home, 'bin', binary)), ...path.map((dir) => resolve(dir, binary))];
  const java = executables.find((file) => isFile(file, constants.X_OK));
  if (!java) throw new Error('Java not found. Set CALCITE_JAVA_21 or JAVA_HOME to a JDK home, or put java on PATH.');
  return java;
}

function installOptions(args) {
  let version;
  let loader = env.CALCITE_LOADER;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '-l' || arg === '--loader') {
      loader = args[++index];
      if (!loader || loader.startsWith('-')) throw new Error(`${arg} requires a loader value.`);
    } else if (!arg.startsWith('-') && !version) {
      version = arg;
    } else {
      throw new Error(`Unexpected install argument: ${arg}`);
    }
  }
  return { version: version || env.CALCITE_MC_VERSION, loader };
}

async function runInstaller(cli, java, loader) {
  const pinned = /^(forge|neoforge)@([a-z0-9._-]+)$/i.exec(loader ?? '');
  if (!pinned) return 0;
  const calciteHome = resolve(env.CALCITE_HOME || join(homedir(), '.calcite'));
  const directory = resolve(env.CALCITE_INSTALLERS || join(calciteHome, 'cache', 'installers'));
  const jar = join(directory, `${pinned[1].toLowerCase()}-${pinned[2]}-installer.jar`);
  if (!isFile(jar)) return 0;

  let properties = [];
  try {
    const netModule = pathToFileURL(join(dirname(cli), 'net.js'));
    const { javaProxyProps } = await import(netModule.href);
    properties = Object.entries(javaProxyProps()).map(([key, value]) => `-D${key}=${value}`);
  } catch {
    console.error('Calcite Java proxy settings unavailable. Continuing without installer proxy properties.');
  }
  const result = spawnSync(java, [...properties, '-jar', jar, '--installClient', join(calciteHome, 'minecraft')], {
    cwd: homedir(),
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function runCli(cli, args) {
  const child = spawn(process.execPath, [cli, ...args], { stdio: 'inherit' });
  child.once('error', (error) => {
    console.error(`Could not start Calcite: ${error.message}`);
    process.exitCode = 1;
  });
  child.once('close', (code) => {
    process.exitCode = code ?? 1;
  });
}

async function main([command, ...args]) {
  const usage = 'Usage: node entry.mjs install [version] [-l loader] | mcp | doctor | version';
  if (!['install', 'mcp', 'doctor', 'version'].includes(command) || (command !== 'install' && args.length)) {
    console.error(usage);
    process.exitCode = 2;
    return;
  }
  const cli = resolveCli();
  if (command === 'mcp') {
    startGuard(cli);
  } else if (command === 'install') {
    const { version, loader } = installOptions(args);
    const java = resolveJava();
    const status = await runInstaller(cli, java, loader);
    if (status !== 0) {
      process.exitCode = status;
      return;
    }
    const installArgs = ['install'];
    if (version) installArgs.push(version);
    if (loader) installArgs.push('-l', loader);
    runCli(cli, [...installArgs, '--java', java]);
  } else {
    runCli(cli, [command === 'version' ? '--version' : 'doctor']);
  }
}

main(process.argv.slice(2)).catch((error) => {
  console.error(`McTestHarness: ${error.message}`);
  process.exitCode = 1;
});
