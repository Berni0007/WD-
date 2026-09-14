const MAX_SERVERS = 5;

function clean(value) {
  return String(value || "").trim();
}

export function discordToken() {
  return clean(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || process.env.TOKEN);
}

export function publicUrl() {
  const raw = clean(process.env.PUBLIC_URL || process.env.DOMAIN);
  if (raw) {
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return url.replace(/\/$/, "");
  }

  const webhook = clean(process.env.WEBHOOK_URL);
  if (webhook.startsWith("http")) {
    try {
      return new URL(webhook).origin;
    } catch {
      // ignore
    }
  }

  const botId = clean(process.env.BOT_ID);
  if (botId) {
    const slug = botId.replace(/^bot[-_]/i, "").replace(/_/g, "-");
    if (slug) return `https://bot-${slug}.bothost.tech`;
  }

  return "";
}

function normalizeAddress(value) {
  let raw = clean(value);
  if (!raw) return "";
  raw = raw.replace(/^steam:\/\/connect\//i, "").replace(/\/$/, "");

  if (/^(?:[a-z0-9.-]+|\[[0-9a-f:]+\]):\d{1,5}$/i.test(raw)) return raw;
  return "";
}

export function normalizeJoinValue(value) {
  const raw = clean(value);
  if (!raw) return "";

  if (/^steam:\/\/joinlobby\/\d+\/\d+(?:\/\d+)?\/?$/i.test(raw)) {
    return raw.replace(/\/$/, "");
  }

  const address = normalizeAddress(raw);
  if (address) return `steam://connect/${address}`;

  return "";
}

export function getServers() {
  const servers = [];

  for (let i = 1; i <= MAX_SERVERS; i += 1) {
    const name = clean(process.env[`SERVER_${i}_NAME`]);
    const gameId = clean(process.env[`SERVER_${i}_GAME_ID`] || process.env[`SERVER_${i}_ID`]);
    const joinUrl = clean(process.env[`SERVER_${i}_JOIN_URL`]);

    const host = clean(process.env[`SERVER_${i}_HOST`] || process.env[`SERVER_${i}_IP`]);
    const port = clean(process.env[`SERVER_${i}_PORT`]);
    const explicitAddress = clean(
      process.env[`SERVER_${i}_ADDR`] || process.env[`SERVER_${i}_ADDRESS`]
    );
    const address = normalizeAddress(explicitAddress || (host && port ? `${host}:${port}` : ""));

    const enabledRaw = clean(process.env[`SERVER_${i}_ENABLED`]);
    const enabled = enabledRaw
      ? enabledRaw !== "0"
      : Boolean(name || gameId || joinUrl || address);

    if (!enabled) continue;

    servers.push({
      id: String(i),
      name: name || `ZARUBA ${i}`,
      gameId,
      address,
      envJoinUrl: joinUrl,
    });
  }

  if (servers.length === 0) {
    servers.push({ id: "1", name: "ZARUBA", gameId: "", address: "", envJoinUrl: "" });
  }

  return servers;
}

export function getServer(id) {
  const key = clean(id).replace(/\D+/g, "");
  return getServers().find((server) => server.id === key) || null;
}

export function steamJoinUrl(server) {
  if (!server) return "";

  const explicit = normalizeJoinValue(server.envJoinUrl);
  if (explicit) return explicit;

  if (server.address) return `steam://connect/${server.address}`;
  return "";
}

export function httpJoinUrl(server) {
  const site = publicUrl();
  if (!site || !server) return "";
  return `${site}/join/${encodeURIComponent(server.id)}`;
}
