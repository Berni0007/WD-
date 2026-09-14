import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
} from "discord.js";
import { discordToken, publicUrl, serverConfig } from "./config.js";

const TITLE = "ZARUBA · WARDOGS";

function payload() {
  const server = serverConfig();
  const url = publicUrl();
  const embed = new EmbedBuilder()
    .setTitle(TITLE)
    .setDescription(`Нажми **Играть**, чтобы подключиться к **${server.name}**.`)
    .setColor(0xb51e24);

  const components = url
    ? [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Играть")
            .setStyle(ButtonStyle.Link)
            .setURL(`${url}/join`)
        ),
      ]
    : [];

  return { embeds: [embed], components };
}

async function publish(client) {
  const channelId = String(process.env.DISCORD_CHANNEL_ID || "").trim();
  if (!channelId) throw new Error("Не задан DISCORD_CHANNEL_ID");

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased() || typeof channel.send !== "function") {
    throw new Error("Discord-канал не найден или бот не может писать");
  }

  const recent = await channel.messages.fetch({ limit: 30 }).catch(() => null);
  const existing = recent?.find(
    (message) => message.author?.id === client.user.id && message.embeds?.[0]?.title === TITLE
  );

  if (existing) {
    await existing.edit(payload());
    console.log("Discord: ссылка обновлена");
  } else {
    await channel.send(payload());
    console.log("Discord: ссылка опубликована");
  }
}

export async function startBot() {
  const token = discordToken();
  if (!token) throw new Error("Не задан Discord Bot Token");

  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
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
