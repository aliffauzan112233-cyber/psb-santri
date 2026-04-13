import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';

import apiApp from './api/index.js';

const app = new Hono();

// API route
app.route('/api', apiApp);

// Static files (INI PENTING)
app.use('/*', serveStatic({ root: './public' }));

const port = 5000;
console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});

