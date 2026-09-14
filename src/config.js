function clean(value) {
  return String(value || "").trim();
}

export function discordToken() {
  return clean(
    process.env.DISCORD_BOT_TOKEN ||
      process.env.DISCORD_TOKEN ||
      process.env.BOT_TOKEN ||
      process.env.TOKEN
  );
}

function normalizeDomain(value) {
  const raw = clean(value);
  if (!raw) return "";
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return url.replace(/\/$/, "");
}

export function publicUrl() {
  // На Bothost реальный публичный адрес должен приходить из системного DOMAIN.
  // PUBLIC_URL намеренно не используем, чтобы не отправлять устаревшие/неверные ссылки.
  return normalizeDomain(process.env.DOMAIN);
}

export function steamApiKey() {
  return clean(process.env.STEAM_API_KEY);
}

export function gameAppId() {
  return clean(process.env.GAME_APP_ID || process.env.WARDOGS_APP_ID || "1867240");
}

export function serverConfig() {
  return {
    name: clean(process.env.SERVER_1_NAME || process.env.COMMUNITY_NAME || "ZARUBA"),
    query: clean(process.env.SERVER_1_QUERY),
    gameId: clean(process.env.SERVER_1_GAME_ID),
    rconHost: clean(process.env.SERVER_1_RCON_HOST),
    rconPort: clean(process.env.SERVER_1_RCON_PORT),
    rconPassword: clean(process.env.SERVER_1_RCON_PASSWORD),
  };
}
