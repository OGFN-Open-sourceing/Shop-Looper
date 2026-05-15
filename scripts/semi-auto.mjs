import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import config from "../config.js";

const ROOT_DIR = process.cwd();
const ENV_FILE = path.join(ROOT_DIR, ".env");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: "inherit",
      ...options
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function resolveOutputFiles() {
  const files = [];

  if (Array.isArray(config.outputTargets) && config.outputTargets.length > 0) {
    for (const target of config.outputTargets) {
      const fileName = target.outputFile || config.outputFile;
      const outputPath = target.outputPath || config.outputPath || "./output";
      files.push(path.resolve(ROOT_DIR, outputPath, fileName));
    }
  } else {
    files.push(path.resolve(ROOT_DIR, config.outputPath || "./output", config.outputFile || "catalog_config.json"));
  }

  return Array.from(new Set(files));
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function parseIntSafe(value, fallback) {
  const num = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(num) ? num : fallback;
}

async function deployLocal(files) {
  const targetDir = process.env.SEMI_AUTO_LOCAL_TARGET_DIR;
  if (!targetDir) {
    throw new Error("SEMI_AUTO_LOCAL_TARGET_DIR is required when SEMI_AUTO_MODE=local");
  }

  const resolvedTargetDir = path.resolve(ROOT_DIR, targetDir);
  fs.mkdirSync(resolvedTargetDir, { recursive: true });

  for (const file of files) {
    if (!fs.existsSync(file)) {
      throw new Error(`Expected output not found: ${file}`);
    }

    const fileName = path.basename(file);
    const targetPath = path.join(resolvedTargetDir, fileName);
    fs.copyFileSync(file, targetPath);
    console.log(`[semi-auto] copied ${fileName} -> ${targetPath}`);
  }
}

async function deployVps(files) {
  const host = process.env.VPS_HOST;
  const user = process.env.VPS_USER;
  const port = parseIntSafe(process.env.VPS_PORT, 22);
  const remoteDir = process.env.VPS_REMOTE_DIR;
  const keyPath = process.env.VPS_KEY_PATH;
  const postDeployCmd = process.env.VPS_POST_DEPLOY_CMD;

  if (!host || !user || !remoteDir) {
    throw new Error("VPS_HOST, VPS_USER and VPS_REMOTE_DIR are required when SEMI_AUTO_MODE=vps");
  }

  const sshBaseArgs = ["-p", String(port)];
  const scpBaseArgs = ["-P", String(port)];

  if (keyPath) {
    const resolvedKey = path.resolve(ROOT_DIR, keyPath);
    sshBaseArgs.push("-i", resolvedKey);
    scpBaseArgs.push("-i", resolvedKey);
  }

  await runCommand("ssh", [...sshBaseArgs, `${user}@${host}`, `mkdir -p '${remoteDir}'`]);

  for (const file of files) {
    if (!fs.existsSync(file)) {
      throw new Error(`Expected output not found: ${file}`);
    }

    const fileName = path.basename(file);
    const remotePath = `${remoteDir}/${fileName}`;

    await runCommand("scp", [...scpBaseArgs, file, `${user}@${host}:'${remotePath}'`]);
    console.log(`[semi-auto] uploaded ${fileName} -> ${remotePath}`);
  }

  if (postDeployCmd) {
    await runCommand("ssh", [...sshBaseArgs, `${user}@${host}`, postDeployCmd]);
    console.log("[semi-auto] ran VPS post-deploy command");
  }
}

async function runCycle() {
  console.log("[semi-auto] generating shop...");
  await runCommand("node", ["index.js"]);

  const mode = (process.env.SEMI_AUTO_MODE || "off").toLowerCase();
  const files = resolveOutputFiles();

  if (mode === "local") {
    await deployLocal(files);
    return;
  }

  if (mode === "vps") {
    await deployVps(files);
    return;
  }

  console.log("[semi-auto] deploy skipped (SEMI_AUTO_MODE=off)");
}

async function main() {
  loadEnvFile(ENV_FILE);

  const argSet = new Set(process.argv.slice(2));
  const cliOnce = argSet.has("--once");

  const runOnce = cliOnce || parseBool(process.env.SEMI_AUTO_RUN_ONCE, false);
  const intervalMinutes = parseIntSafe(
    process.env.SEMI_AUTO_INTERVAL_MINUTES,
    parseIntSafe(config.ShopRotationIntervalMinutes, 1440)
  );

  if (intervalMinutes < 1) {
    throw new Error("SEMI_AUTO_INTERVAL_MINUTES must be >= 1");
  }

  await runCycle();

  if (runOnce) return;

  const intervalMs = intervalMinutes * 60 * 1000;
  console.log(`[semi-auto] waiting ${intervalMinutes} minute(s) between cycles`);

  setInterval(async () => {
    try {
      await runCycle();
    } catch (error) {
      console.error("[semi-auto] cycle failed:", error.message);
    }
  }, intervalMs);
}

main().catch((error) => {
  console.error("[semi-auto] fatal:", error.message);
  process.exit(1);
});
