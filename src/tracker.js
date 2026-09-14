import { gameAppId, serverConfig, steamApiKey } from "./config.js";
import { fetchRconPlayers } from "./rcon.js";
import { fetchPlayerSummaries, lobbyFromSummary, toSteamJoinUrl } from "./steam.js";

export async function liveJoin() {
  const server = serverConfig();
  const apiKey = steamApiKey();
  const appId = gameAppId();

  if (!server.rconHost || !server.rconPassword) {
    return { ok: false, reason: "rcon-not-configured", server };
  }
  if (!apiKey) {
    return { ok: false, reason: "steam-key-missing", server };
  }

  const players = await fetchRconPlayers(server);
  const steamIds = players
    .map((player) => String(player.steamId || ""))
    .filter((id) => /^7656119\d{10}$/.test(id));

  if (steamIds.length === 0) {
    return { ok: false, reason: "empty", server };
  }

  const summaries = await fetchPlayerSummaries(apiKey, steamIds);
  for (const player of summaries) {
    const lobby = lobbyFromSummary(player, appId);
    if (!lobby) continue;
    return {
      ok: true,
      reason: "ready",
      server,
      steamUrl: toSteamJoinUrl(lobby),
    };
  }

  return { ok: false, reason: "nolobby", server };
}
