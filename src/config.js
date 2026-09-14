const MAX_SERVERS = 5;

function clean(value) {
  return String(value || "").trim();
}

export function discordToken() {
  return clean(
    process.env.DISCORD_TOKEN ||
      process.env.BOT_TOKEN ||
      process.env.TOKEN
  );
}

export function appId() {
  return clean(process.env.WARDOGS_APP_ID || "1867240");
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

export function getServers() {
  const servers = [];

  for (let i = 1; i <= MAX_SERVERS; i += 1) {
    const name = clean(process.env[`SERVER_${i}_NAME`]);
    const joinUrl = clean(process.env[`SERVER_${i}_JOIN_URL`]);
    const enabledRaw = clean(process.env[`SERVER_${i}_ENABLED`]);
    const enabled = enabledRaw ? enabledRaw !== "0" : Boolean(name || joinUrl);

    if (!enabled) continue;

    servers.push({
      id: String(i),
      name: name || `ZARUBA ${i}`,
      envJoinUrl: joinUrl,
    });
  }

  if (servers.length === 0) {
    servers.push({ id: "1", name: "ZARUBA", envJoinUrl: "" });
  }

  return servers;
}

export function getServer(id) {
  const key = clean(id).replace(/\D+/g, "");
  return getServers().find((server) => server.id === key) || null;
}

export function normalizeJoinValue(value) {
  const raw = clean(value);
  if (!raw) return "";

  if (/^steam:\/\/joinlobby\/\d+\/\d+(?:\/\d+)?\/?$/i.test(raw)) {
    return raw.replace(/\/$/, "");
  }

  if (/^steam:\/\/connect\/[a-z0-9_.:-]+$/i.test(raw)) {
    return raw;
  }

  // Если админ вставил только Lobby ID, собираем ссылку для WARDOGS.
  if (/^\d{5,}$/.test(raw)) {
    return `steam://joinlobby/${appId()}/${raw}`;
  }

  return "";
}
