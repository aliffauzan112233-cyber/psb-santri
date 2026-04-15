import 'dotenv/config';
import { z } from 'zod';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { db } from '../db/index.js';
import { santri } from '../db/schema.js';


const app = new Hono();

app.use("*", async (c, next) => {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Headers", "Content-Type");
    c.header("Access-Control-Allow-methods", "POST, GET, OPTIONS");

    if (c.req.method === "OPTIONS"){
      return c.body(null, 204);
    }
    
    await next();
  });

// Static file
app.use('/*', serveStatic({ root: './public' }));

app.post('/submit', async (c) => { 
try{
  const body = await c.req.parseBody();

  // 1 validasi input dengan zod
  const schema = z.object({
    nama: z.string().min(3, "Nama mininal 3 karakter"),
    gender: z.enum(['Ikhwan', "Akhwat"], { errorMap: () => ({ message: "Pilih gender yang valid"}) }),
    hafalan: z.coerce.number().min(0, "hafalan tidak boleh minus"),
    wali: z.string().min(3, "Nama wali wajib diisi"),
    'g-recaptcha-response': z.string().min(1, "Centang Captcha terlebih dahulu!")
  });

  const parse = schema.safeParse(body);
  if (!parse.success){
    return c.json({ error: parse.error.errors[0].message }, 400);
  }
  const secret = process.env.RECAPTCHA_SECRET
  // 2 verivikasi Captcha ke server Google
  const formData = new URLSearchParams();
  formData.append('secret',secret);
  formData.append('response', parse.data['g-recaptcha-response']);
  
  const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: formData,
    heades: { 'Content-Type': 'aplication/x-www-form-urlencoded' }
  });

  const captchaRes = await verify.json();
  if (!captchaRes.success){
    return c.json({ error: "Verifikasi Captcha Gagal" }, 400);
  }
  
  // 3 Simpan ke Database

  await db.insert(santri).values({
    nama: parse.data.nama,
    gender: parse.data.gender,
    hafalan: parse.data.hafalan,
    wali: parse.data.wali
  });
  
  return c.json({ message: "Pendaftaran Berhasil!"});

} catch(error) {
  console.log(error)
  return c.json({ error: "terjadi Kesalahan Sistem"}, 500);
}
});

// API
app.get('/api/hello', (c) => {
  return c.json({ message: "API PSB Aktif!" });
});

// Error handler
app.onError-((err, c) => {
  console.error(err);
  return c.json({ error: 'Terjadi kesalahan internal' }, 500);
});

export default app;