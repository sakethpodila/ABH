import { spawn } from 'node:child_process';
import { localEnvironment } from './runtime-env.mjs';

const args = process.argv.slice(2);
if (args.includes('--remote') || args.includes('deploy') || !args.includes('--local')) {
  throw new Error(
    'This helper is for local database work only. Production deployment is a separate milestone.',
  );
}
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
  stdio: 'inherit',
  env: localEnvironment(),
});
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
