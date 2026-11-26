import { spawn } from 'node:child_process';
import { accessSync, constants, statSync } from 'node:fs';
import { delimiter, isAbsolute } from 'node:path';

const MAX_LINE_BYTES = 10 * 1024 * 1024;
const ALLOW = new Set([
  'launch_client', 'stop_client', 'list_clients',
  'get_state', 'get_logs', 'wait_for', 'screenshot', 'set_render',
  'get_chat', 'get_events', 'send_chat',
  'use', 'look', 'walk_to', 'move', 'stop_actions', 'select_slot',
  'dig', 'attack', 'respawn', 'drop_item', 'craft',
  'get_inventory', 'get_container', 'click_slot', 'close_container', 'transfer',
  'run_command', 'surroundings', 'find_blocks', 'get_block', 'get_target', 'get_entities',
  'install_version', 'list_versions', 'list_extensions',
]);

const env = process.env;
const DEFAULTS = {
  version: env.CALCITE_MC_VERSION,
  loader: env.CALCITE_LOADER,
  server: env.CALCITE_SERVER,
  username: env.CALCITE_USERNAME || 'TestPlayer',
  mods: env.CALCITE_MODS?.split(delimiter).filter(Boolean),
};

function localJar(mod) {
  if (typeof mod !== 'string' || !isAbsolute(mod) || !mod.endsWith('.jar')) return false;
  try {
    accessSync(mod, constants.R_OK);
    return statSync(mod).isFile();
  } catch {
    return false;
  }
}

function launchError(args) {
  if (typeof args.name !== 'string' || !/^[A-Za-z0-9_.-]{1,32}$/.test(args.name) || /^[.]{1,2}$/.test(args.name)) {
    return 'A valid client name is required.';
  }
  if (!args.version) return 'Pass a version or set CALCITE_MC_VERSION.';
  if (!args.loader) return 'Pass a loader or set CALCITE_LOADER.';
  if (args.server && !/^(?:[A-Za-z0-9._-]+|\[[0-9a-f:]+\]):\d{1,5}$/i.test(args.server)) return 'Use host:port for the server address.';
  if ('world' in args) return 'Singleplayer worlds are unavailable through this entry.';
  if ('microsoft' in args) return 'Microsoft login is unavailable through this entry.';
  if ('extensions' in args) return 'Probe extensions are unavailable through this entry.';
  if (!['on-demand', 'always'].includes(args.render)) return 'Render mode must be on-demand or always.';
  if (!['2G', '3G', '4G', '6G'].includes(args.memory)) return 'Memory must be 2G, 3G, 4G, or 6G.';
  if (args.mods !== undefined && (!Array.isArray(args.mods) || !args.mods.every(localJar))) return 'Mods must be readable local JAR files given as absolute paths.';
  return undefined;
}

function callError(message) {
  if (message.method !== 'tools/call') return undefined;
  const name = message.params?.name;
  if (!ALLOW.has(name)) return 'Tool is outside the fixed harness allowlist.';
  const args = message.params.arguments ?? {};
  if (!args || typeof args !== 'object' || Array.isArray(args)) return 'Tool arguments must be an object.';
  if (name === 'use' && 'entityId' in args) return 'Use is restricted to blocks and held items.';
  if (name === 'set_render' && args.enabled !== true) return 'Continuous rendering can only be enabled through this entry.';
  if (name !== 'launch_client') return undefined;

  const launch = {
    ...DEFAULTS,
    render: 'on-demand',
    memory: '4G',
    ...args,
    reconnect: false,
  };
  const error = launchError(launch);
  if (!error) message.params.arguments = launch;
  return error;
}

function filterResponse(message) {
  const result = message.result;
  if (result?.serverInfo && typeof result.instructions === 'string') {
    result.instructions = 'Use this harness to verify an isolated Minecraft server with offline clients. Use launch_client, inspect the state and capture screenshots in the same session, then stop each client.';
  }
  if (!Array.isArray(result?.tools)) return message;
  const tools = result.tools.filter((tool) => ALLOW.has(tool.name));
  for (const tool of tools) {
    const properties = tool.inputSchema?.properties;
    if (tool.name === 'launch_client') {
      tool.description = 'Launch a render-capable Minecraft client with an offline identity for isolated verification.';
      if (properties) {
        delete properties.world;
        delete properties.microsoft;
        delete properties.extensions;
        if (properties.render) properties.render.enum = ['on-demand', 'always'];
      }
    } else if (tool.name === 'use') {
      tool.description = 'Use a block or the held item.';
      if (properties) delete properties.entityId;
    } else if (tool.name === 'set_render') {
      tool.description = 'Enable continuous rendering.';
      if (properties?.enabled) properties.enabled.const = true;
    }
  }
  result.tools = tools;
  return message;
}

function readLines(stream, callback, overflow) {
  let buffered = Buffer.alloc(0);
  return (chunk) => {
    buffered = Buffer.concat([buffered, chunk]);
    let boundary;
    while ((boundary = buffered.indexOf(0x0a)) !== -1) {
      if (boundary > MAX_LINE_BYTES) return overflow();
      const line = buffered.subarray(0, boundary).toString('utf8');
      buffered = buffered.subarray(boundary + 1);
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      if (message && typeof message === 'object' && !Array.isArray(message)) callback(message);
    }
    if (buffered.length > MAX_LINE_BYTES) {
      stream.pause();
      overflow();
    }
  };
}

function send(stream, message) {
  stream.write(`${JSON.stringify(message)}\n`);
}

export function startGuard(cli) {
  const child = spawn(process.execPath, [cli, 'mcp', '-r', 'on-demand', '--memory', '4G'], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  let stopping = false;
  function stop() {
    if (stopping) return;
    stopping = true;
    process.stdin.pause();
    // Calcite uses stdin EOF to stop its clients before exiting.
    child.stdin.end();
  }
  function fail(message) {
    console.error(`McTestHarness: ${message}`);
    process.exitCode = 1;
    stop();
  }
  const overflow = () => fail(`MCP message exceeds ${MAX_LINE_BYTES} bytes.`);
  const inbound = readLines(process.stdin, (message) => {
    if (stopping) return;
    const error = callError(message);
    if (!error) {
      send(child.stdin, message);
    } else if (message.id != null) {
      send(process.stdout, { jsonrpc: '2.0', id: message.id, error: { code: -32600, message: error } });
    }
  }, overflow);
  const outbound = readLines(child.stdout, (message) => send(process.stdout, filterResponse(message)), overflow);
  process.stdin.on('data', inbound);
  process.stdin.once('end', stop);
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  child.stdin.on('error', (error) => {
    if (error.code === 'EPIPE') stop();
    else fail(error.message);
  });
  child.stdout.on('data', outbound);
  child.once('error', (error) => fail(error.message));
  child.once('close', (code) => {
    process.stdin.off('data', inbound);
    process.stdin.off('end', stop);
    process.stdin.pause();
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    process.exitCode ||= code ?? 1;
  });
}
