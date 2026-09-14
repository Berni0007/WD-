export async function fetchRconPlayers(server) {
  if (!server?.rconHost || !server?.rconPassword) return [];

  const port = server.rconPort || "80";
  const url = `http://${server.rconHost}:${port}/v1/players`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${server.rconPassword}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`RCON HTTP ${response.status}`);

  const data = await response.json();
  return Array.isArray(data.players) ? data.players : [];
}
