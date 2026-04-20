import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';// Middleware untuk melayani file statis (seperti .html, .css, .js frontend, atau gambar).
import { Hono } from 'hono';
import 'dotenv/config'; // Secara otomatis membaca file .env.
import apiApp from './api/index.js';

// Membuat instance aplikasi baru.
const app = new Hono();

// API route
app.route('/api', apiApp);

// untuk memastikan bahwa server berhasil membaca Secret Key reCAPTCHA dari file .env.
console.log("Recaptcha secret = ", process.env.RECAPTCHA_SECRET)

// Static files (INI PENTING) app.use('/*', ...): Menangani semua request yang tidak cocok dengan route API di atas.
app.use('/*', serveStatic({ root: './public' }));

const port = 3000;
console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port: 3000
});

