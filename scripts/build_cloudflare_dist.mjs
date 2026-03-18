import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, ".cf-pages-dist");

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyRequiredFile(relativeSource, relativeTarget = relativeSource) {
  const src = path.join(rootDir, relativeSource);
  const dst = path.join(distDir, relativeTarget);
  if (!(await pathExists(src))) {
    throw new Error(`[cf-build] arquivo obrigatorio ausente: ${relativeSource}`);
  }
  await ensureDir(path.dirname(dst));
  await fs.copyFile(src, dst);
}

async function copyOptionalFile(relativeSource, relativeTarget = relativeSource) {
  const src = path.join(rootDir, relativeSource);
  const dst = path.join(distDir, relativeTarget);
  if (!(await pathExists(src))) {
    console.warn(`[cf-build] aviso: opcional ausente: ${relativeSource}`);
    return;
  }
  await ensureDir(path.dirname(dst));
  await fs.copyFile(src, dst);
}

async function copyRequiredDir(relativeSource, relativeTarget = relativeSource) {
  const src = path.join(rootDir, relativeSource);
  const dst = path.join(distDir, relativeTarget);
  if (!(await pathExists(src))) {
    throw new Error(`[cf-build] pasta obrigatoria ausente: ${relativeSource}`);
  }
  await ensureDir(path.dirname(dst));
  await fs.cp(src, dst, { recursive: true, force: true });
}

async function main() {
  console.log(`[cf-build] root: ${rootDir}`);
  console.log(`[cf-build] dist: ${distDir}`);

  await fs.rm(distDir, { recursive: true, force: true });
  await ensureDir(distDir);

  await copyRequiredFile("index.html");
  await copyRequiredFile("style.css");
  await copyRequiredFile("app.js");
  await copyRequiredDir("frontend");
  await copyRequiredDir("vendor");
  await copyOptionalFile("assets/sec-logo.png");
  await copyOptionalFile("assets/login-bg.jpg");

  const licenseSource = path.join(rootDir, "anotacoes/legal/license");
  const licenseTarget = path.join(distDir, "license");
  if (await pathExists(licenseSource)) {
    await fs.copyFile(licenseSource, licenseTarget);
  } else {
    await fs.writeFile(
      licenseTarget,
      "SEC Emendas - pacote estatico de homologacao Cloudflare Pages.",
      "utf8"
    );
  }

  console.log("[cf-build] pronto.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
