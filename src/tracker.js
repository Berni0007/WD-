import { getServer, staleAfterMs, steamApiKey, wardogsAppId } from "./config.js";
import { fetchRconPlayers } from "./rcon.js";
import { fetchPlayerSummaries, lobbyFromSummary, toSteamJoinUrl } from "./steam.js";

let cached = null;
let cachedAt = 0;
let busy = null;

function validSteamId(value) {
  const id = String(value || "");
  return /^7656119\d{10}$/.test(id) ? id : "";
}

function cachedResult(server) {
  if (!cached || Date.now() - cachedAt >= staleAfterMs()) return null;
  return {
    ok: true,
    reason: "cached",
    server,
    lobby: cached,
    steamUrl: toSteamJoinUrl(cached),
  };
}

async function resolveNow() {
  const server = getServer();
  const apiKey = steamApiKey();
  const appId = wardogsAppId();

  if (!apiKey) return { ok: false, reason: "no-steam-key", server };

  const ids = new Set(server.seeds);

  if (server.rconHost && server.rconPassword) {
    try {
      const players = await fetchRconPlayers(server);
      for (const player of players) {
        const steamId = validSteamId(player.steamId);
        if (steamId) ids.add(steamId);
      }
    } catch (error) {
      console.error("RCON players:", error.message);
      const old = cachedResult(server);
      if (old) return old;
    }
  }

  if (ids.size === 0) {
    return cachedResult(server) || { ok: false, reason: "no-players", server };
  }

  try {
    const summaries = await fetchPlayerSummaries(apiKey, [...ids]);
    for (const player of summaries) {
      const lobby = lobbyFromSummary(player, appId);
      if (!lobby) continue;

      cached = lobby;
      cachedAt = Date.now();
      return {
        ok: true,
        reason: "ready",
        server,
        lobby,
        steamUrl: toSteamJoinUrl(lobby),
      };
    }
  } catch (error) {
    console.error("Steam API:", error.message);
  }

  return cachedResult(server) || { ok: false, reason: "nolobby", server };
}

export async function liveJoin() {
  if (busy) return busy;
  busy = resolveNow().finally(() => {
    busy = null;
  });
  return busy;
}
