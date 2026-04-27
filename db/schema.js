import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";


export const santri = pgTable('santri', {
    id: serial('id').primaryKey(),
    nama: varchar('nama', { length: 255 }).notNull(),   
    gender: varchar('gender', { length: 20 }).notNull(),
    hafalan: integer('hafalan').default(0),
    wali: varchar('wali', { length: 255 }).notNull(),
    whatsapp: varchar('whatsapp', { length: 15 })
});

export const admins = pgTable('admins', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull()
});