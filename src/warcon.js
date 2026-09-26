import { warconApiKey, warconServerId, warconUrl } from "./config.js";

function baseUrl() {
  return String(warconUrl() || "").replace(/\/$/, "");
}

export function warconConfigured() {
  return Boolean(baseUrl() && warconServerId());
}

export async function fetchWarconCareer(steamId) {
  const origin = baseUrl();
  const serverId = warconServerId();
  const apiKey = warconApiKey();

  if (!origin || !serverId) {
    throw new Error("WARCON_URL или WARCON_SERVER_ID не настроены");
  }

  const path = apiKey
    ? `/api/servers/${encodeURIComponent(serverId)}/players/${encodeURIComponent(steamId)}/career`
    : `/api/public/servers/${encodeURIComponent(serverId)}/players/${encodeURIComponent(steamId)}`;

  const response = await fetch(`${origin}${path}`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 404) {
    throw new Error("Игрок не найден в статистике Warcon");
  }
  if (!response.ok) {
    throw new Error(`Warcon API HTTP ${response.status}`);
  }

  const data = await response.json();

  if (apiKey) {
    return {
      player: {
        steamId,
        name: data?.player?.name || data?.name || steamId,
      },
      career: data?.career || data,
    };
  }

  return {
    player: data?.player || { steamId, name: steamId },
    career: data?.career || {},
  };
}
