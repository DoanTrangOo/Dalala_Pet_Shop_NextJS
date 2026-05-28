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
    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      console.log(`Applying ${file}...`);
      await client.query(sql);
    }
    console.log("Migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration push failed:", error);
  process.exit(1);
});
