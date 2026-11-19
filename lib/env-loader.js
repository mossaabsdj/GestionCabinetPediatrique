/**
 * lib/env-loader.js
 *
 * Secure environment variable loader for development and Electron production packaging.
 * Automatically loads .env from inside app.asar without requiring a standalone .env file
 * alongside the executable or in the installation directory.
 */

const fs = require("fs");
const path = require("path");

function loadEnv() {
  const candidateDirs = [
    __dirname,
    path.join(__dirname, ".."),
    process.cwd(),
    typeof process.resourcesPath === "string" ? process.resourcesPath : null,
    typeof process.resourcesPath === "string" ? path.join(process.resourcesPath, "app.asar") : null,
  ].filter(Boolean);

  for (const dir of candidateDirs) {
    const envFile = path.join(dir, ".env");
    try {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, "utf-8");
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx > 0) {
              const key = trimmed.substring(0, eqIdx).trim();
              let val = trimmed.substring(eqIdx + 1).trim();
              if (
                (val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))
              ) {
                val = val.substring(1, val.length - 1);
              }
              if (process.env[key] === undefined) {
                process.env[key] = val;
              }
            }
          }
        });
        break;
      }
    } catch (_) {}
  }

  // If DATABASE_URL is not set but DATABASE_URL2 is provided, fallback
  if (!process.env.DATABASE_URL && process.env.DATABASE_URL2) {
    process.env.DATABASE_URL = process.env.DATABASE_URL2.trim();
  }
}

module.exports = { loadEnv };
