import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createLocalApp } from '../server/local-app.js';

test('development backend works without a frontend build', async () => {
 const directory = await mkdtemp(path.join(tmpdir(), 'studio-startup-'));
 try {
  const app = createLocalApp({buildDirectory: directory, config: {}});
  const response = await request(app).get('/');
  assert.equal(response.status,200);
  assert.match(response.text,/localhost:5173/);
  assert.equal((await request(app).get('/api/health')).status,200);
 } finally { await rm(directory,{recursive:true,force:true}); }
});
test('production reports a missing build and serves a completed one', async () => {
 const directory = await mkdtemp(path.join(tmpdir(), 'studio-startup-'));
 try {
  const app = createLocalApp({buildDirectory: directory, config: {NODE_ENV:'production'}});
  const response = await request(app).get('/');
  assert.equal(response.status,503);
  assert.match(response.body.message,/npm run build/);
  await writeFile(path.join(directory,'index.html'),'<h1>Studio test</h1>');
  assert.equal((await request(app).get('/')).text,'<h1>Studio test</h1>');
 } finally { await rm(directory,{recursive:true,force:true}); }
});
