import { gameAppId, serverConfig, steamApiKey } from "./config.js";
import { fetchRconPlayers, fetchRconServerId } from "./rcon.js";
import {
  fetchPlayerSummaries,
  lobbyFromSummary,
  toSteamConnectUrl,
  toSteamJoinUrl,
} from "./steam.js";

async function resolveServerId(server) {
  try {
    const liveId = await fetchRconServerId(server);
    if (liveId) return liveId;
  } catch (error) {
    console.error("RCON server-id:", error.message);
  }

  return String(server.gameId || "").trim();
}

export async function liveJoin() {
  const server = serverConfig();
  const apiKey = steamApiKey();
  const appId = gameAppId();

  if (!server.rconHost || !server.rconPassword) {
    return { ok: false, reason: "rcon-not-configured", server, appId };
  }

  let players;
  try {
    players = await fetchRconPlayers(server);
  } catch (error) {
    console.error("RCON players:", error.message);
    return { ok: false, reason: "rcon-error", server, appId };
  }

  const steamIds = players
    .map((player) => String(player.steamId || ""))
    .filter((id) => /^7656119\d{10}$/.test(id));

  if (apiKey && steamIds.length > 0) {
    try {
      const summaries = await fetchPlayerSummaries(apiKey, steamIds);

      for (const player of summaries) {
        const lobby = lobbyFromSummary(player, appId);
        if (!lobby) continue;

        if (lobby.lobbyId) {
          return {
            ok: true,
            reason: "lobby",
            server,
            appId,
            steamUrl: toSteamJoinUrl(lobby),
          };
        }

        if (lobby.gameserverIp) {
          return {
            ok: true,
            reason: "gameserver",
            server,
            appId,
            steamUrl: toSteamConnectUrl(lobby.gameserverIp),
          };
        }
      }
    } catch (error) {
      console.error("Steam summaries:", error.message);
    }
  }

  const serverId = await resolveServerId(server);
  if (serverId) {
    return {
      ok: false,
      reason: "server-id",
      server,
      appId,
      serverId,
    };
  }

  if (steamIds.length === 0) {
    return { ok: false, reason: "empty", server, appId };
  }

  if (!apiKey) {
    return { ok: false, reason: "steam-key-missing", server, appId };
  }

  return { ok: false, reason: "nolobby", server, appId };
}
