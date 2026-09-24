import { gameAppId, serverConfig, steamApiKey } from "./config.js";
import { fetchRconPlayers } from "./rcon.js";
import {
  fetchPlayerSummaries,
  lobbyFromSummary,
  toSteamConnectUrl,
  toSteamJoinUrl,
} from "./steam.js";

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

  let players;
  try {
    players = await fetchRconPlayers(server);
  } catch (error) {
    console.error("RCON players:", error.message);
    return { ok: false, reason: "rcon-error", server };
  }

  const steamIds = players
    .map((player) => String(player.steamId || ""))
    .filter((id) => /^7656119\d{10}$/.test(id));

  if (steamIds.length === 0) {
    return { ok: false, reason: "empty", server };
  }

  let summaries;
  try {
    summaries = await fetchPlayerSummaries(apiKey, steamIds);
  } catch (error) {
    console.error("Steam summaries:", error.message);
    return { ok: false, reason: "steam-error", server };
  }

  for (const player of summaries) {
    const lobby = lobbyFromSummary(player, appId);
    if (!lobby) continue;

    if (lobby.lobbyId) {
      return {
        ok: true,
        reason: "lobby",
        server,
        steamUrl: toSteamJoinUrl(lobby),
      };
    }

    if (lobby.gameserverIp) {
      return {
        ok: true,
        reason: "gameserver",
        server,
        steamUrl: toSteamConnectUrl(lobby.gameserverIp),
      };
    }
  }

  return { ok: false, reason: "nolobby", server };
}
