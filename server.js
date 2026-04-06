import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import apiApp from './api/index.js';

const app = new Hono();

app.route('/', apiApp);
// 1. Melayani file statis (Frontend)
app.use('/*', serveStatic({ root: './public' }));

// 2. Gunakan Logika API dari api/index.js

const port = 4003;
console.log(`Server running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
});