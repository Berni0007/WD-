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
const ROLE_CHANNEL_ID = "1206624451429408778";
const ROLE_PANEL_MARKER = "ZARUBA · ИГРОВЫЕ РОЛИ";

const ROLE_BUTTONS = {
  role_wardogs: {
    roleId: "1546625919706337300",
    label: "WARDOGS",
    emoji: "🐺",
  },
  role_arma: {
    roleId: "1334928209543823382",
    label: "ARMA REFORGER",
    emoji: "🪖",
  },
};

function joinPayload() {
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
      : "**ZARUBA · WARDOGS**\nВ Bothost не включён домен. Открой вкладку «Домен» и включи веб-домен для порта 3000.",
    embeds: [],
    components,
    attachments: [],
  };
}

function rolePayload() {
  return {
    content:
      `**${ROLE_PANEL_MARKER}**\nВыберите игру, новости по которой хотите получать.\nНажмите кнопку ниже, чтобы получить роль. Повторное нажатие снимет её.`,
    embeds: [],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("role_wardogs")
          .setLabel("WARDOGS")
          .setEmoji("🐺")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("role_arma")
          .setLabel("ARMA REFORGER")
          .setEmoji("🪖")
          .setStyle(ButtonStyle.Secondary)
      ),
    ],
    attachments: [],
  };
}

async function publishJoin(client) {
  const channelId = String(process.env.DISCORD_CHANNEL_ID || "").trim();
  if (!channelId) throw new Error("Не задан DISCORD_CHANNEL_ID");

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased() || typeof channel.send !== "function") {
    throw new Error("Discord-канал подключения не найден или бот не может писать");
  }

  const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  const existing = recent?.find((message) => {
    if (message.author?.id !== client.user.id) return false;
    if (message.embeds?.some((embed) => embed.title === OLD_TITLE)) return true;
    return String(message.content || "").includes("ZARUBA · WARDOGS");
  });

  if (existing) {
    await existing.edit(joinPayload());
    console.log("Discord: ссылка подключения обновлена");
  } else {
    await channel.send(joinPayload());
    console.log("Discord: ссылка подключения опубликована");
  }
}

async function publishRoles(client) {
  const channel = await client.channels.fetch(ROLE_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || typeof channel.send !== "function") {
    throw new Error("Discord-канал ролей не найден или бот не может писать");
  }

  const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  const existing = recent?.find((message) => {
    if (message.author?.id !== client.user.id) return false;
    return String(message.content || "").includes(ROLE_PANEL_MARKER);
  });

  if (existing) {
    await existing.edit(rolePayload());
    console.log("Discord: панель ролей обновлена");
  } else {
    await channel.send(rolePayload());
    console.log("Discord: панель ролей опубликована");
  }
}

async function handleRoleButton(interaction) {
  const config = ROLE_BUTTONS[interaction.customId];
  if (!config || !interaction.guild) return;

  try {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const hasRole = member.roles.cache.has(config.roleId);

    if (hasRole) {
      await member.roles.remove(config.roleId);
      await interaction.reply({
        content: `Роль **${config.label}** снята.`,
        ephemeral: true,
      });
    } else {
      await member.roles.add(config.roleId);
      await interaction.reply({
        content: `Роль **${config.label}** выдана.`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(`Discord role ${config.label}:`, error);

    const message =
      "Не удалось изменить роль. Проверьте, что у бота есть право **Управление ролями**, а роль бота находится выше выдаваемых ролей.";

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
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
      await publishJoin(ready);
    } catch (error) {
      console.error("Discord join publish:", error.message);
    }

    try {
      await publishRoles(ready);
    } catch (error) {
      console.error("Discord roles publish:", error.message);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (!ROLE_BUTTONS[interaction.customId]) return;
    await handleRoleButton(interaction);
  });

  await client.login(token);
  return client;
}
