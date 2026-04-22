import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { admins } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import { z } from 'zod';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { db } from '../db/index.js';
import { santri } from '../db/schema.js';
 
// untuk mengembil jwt_scret dari .env
const SECRET = process.env.JWT_SECRET;
const app = new Hono();

app.post('/api/login', async (c) => {
  try {
    const { username, password } = await c.req.parseBody();

    console.log("INPUT:", username, password);

    const [user] = await db.select().from(admins).where(eq(admins.username, username));

    console.log("USER DB:", user);

    if (!user) {
      return c.json({ message: "Username atau Password salah!" }, 401);
    }

    console.log("PASSWORD DB:", user.password);

    const isValid = await bcrypt.compare(password, user.password);

    console.log("COMPARE:", isValid);

    if (!isValid) {
      return c.json({ message: "Username atau Password salah!" }, 401);
    }

    const token = await sign({
      user: user.username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
    }, SECRET);

    setCookie(c, 'admin_session', token, {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24
    });

    return c.json({ message: "Login Berhasil!" });

  } catch (err) {
    console.error(err);
    return c.json({ message: "Terjadi kesalahan server" }, 500);
  }
});


// API ADMIN
app.get('/api/admin/santri', async (c) => {
  const token = getCookie(c, 'admin_session');
  if (!token) return c.json({ error: "Akses Ditolak" }, 401);

  try {
    await verify(token, SECRET);
    const data = await db.select().from(santri);
    return c.json(data);
  } catch (err) {
    return c.json({ error: "Sesi Habis, Silahkan Login Lagi" }, 401);
  }
});

// API LOGOUT
app.get('/api/logout', (c) => {
  deleteCookie(c, 'admin_session');
  return c.json({ message: "Berhasil Logout" });
});

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
    hafalan: z.coerce.number().min(0, "hafalan tidak boleh minus."),
    wali: z.string().min(3, "Nama wali wajib diisi."),
    whatsapp: z.string()
    .min(10, "No WhatsAPP tidak boleh kurang dari 10")
    .max(13, "No WhatsApp tidak boleh lebih dari 13"),
    'g-recaptcha-response': z.string().min(1, "Centang Captcha terlebih dahulu!")
  });


  const parse = schema.safeParse(body);
  if (!parse.success){
    return c.json({ error: parse.error.issues[0].message }, 400);
  }

  console.log(!parse.data.gender)
  if(!(parse.data.gender === 'Ikhwan')){
    return c.json({ error: "Peserta harus Ikhwan"}, 400);
  } 

  if(!(parse.data.hafalan >= 1 )){
    return c.json({ error: "Hafalan minimal 1 juz" }, 400)
  }

  if (parse.data.whatsapp.length < 10) {
  return c.json({ error: "No WhatsAPP tidak boleh kurang dari 10" }, 400);
}


  const secret = process.env.RECAPTCHA_SECRET
  // 2 verivikasi Captcha ke server Google
  const formData = new URLSearchParams();
  formData.append('secret',secret);
  formData.append('response', parse.data['g-recaptcha-response']);
  
  const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: formData,
   headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
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
    wali: parse.data.wali,
    whatsapp: parse.data.whatsapp
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
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Terjadi kesalahan internal' }, 500);
});


export default app;