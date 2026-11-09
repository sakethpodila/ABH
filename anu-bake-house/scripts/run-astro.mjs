import { spawn } from 'node:child_process';
import { localEnvironment } from './runtime-env.mjs';

const child = spawn(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: localEnvironment(),
  },
);
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
