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

function normalizeWebUrl(value) {
  const raw = clean(value);
  if (!raw) return "";

  const url = (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).replace(/\/$/, "");

  // Нельзя использовать прямую ссылку на изображение как адрес веб-приложения.
  if (/\.(?:png|jpe?g|gif|webp|svg)(?:\?.*)?$/i.test(url)) return "";

  return url;
}

export function publicUrl() {
  // Сначала системный домен Bothost, затем PUBLIC_URL как совместимый запасной вариант.
  return normalizeWebUrl(process.env.DOMAIN) || normalizeWebUrl(process.env.PUBLIC_URL);
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


export function warconUrl() {
  return normalizeWebUrl(process.env.WARCON_URL);
}

export function warconServerId() {
  return clean(process.env.WARCON_SERVER_ID);
}

export function warconApiKey() {
  return clean(process.env.WARCON_API_KEY);
}
