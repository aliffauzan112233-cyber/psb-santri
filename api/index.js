import { Hono } from 'hono';
import { serveStatic } from 'hono/serve-static'
const app = new Hono();

// Static file
app.use('/*', serveStatic({ root: 'public' }));

// API
app.get('/api/hello', (c) => {
  return c.json({ message: "API PSB Aktif!" });
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Terjadi kesalahan internal' }, 500);
});

export default app;