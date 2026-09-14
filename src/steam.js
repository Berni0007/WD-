const SUMMARIES_URL = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/";

export async function fetchPlayerSummaries(apiKey, steamIds) {
  const unique = [...new Set((steamIds || []).filter(Boolean))];
  if (!apiKey || unique.length === 0) return [];

  const players = [];
  for (let i = 0; i < unique.length; i += 100) {
    const group = unique.slice(i, i + 100);
    const url = new URL(SUMMARIES_URL);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("steamids", group.join(","));

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Steam API ${response.status}`);
    const data = await response.json();
    players.push(...(data?.response?.players || []));
  }
  return players;
}

export function lobbyFromSummary(player, expectedAppId) {
  if (!player?.steamid) return null;
  if (String(player.gameid || "") !== String(expectedAppId)) return null;
  if (!player.lobbysteamid) return null;

  return {
    steamId: String(player.steamid),
    lobbyId: String(player.lobbysteamid),
    appId: String(player.gameid || expectedAppId),
    persona: String(player.personaname || ""),
  };
}

export function toSteamJoinUrl({ appId, lobbyId, steamId }) {
  if (!appId || !lobbyId || !steamId) return "";
  return `steam://joinlobby/${appId}/${lobbyId}/${steamId}`;
}
