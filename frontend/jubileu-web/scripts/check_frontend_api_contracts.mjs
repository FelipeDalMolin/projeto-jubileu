import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const srcDir = join(root, "src");
const viteConfig = join(root, "vite.config.ts");
const scanDirs = [join(srcDir, "services"), join(srcDir, "lib")];
const failures = [];

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) return [];
    return [fullPath];
  });
}

function addFailure(file, lineNumber, message, line) {
  failures.push(
    `${relative(root, file)}:${lineNumber}: ${message}\n  ${line.trim()}`,
  );
}

function scanFile(file) {
  const content = readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (line.includes("/api/api")) {
      addFailure(file, lineNumber, "found duplicated /api/api prefix", line);
    }

    const suspiciousApiCall =
      /\b(fetch|buildUrl|url|requestJson|getJson|postJson|deleteJson|patchJson|apiFetch|apiJson)\s*\(\s*["'`]\/(dias|eventos|partidas|jogadores|turmas)(?:[/"'`?$]|\$\{)/.test(
        line,
      );
    if (suspiciousApiCall) {
      addFailure(
        file,
        lineNumber,
        "suspected API call without /api gateway prefix",
        line,
      );
    }
  });
}

function scanViteProxy() {
  if (!statSync(viteConfig, { throwIfNoEntry: false })) return;

  const content = readFileSync(viteConfig, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.includes("/api/api")) {
      addFailure(viteConfig, index + 1, "found duplicated /api/api prefix", line);
    }
    if (/\brewrite\b/.test(line) && /\/api/.test(line)) {
      addFailure(
        viteConfig,
        index + 1,
        "Vite proxy rewrite must not remove or alter the /api gateway prefix",
        line,
      );
    }
  });
}

scanDirs.forEach((dir) => {
  if (statSync(dir, { throwIfNoEntry: false })) {
    walk(dir).forEach(scanFile);
  }
});
scanViteProxy();

if (failures.length > 0) {
  console.error("API contract check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("API contract check OK: no suspicious service calls, /api/api, or Vite rewrite found.");
