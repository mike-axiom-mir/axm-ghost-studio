import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const file = name => path.join(root, name);

for (const required of ['index.html', 'styles.css', 'game.js']) {
  assert.ok(existsSync(file(required)), `missing required runtime file: ${required}`);
}

const html = readFileSync(file('index.html'), 'utf8');
const game = readFileSync(file('game.js'), 'utf8');

assert.match(html, /<link\b[^>]*href=["']styles\.css["'][^>]*>/i, 'index.html must load styles.css');
assert.match(html, /<script\b[^>]*src=["']game\.js["'][^>]*><\/script>/i, 'index.html must load game.js');
assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//i, 'found mandatory remote runtime resource in index.html');

const htmlIds = new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]));
const requiredDomIds = [...game.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map(match => match[1]);
assert.ok(requiredDomIds.length > 0, 'game.js exposes no DOM integration contract');
for (const id of requiredDomIds) {
  assert.ok(htmlIds.has(id), `game.js requires #${id}, but index.html does not provide it`);
}

assert.match(
  html,
  /<canvas\b[^>]*id=["']game["'][^>]*width=["']\d+["'][^>]*height=["']\d+["'][^>]*>/i,
  'game canvas must declare explicit width and height'
);

const syntax = spawnSync(process.execPath, ['--check', file('game.js')], { encoding: 'utf8' });
assert.equal(syntax.status, 0, `game.js syntax check failed:\n${syntax.stderr || syntax.stdout}`);

console.log(`integration smoke passed: ${requiredDomIds.length} DOM bindings, local runtime files present, no mandatory remote resource, game.js syntax valid`);
