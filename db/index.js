import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod'; // Library untuk validasi skema data
import * as schema from './schema.js';
import 'dotenv/config'; // Memastikan server bisa membaca file .env yang berisi informasi rahasia.


// connectionString: Mengambil alamat database (seperti username, password, host) dari file .env.
const connectionString = process.env.DATABASE_URL

if (!connectionString){
  throw new Error('DATABASE_URL tidak ditemukan di enviroment variabels!');
}

// Inisialisasi Driver & Database
// client: Membuat koneksi fisik ke database PostgreSQL menggunakan string koneksi tadi.
const client = postgres(connectionString);

// Export instance db dengan schema agar fitur autocoplation (intelisense) jalan
export const db = drizzle(client, { schema });