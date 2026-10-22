import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Generate machine-specific test paths under ignored artifacts, never in committed configuration.
const output = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../artifacts/runtime.patch.yml', import.meta.url));
const fixture = fileURLToPath(new URL('./runtime-fixture.js', import.meta.url)).replaceAll('\\', '/');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `- insert:\n    - id: context-manager-runtime-fixture\n      name: ${JSON.stringify(fixture)}\n      config: {}\n`);
console.log(output);
