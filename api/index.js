import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

const app = new Hono();

app.use("*", async (c, next) => {
    c.header("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    c.header("Access-Control-Allow-Headers", "Content-Type");
    c.header("Access-Control-Allow-methods", "POST, GET, OPTIONS");

    if (c.req.method === "OPTIONS"){
      return c.body(null, 204);
    }
    
    await next();
  });

// Static file
app.use('/*', serveStatic({ root: './public' }));

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