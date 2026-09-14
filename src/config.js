function clean(value) {
  return String(value || "").trim();
}

function parseIds(value) {
  return clean(value)
    .split(/[,\s]+/)
    .map((id) => id.trim())
    .filter((id) => /^7656119\d{10}$/.test(id));
}

export function discordToken() {
  return clean(
    process.env.DISCORD_BOT_TOKEN ||
      process.env.DISCORD_TOKEN ||
      process.env.SERVER_1_BOT_TOKEN
  );
}

export function publicUrl() {
  const raw = clean(process.env.PUBLIC_URL || process.env.DOMAIN);
  if (!raw) return "";
  return (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).replace(/\/$/, "");
}

export function steamApiKey() {
  return clean(process.env.STEAM_API_KEY);
}

export function wardogsAppId() {
  return clean(process.env.GAME_APP_ID || "1867240");
}

export function pollIntervalMs() {
  const value = Number(process.env.POLL_INTERVAL_MS || 15000);
  return Number.isFinite(value) && value >= 1000 ? value : 15000;
}

export function staleAfterMs() {
  const value = Number(process.env.STALE_AFTER_MS || 45000);
  return Number.isFinite(value) && value >= 1000 ? value : 45000;
}

export function getServer() {
  return {
    id: "1",
    name: clean(process.env.SERVER_1_NAME || "СЕРВЕР 1"),
    gameId: clean(process.env.SERVER_1_GAME_ID),
    query: clean(process.env.SERVER_1_QUERY),
    rconHost: clean(process.env.SERVER_1_RCON_HOST),
    rconPort: clean(process.env.SERVER_1_RCON_PORT),
    rconPassword: clean(process.env.SERVER_1_RCON_PASSWORD),
    seeds: parseIds(process.env.SERVER_1_SEEDS),
  };
}
