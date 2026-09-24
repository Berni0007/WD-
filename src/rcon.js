async function rconGet(server, path) {
  const url = `http://${server.rconHost}:${server.rconPort || 80}${path}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${server.rconPassword}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`RCON HTTP ${response.status}`);
  return response.json();
}

export async function fetchRconPlayers(server) {
  if (!server.rconHost || !server.rconPassword) return [];
  const data = await rconGet(server, "/v1/players");
  return Array.isArray(data.players) ? data.players : [];
}

export async function fetchRconServerId(server) {
  if (!server.rconHost || !server.rconPassword) return "";
  const data = await rconGet(server, "/v1/server-id");
  return String(data?.serverId || "").trim();
}
