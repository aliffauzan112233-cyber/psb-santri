import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from './schema.js';
import 'dotenv/config';
import { ne } from "drizzle-orm";

// pastikan DATABASE_URL ada di .env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL tidak di temukan di enviroment variables!');
}

//Client untuk query
const client = postgres(connectionString);

// Export instance db dengan schema agar fitur autocompletion (Intellisense) jalan
export const db = drizzle(client, { schema });

