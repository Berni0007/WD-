import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Events,
  GatewayIntentBits,
} from "discord.js";
import { discordToken, publicUrl, serverConfig } from "./config.js";

const OLD_TITLE = "ZARUBA · WARDOGS";

function payload() {
  const server = serverConfig();
  const url = publicUrl();
  const joinUrl = url ? `${url}/join` : "";

  const components = joinUrl
    ? [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("ИГРАТЬ")
            .setStyle(ButtonStyle.Link)
            .setURL(joinUrl)
        ),
      ]
    : [];

  return {
    content: joinUrl
      ? `**ZARUBA · WARDOGS**\nПодключение к **${server.name}**\n${joinUrl}`
      : `**ZARUBA · WARDOGS**\nPUBLIC_URL не задан.`,
    embeds: [],
    components,
    attachments: [],
  };
}

async function publish(client) {
  const channelId = String(process.env.DISCORD_CHANNEL_ID || "").trim();
  if (!channelId) throw new Error("Не задан DISCORD_CHANNEL_ID");

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased() || typeof channel.send !== "function") {
    throw new Error("Discord-канал не найден или бот не может писать");
  }

  const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  const existing = recent?.find((message) => {
    if (message.author?.id !== client.user.id) return false;
    if (message.embeds?.some((embed) => embed.title === OLD_TITLE)) return true;
    return String(message.content || "").includes("ZARUBA · WARDOGS");
  });

  if (existing) {
    await existing.edit(payload());
    console.log("Discord: ссылка обновлена без картинки");
  } else {
    await channel.send(payload());
    console.log("Discord: ссылка опубликована без картинки");
  }
}

export async function startBot() {
  const token = discordToken();
  if (!token) throw new Error("Не задан Discord Bot Token");

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  client.once(Events.ClientReady, async (ready) => {
    console.log(`Discord: ${ready.user.tag}`);
    try {
      await publish(ready);
    } catch (error) {
      console.error("Discord publish:", error.message);
    }
  });

  await client.login(token);
  return client;
}
