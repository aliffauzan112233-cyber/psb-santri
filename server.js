import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { readFile } from 'fs/promises';
import apiApp from './api/index.js';

const app = new Hono();

// API
app.route('/api', apiApp);

// Homepage (tanpa serveStatic)
app.get('/', async (c) => {
  const html = await readFile('./public/index.html', 'utf-8');
  return c.html(html);
});

const port = 5000;
console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});

