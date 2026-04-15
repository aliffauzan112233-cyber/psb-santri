import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import 'dotenv/config';


import apiApp from './api/index.js';

const app = new Hono();

// API route
app.route('/api', apiApp);

console.log("Recaptcha secret = ", process.env.RECAPTCHA_SECRET)

// Static files (INI PENTING)
app.use('/*', serveStatic({ root: './public' }));

const port = 3000;
console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port: 3000
});

