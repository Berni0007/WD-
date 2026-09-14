import fs from "fs";
import path from "path";
import { getServer, normalizeJoinValue } from "./config.js";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "joins.json");

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function writeStore(data) {
  fs.mkdirSync(dataDir, { recursive: true });
  const temp = `${filePath}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(temp, filePath);
}

export function getJoinUrl(serverId) {
  const server = getServer(serverId);
  if (!server) return "";

  const stored = normalizeJoinValue(readStore()[server.id]);
  if (stored) return stored;

  return normalizeJoinValue(server.envJoinUrl);
}

export function setJoinUrl(serverId, value) {
  const server = getServer(serverId);
  const normalized = normalizeJoinValue(value);
  if (!server || !normalized) return false;

  const data = readStore();
  data[server.id] = normalized;
  writeStore(data);
  return true;
}

export function clearJoinUrl(serverId) {
  const server = getServer(serverId);
  if (!server) return false;

  const data = readStore();
  delete data[server.id];
  writeStore(data);
  return true;
}
