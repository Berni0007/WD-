import { warconApiKey, warconServerId, warconUrl } from "./config.js";

function baseUrl() {
  return String(warconUrl() || "").replace(/\/$/, "");
}

function authHeaders() {
  const apiKey = warconApiKey();
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

async function apiGet(path) {
  const response = await fetch(`${baseUrl()}${path}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`Warcon API HTTP ${response.status}${body ? `: ${body.slice(0, 180)}` : ""}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export function warconConfigured() {
  return Boolean(baseUrl() && warconApiKey());
}

async function resolveServerId() {
  const configured = warconServerId();
  if (configured) {
    try {
      await apiGet(`/api/servers/${encodeURIComponent(configured)}`);
      return configured;
    } catch (error) {
      if (error?.status !== 404) throw error;
    }
  }

  const data = await apiGet("/api/servers");
  const servers = Array.isArray(data?.servers) ? data.servers : [];
  if (servers.length === 0) throw new Error("В Warcon API нет доступных серверов");

  const preferred =
    servers.find((server) => /zaruba/i.test(String(server?.name || ""))) ||
    servers[0];

  const id = String(preferred?.id || "").trim();
  if (!id) throw new Error("Warcon вернул сервер без ID");
  return id;
}

export async function fetchWarconCareer(steamId) {
  const origin = baseUrl();
  const apiKey = warconApiKey();

  if (!origin || !apiKey) {
    throw new Error("WARCON_URL или WARCON_API_KEY не настроены");
  }

  const serverId = await resolveServerId();
  const data = await apiGet(
    `/api/servers/${encodeURIComponent(serverId)}/players/${encodeURIComponent(steamId)}/career`
  );

  let playerName = steamId;
  try {
    const dossier = await apiGet(
      `/api/servers/${encodeURIComponent(serverId)}/players/${encodeURIComponent(steamId)}`
    );
    playerName = dossier?.player?.name || dossier?.name || playerName;
  } catch {}

  return {
    player: { steamId, name: playerName },
    career: data?.career || data || {},
    serverId,
  };
}
