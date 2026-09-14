import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testsDir, '..');
const node = process.execPath;

function run(label, args) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(node, args, {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (result.error) {
    console.error(`FAILED: ${label}: ${result.error.message}`);
    return false;
  }

  if (result.signal) {
    console.error(`FAILED: ${label}: terminated by ${result.signal}`);
    return false;
  }

  if (result.status !== 0) {
    console.error(`FAILED: ${label}: exit ${result.status}`);
    return false;
  }

  return true;
}

const testFiles = readdirSync(testsDir)
  .filter(name => name.endsWith('.mjs') && name !== 'run-all.mjs')
  .sort();

if (testFiles.length === 0) {
  console.error('FAILED: no deterministic .mjs test files found in tests/.');
  process.exit(1);
}

const failures = [];

if (!run('game.js syntax', ['--check', resolve(repoRoot, 'game.js')])) {
  failures.push('game.js syntax');
}

for (const testFile of testFiles) {
  if (!run(testFile, [resolve(testsDir, testFile)])) failures.push(testFile);
}

if (failures.length > 0) {
  console.error(`\nFAILED: ${failures.length} verification target(s): ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`\nPASS: game.js syntax + ${testFiles.length}/${testFiles.length} deterministic test files.`);
