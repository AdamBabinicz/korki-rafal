import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// 1. Pobieramy adres URL i "w locie" dodajemy parametry dla wybudzającego się Neona
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl.includes("connect_timeout")) {
  const separator = dbUrl.includes("?") ? "&" : "?";
  dbUrl = `${dbUrl}${separator}connect_timeout=30&pool_timeout=30`;
}

// 2. Tworzymy pulę z wydłużonym czasem oczekiwania
export const pool = new pg.Pool({
  connectionString: dbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // ZWIĘKSZONE Z 10000 DO 30000 (30 sekund)
  query_timeout: 30000,           // DODANO: 30 sekund na wykonanie zapytania
});

export const db = drizzle(pool, { schema });