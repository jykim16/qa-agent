import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

const DEBUG = process.argv.includes("--debug") || process.env.QA_AGENT_DEBUG === "true";
const BASE_DIR = ".qa-agent";
const LOG_DIR = join(BASE_DIR, "debug");
const LOG_FILE = join(LOG_DIR, `qa-agent-${new Date().toISOString().split("T")[0]}.log`);

let initialized = false;

function ensureLogDir(): void {
  if (initialized) return;
  mkdirSync(LOG_DIR, { recursive: true });
  initialized = true;
}

function writeLog(level: string, message: string): void {
  ensureLogDir();
  appendFileSync(LOG_FILE, `${message}\n`);
}

export function debug(category: string, message: string, data?: unknown): void {
  if (!DEBUG) return;
  const timestamp = new Date().toISOString();
  const dataStr = data !== undefined ? ` ${JSON.stringify(data, null, 2)}` : "";
  const line = `[${timestamp}] [DEBUG] [${category}] ${message}${dataStr}`;
  writeLog("DEBUG", line);
}

export function info(message: string): void {
  const line = `[${new Date().toISOString()}] [INFO] ${message}`;
  writeLog("INFO", line);
}

export function error(message: string, err?: unknown): void {
  const errStr = err instanceof Error ? `: ${err.message}` : err ? `: ${err}` : "";
  const line = `[${new Date().toISOString()}] [ERROR] ${message}${errStr}`;
  writeLog("ERROR", line);
}

export function isDebugEnabled(): boolean {
  return DEBUG;
}

export function getLogFile(): string {
  return LOG_FILE;
}
