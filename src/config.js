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

export function publicUrl() {
  const raw = clean(process.env.PUBLIC_URL || process.env.DOMAIN);
  if (!raw) return "";
  return (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).replace(/\/$/, "");
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
