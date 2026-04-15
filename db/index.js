import { z } from 'zod';
import { santri } from './schema.js';
import { drizzle } from 'drizzle-orm/node-postgres'


export default (app) => {
  app.post('/api/submit', async (c) => {
    try {
      const body = await c.req.parseBody();

      // 1. Validasi pakai Zod
      const schema = z.object({
        nama: z.string().min(3, 'Nama minimal 3 karakter'),
        gender: z.enum(['ikhwan', 'akhwat'], {
          errorMap: () => ({ message: 'Pilih gender' }),
        }),
        hafalan: z.coerce.number().min(0, 'Hafalan tidak boleh minus'),
        wali: z.string().min(3, 'Nama wali wajib diisi'),
        'g-recaptcha-response': z.string().min(1, 'Centang Captcha terlebih dahulu'),
      });

      const parse = schema.safeParse(body);

      if (!parse.success) {
        return c.json(
          { error: parse.error.errors[0].message },
          400
        );
      }

      // 2. Verifikasi Captcha ke Google
      const formData = new URLSearchParams();
      formData.append('secret', process.env.RECAPTCHA_SECRET);
      formData.append('response', parse.data['g-recaptcha-response']);

      const verify = await fetch(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const captchaRes = await verify.json();

      if (!captchaRes.success) {
        return c.json({ error: 'Verifikasi Captcha Gagal' }, 400);
      }

      // 3. Simpan ke database
      await db.insert(santri).values({
        nama: parse.data.nama,
        gender: parse.data.gender,
        hafalan: parse.data.hafalan,
        wali: parse.data.wali,
      });

      return c.json({ message: 'Pendaftaran Berhasil!' });

    } catch (error) {
      console.error(error);
      return c.json({ error: 'Terjadi kesalahan server' }, 500);
    }
  });
};