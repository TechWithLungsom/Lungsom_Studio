import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createApp } from './app.js';

export function createLocalApp({ buildDirectory, config = process.env } = {}) {
  const app = createApp({ config });
  app.use(express.static(buildDirectory));
  app.get('/', (_req, res) => {
    const index = path.join(buildDirectory, 'index.html');
    if (existsSync(index)) return res.sendFile(index);
    if (config.NODE_ENV === 'production') return res.status(503).json({ message: 'Frontend build missing. Run npm run build before npm start.' });
    return res.type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><title>Lungsom Studio API</title><h1>The backend is running.</h1><p>During development, open <a href="http://localhost:5173/">the website on port 5173</a>.</p></html>');
  });
  return app;
}
