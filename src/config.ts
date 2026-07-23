import type { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();


function envOrThrow(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}


type APIConfig = {
  fileserverHits: number;
  platform: string;
};


type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};


export const config = {
  api: {
    fileserverHits: 0,
    platform: envOrThrow("PLATFORM"),
    polkaKey: process.env.POLKA_KEY!,
  },

  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: {
      migrationsFolder: "./src/db/migrations",
    },
  },

  jwtSecret: envOrThrow("JWT_SECRET"),
  
};