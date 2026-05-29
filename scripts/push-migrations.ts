import fs from "fs";
import path from "path";
import { Client } from "pg";

type EnvMap = Record<string, string>;

function parseEnvFile(filePath: string): EnvMap {
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce<EnvMap>((env, line) => {
      const equalsIndex = line.indexOf("=");
      if (equalsIndex < 0) return env;

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

function loadEnv() {
  const root = process.cwd();
  const envPaths = [".env.local", ".env"];

  for (const envPath of envPaths) {
    const absolutePath = path.join(root, envPath);
    if (fs.existsSync(absolutePath)) {
      const parsed = parseEnvFile(absolutePath);
      for (const [key, value] of Object.entries(parsed)) {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
      console.log(`Loaded environment from ${envPath}`);
      return;
    }
  }
}

async function main() {
  loadEnv();

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DIRECT_URL or DATABASE_URL in environment.");
  }

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query(`
      create table if not exists public.app_schema_migrations (
        file_name text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    const { rows: appliedRows } = await client.query<{ file_name: string }>(
      "select file_name from public.app_schema_migrations"
    );
    const appliedFiles = new Set(appliedRows.map((row) => row.file_name));

    for (const file of migrationFiles) {
      if (appliedFiles.has(file)) {
        console.log(`Skipping ${file} (already applied).`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      console.log(`Applying ${file}...`);
      try {
        await client.query(sql);
        await client.query("insert into public.app_schema_migrations (file_name) values ($1)", [file]);
        console.log(`Applied ${file}`);
      } catch (err) {
        console.error(`Failed to apply ${file}:`, err instanceof Error ? err.message : err);
        try {
          await client.query("ROLLBACK;");
          console.log("Rolled back aborted transaction.");
        } catch {
          // ignore rollback errors
        }
        console.log(`Skipping ${file} and continuing with next migration.`);
      }
    }
    console.log("Migrations processing complete.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration push failed:", error);
  process.exit(1);
});
