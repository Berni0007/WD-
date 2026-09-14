import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
} from "discord.js";
import {
  discordToken,
  getServers,
  httpJoinUrl,
  publicUrl,
  steamApiKey,
  steamJoinUrl,
} from "./config.js";

const PANEL_TITLE = "ZARUBA · WARDOGS";

function invitePayload() {
  const servers = getServers().slice(0, 5);
  const site = publicUrl();
  const steamConfigured = Boolean(steamApiKey());

  const embed = new EmbedBuilder()
    .setTitle(process.env.PANEL_TITLE || PANEL_TITLE)
    .setDescription("Нажми кнопку **ПОДКЛЮЧИТЬСЯ** ниже — сервис найдёт сервер и откроет Steam/WARDOGS.")
    .setColor(0xb51e24);

  for (const server of servers) {
    const lines = [];
    if (server.gameId) lines.push(`Server ID: **${server.gameId}**`);
    if (server.query) lines.push(`Поиск: \`${server.query}\``);
    if (server.address) lines.push(`Адрес: \`${server.address}\``);

    const webUrl = httpJoinUrl(server);
    if (webUrl) lines.push(`Ссылка: ${webUrl}`);

    if (steamJoinUrl(server)) {
      lines.push("✅ Прямой Steam-переход задан в настройках.");
    } else if (steamConfigured) {
      lines.push("✅ Steam API включён — адрес сервера определяется автоматически при клике.");
    } else {
      lines.push("⚠️ Не задан STEAM_API_KEY и нет прямого IP:PORT.");
    }

    embed.addFields({
      name: server.name,
      value: lines.join("\n") || "Сервер настроен",
      inline: false,
    });
  }

  const row = new ActionRowBuilder();
  for (const server of servers) {
    const url = httpJoinUrl(server);
    if (!url) continue;

    row.addComponents(
      new ButtonBuilder()
        .setLabel(servers.length === 1 ? "ПОДКЛЮЧИТЬСЯ" : server.name.slice(0, 80))
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );
  }

  return {
    content: site
      ? "**Подключение к серверу ZARUBA:**"
      : "⚠️ На Bothost не назначен DOMAIN — кнопка подключения недоступна.",
    embeds: [embed],
    components: row.components.length ? [row] : [],
  };
}

async function publishInvite(client) {
  const channelId = String(process.env.DISCORD_CHANNEL_ID || "").trim();
  if (!channelId) throw new Error("Не задан DISCORD_CHANNEL_ID");

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased() || typeof channel.send !== "function") {
    throw new Error(`Канал ${channelId} не найден или бот не может писать в него`);
  }

  const payload = invitePayload();

  try {
    const recent = await channel.messages.fetch({ limit: 30 });
    const existing = recent.find(
      (message) =>
        message.author?.id === client.user.id &&
        message.embeds?.some(
          (embed) => embed.title === (process.env.PANEL_TITLE || PANEL_TITLE)
        )
    );

    if (existing) {
      await existing.edit(payload);
      console.log(`Discord: приглашение обновлено в канале ${channelId}`);
      return;
    }
  } catch (error) {
    console.log(`Discord: не удалось прочитать историю канала (${error.message})`);
  }

  await channel.send(payload);
  console.log(`Discord: приглашение опубликовано в канале ${channelId}`);
}

export async function startDiscordBot() {
  const token = discordToken();
  if (!token) throw new Error("Не задан Discord Bot Token");

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Discord: ${readyClient.user.tag}`);
    try {
      await publishInvite(readyClient);
    } catch (error) {
      console.error("Discord: не удалось опубликовать приглашение:", error.message);
    }
  });

  await client.login(token);
  return client;
}
