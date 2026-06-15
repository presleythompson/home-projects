import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { Pool } from "pg";

// Tagged template type that both neon() and our local wrapper return
type SqlTaggedTemplate = NeonQueryFunction<false, false>;

let localPool: Pool | null = null;

function getLocalSql(): SqlTaggedTemplate {
  if (!localPool) {
    localPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  const pool = localPool;

  // Return a tagged template function compatible with Neon's interface
  const sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    // Build parameterized query from tagged template
    let query = "";
    strings.forEach((str, i) => {
      query += str;
      if (i < values.length) {
        query += `$${i + 1}`;
      }
    });
    const result = await pool.query(query, values);
    return result.rows;
  };

  return sql as unknown as SqlTaggedTemplate;
}

export function getDb(): SqlTaggedTemplate {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to your environment variables.");
  }

  // Use raw pg for local Postgres, Neon driver for production
  if (databaseUrl.startsWith("postgresql://") && databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")) {
    return getLocalSql();
  }

  return neon(databaseUrl);
}
