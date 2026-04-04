import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Use postgres.js driver — works with both Supabase and local PostgreSQL
const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  prepare: false, // Required for Supabase connection pooling (pgBouncer)
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
