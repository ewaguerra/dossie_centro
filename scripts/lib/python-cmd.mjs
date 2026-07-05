/**
 * Resolve python executable for server.py across Windows and Unix.
 * Override with env PYTHON=/path/to/python if needed.
 */
export function resolvePythonCommand() {
  if (process.env.PYTHON) return process.env.PYTHON;
  return process.platform === "win32" ? "python" : "python3";
}

/** @param {string} port */
export function spawnServerEnv(port) {
  return {
    ...process.env,
    PYTHONIOENCODING: "utf-8",
    ...(port != null ? {} : {}),
  };
}

/**
 * @param {import('node:child_process').spawn} spawnFn
 * @param {string} serverPath
 * @param {string|number} port
 * @param {import('node:child_process').SpawnOptions} [options]
 */
export function spawnServer(spawnFn, serverPath, port, options = {}) {
  const pythonCmd = resolvePythonCommand();
  return spawnFn(pythonCmd, [serverPath, String(port)], {
    cwd: options.cwd,
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    env: spawnServerEnv(port),
  });
}
