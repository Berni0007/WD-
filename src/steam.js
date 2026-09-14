import { appId, steamApiKey, steamJoinUrl } from "./config.js";

let cache = { at: 0, servers: [] };
const CACHE_MS = 15_000;

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function toListing(server) {
  const rawAddr = String(server.addr || "");
  const [host] = rawAddr.split(":");
  const gamePort = server.gameport || rawAddr.split(":")[1];

  return {
    name: String(server.name || ""),
    steamId: server.steamid ? String(server.steamid) : "",
    addr: host && gamePort ? `${host}:${gamePort}` : rawAddr,
    players: Number(server.players || 0),
    maxPlayers: Number(server.max_players || 0),
    map: String(server.map || ""),
  };
}

async function fetchServerList() {
  const key = steamApiKey();
  if (!key) return [];

  if (Date.now() - cache.at < CACHE_MS && cache.servers.length) {
    return cache.servers;
  }

  const url = new URL("https://api.steampowered.com/IGameServersService/GetServerList/v1/");
  url.searchParams.set("key", key);
  url.searchParams.set("limit", "5000");
  url.searchParams.set("filter", `\\appid\\${appId()}`);

  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    throw new Error(`Steam API ${response.status}`);
  }

  const data = await response.json();
  const servers = (data?.response?.servers || []).map(toListing);
  cache = { at: Date.now(), servers };
  return servers;
}

function score(listing, server) {
  const name = normalize(listing.name);
  const query = normalize(server.query);
  const display = normalize(server.name);

  if (query && name === query) return 1000;
  if (query && name.includes(query)) return 800;
  if (display && name === display) return 700;
  if (display && name.includes(display)) return 500;

  if (server.gameId) {
    if (String(listing.steamId) === String(server.gameId)) return 950;
    if (name.includes(String(server.gameId))) return 600;
  }

  const queryNum = query.match(/#\s*(\d+)/)?.[1];
  const nameNum = name.match(/#\s*(\d+)/)?.[1];
  if (queryNum && nameNum && queryNum === nameNum && name.includes("wardogs")) return 650;

  return 0;
}

export async function findSteamServer(server) {
  const servers = await fetchServerList();
  let best = null;
  let bestScore = 0;

  for (const listing of servers) {
    const current = score(listing, server);
    if (current > bestScore) {
      bestScore = current;
      best = listing;
    }
  }

  return bestScore > 0 ? best : null;
}

export async function resolveJoin(server) {
  const direct = steamJoinUrl(server);
  if (direct) {
    return { steamUrl: direct, source: "config", listing: null };
  }

  if (!steamApiKey()) {
    return { steamUrl: "", source: "no-steam-key", listing: null };
  }

  const listing = await findSteamServer(server);
  if (!listing?.addr) {
    return { steamUrl: "", source: "not-found", listing: null };
  }

  return {
    steamUrl: `steam://connect/${listing.addr}`,
    source: "steam-api",
    listing,
  };
}
