import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import apiApp from './api/index.js';

const app = new Hono();

// static file (frontend)
app.use('/*', serveStatic({ root: './public' }));

// semua API masuk ke /api
app.route('/api', apiApp);

console.log("Recaptcha secret = ", process.env.RECAPTCHA_SECRET);

const port = 3000;
console.log(`Server Running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});

