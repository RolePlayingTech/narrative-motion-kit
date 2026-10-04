import { spawn } from 'node:child_process';

/** No shell interpolation: arguments are passed directly to the executable. */
export async function run(
  executable: string,
  args: string[],
  options: { cwd?: string; maxBytes?: number } = {},
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: options.cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '',
      stderr = '',
      bytes = 0;
    child.on('error', (error) =>
      reject(
        new Error(`Cannot run ${executable}: ${error.message}. Install it and add it to PATH.`),
      ),
    );
    const collect = (chunk: Buffer, target: 'stdout' | 'stderr') => {
      bytes += chunk.length;
      if (bytes > (options.maxBytes ?? 32 * 1024 * 1024)) {
        child.kill();
        reject(new Error(`${executable} exceeded output limit`));
        return;
      }
      if (target === 'stdout') stdout += chunk.toString();
      else stderr += chunk.toString();
    };
    child.stdout.on('data', (chunk: Buffer) => collect(chunk, 'stdout'));
    child.stderr.on('data', (chunk: Buffer) => collect(chunk, 'stderr'));
    child.on('close', (code) =>
      code === 0
        ? resolve({ stdout, stderr })
        : reject(new Error(`${executable} exited ${code}: ${stderr.slice(-6000)}`)),
    );
  });
}
