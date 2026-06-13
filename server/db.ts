import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

// 🔴 CHANGE these values if your setup is different
const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "12345",      // <-- your real PostgreSQL password
  database: "healthchat", // <-- the DB you created earlier
});

export const db = drizzle(pool, { schema });
