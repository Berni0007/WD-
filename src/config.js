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
      process.env.BOT_TOKEN ||
      process.env.TOKEN
  );
}

export function publicUrl() {
  const raw = clean(process.env.DOMAIN || process.env.PUBLIC_URL);
  if (!raw) return "";
  return (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).replace(/\/$/, "");
}

export function steamApiKey() {
  return clean(process.env.STEAM_API_KEY);
}

export function wardogsAppId() {
  return clean(process.env.WARDOGS_APP_ID || "1867240");
}

export function getServer() {
  return {
    id: "1",
    name: clean(process.env.SERVER_1_NAME || "ZARUBA"),
    query: clean(process.env.SERVER_1_QUERY || "#1 [RU] WARDOGS RUSSIA"),
    gameId: clean(process.env.SERVER_1_GAME_ID || "428424"),
    rconHost: clean(process.env.SERVER_1_RCON_HOST),
    rconPort: clean(process.env.SERVER_1_RCON_PORT),
    rconPassword: clean(process.env.SERVER_1_RCON_PASSWORD),
    seeds: parseIds(process.env.SERVER_1_SEEDS),
  };
}
