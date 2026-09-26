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

function payload() {
  const server = serverConfig();
  const url = publicUrl();
  const joinUrl = url ? `${url}/join` : "";

  const components = [];

  if (joinUrl) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("ИГРАТЬ")
          .setStyle(ButtonStyle.Link)
          .setURL(joinUrl)
      )
    );
  }

  components.push(
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
    )
  );

  return {
    content: joinUrl
      ? `**ZARUBA · WARDOGS**\nПодключение к **${server.name}**\n${joinUrl}\n\n**Выберите игровую роль:**\nНажмите кнопку ниже, чтобы получить роль. Повторное нажатие снимет её.`
      : "**ZARUBA · WARDOGS**\nВ Bothost не включён домен. Открой вкладку «Домен» и включи веб-домен для порта 3000.\n\n**Выберите игровую роль:**",
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
    console.log("Discord: ссылка и кнопки ролей обновлены");
  } else {
    await channel.send(payload());
    console.log("Discord: ссылка и кнопки ролей опубликованы");
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
      await publish(ready);
    } catch (error) {
      console.error("Discord publish:", error.message);
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
