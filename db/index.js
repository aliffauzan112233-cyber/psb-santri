import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import * as schema from './schema.js';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL

if (!connectionString){
  throw new Error('DATABASE_URL tidak ditemukan di enviroment variabels!');
}

const client = postgres(connectionString);

// Export instance db dengan schema agar fitur autocoplation (intelisense) jalan
export const db = drizzle(client, { schema });