import 'dotenv/config';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { admins, santri } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { db } from '../db/index.js';

const SECRET = process.env.JWT_SECRET || 'secret123';
const app = new Hono();


// ================= LOGIN =================
app.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.parseBody();

    const [user] = await db.select().from(admins).where(eq(admins.username, username));

    if (!user) {
      return c.json({ message: "Username atau Password salah!" }, 401);
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return c.json({ message: "Username atau Password salah!" }, 401);
    }

    // ✅ FIX JWT (pakai HS256)
    const token = await sign({
      user: user.username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
    }, SECRET, 'HS256');

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


// ================= GET DATA =================
app.get('/admin/santri', async (c) => {
  const token = getCookie(c, 'admin_session');

  if (!token) return c.json({ error: "Akses Ditolak" }, 401);

  try {
    // ✅ FIX JWT
    await verify(token, SECRET, 'HS256');

    const data = await db.select().from(santri);
    return c.json(data);

  } catch (err) {
    console.error("JWT ERROR:", err);
    return c.json({ error: "Sesi Habis, Silahkan Login Lagi" }, 401);
  }
});


// ================= DELETE =================
app.delete('/admin/santri/:id', async (c) => {
  const token = getCookie(c, 'admin_session');

  if (!token) {
    return c.json({ error: "Akses Ditolak" }, 401);
  }

  try {
    // ✅ FIX JWT
    await verify(token, SECRET, 'HS256');

    // ✅ FIX ID
    const id = Number(c.req.param('id'));

    if (!id) {
      return c.json({ error: "ID tidak valid" }, 400);
    }

    // ✅ cek dulu data
    const existing = await db.query.santri.findFirst({
      where: eq(santri.id, id),
    });

    if (!existing) {
      return c.json({ error: "Data tidak ditemukan" }, 404);
    }

    // delete
    await db.delete(santri).where(eq(santri.id, id));

    return c.json({ message: "Data berhasil dihapus" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    return c.json({ error: "Gagal menghapus data" }, 500);
  }
});


//  LOGOUT 
app.get('/logout', (c) => {
  deleteCookie(c, 'admin_session');
  return c.json({ message: "Berhasil Logout" });
});


//  CORS 
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "Content-Type");
  c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  await next();
});


//  STATIC 
app.use('/*', serveStatic({ root: './public' }));


//  SUBMIT 
app.post('/submit', async (c) => {
  try {
    const body = await c.req.parseBody();

    const schema = z.object({
      nama: z.string().min(3),
      gender: z.enum(['Ikhwan', "Akhwat"]),
      hafalan: z.coerce.number().min(0),
      wali: z.string().min(3),
      whatsapp: z.string().min(10).max(13),
      'g-recaptcha-response': z.string().min(1)
    });

    const parse = schema.safeParse(body);
    if (!parse.success) {
      return c.json({ error: parse.error.issues[0].message }, 400);
    }

    if (parse.data.gender !== 'Ikhwan') {
      return c.json({ error: "Peserta harus Ikhwan" }, 400);
    }

    if (parse.data.hafalan < 1) {
      return c.json({ error: "Hafalan minimal 1 juz" }, 400);
    }

    // CAPTCHA
    const formData = new URLSearchParams();
    formData.append('secret', process.env.RECAPTCHA_SECRET);
    formData.append('response', parse.data['g-recaptcha-response']);

    const verifyCaptcha = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const captchaRes = await verifyCaptcha.json();

    if (!captchaRes.success) {
      return c.json({ error: "Verifikasi Captcha Gagal" }, 400);
    }

    // SIMPAN
    await db.insert(santri).values({
      nama: parse.data.nama,
      gender: parse.data.gender,
      hafalan: parse.data.hafalan,
      wali: parse.data.wali,
      whatsapp: parse.data.whatsapp
    });

    return c.json({ message: "Pendaftaran Berhasil!" });

  } catch (error) {
    console.error(error);
    return c.json({ error: "Terjadi Kesalahan Sistem" }, 500);
  }
});



//  ERROR 
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Terjadi kesalahan internal' }, 500);
});


export default app;