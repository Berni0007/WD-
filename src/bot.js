import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { discordToken, publicUrl, serverConfig, steamApiKey } from "./config.js";
import { fetchPlayerSummaries } from "./steam.js";
import { fetchWarconCareer, warconConfigured } from "./warcon.js";

const OLD_TITLE = "ZARUBA · WARDOGS";
const ROLE_CHANNEL_ID = "1206624451429408778";
const DOG_CHANNEL_ID = "1553370010158759969";
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


function fmtInt(value) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function fmtHours(minutes) {
  const total = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = Math.round(total % 60);
  return hours > 0 ? `${hours} ч ${mins} мин` : `${mins} мин`;
}

function fmtRank(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return `#${value}`;
  if (typeof value === "object") {
    const rank = value.rank ?? value.position ?? value.place;
    if (rank !== null && rank !== undefined) return `#${rank}`;
  }
  return String(value);
}

async function registerDogCommand(client) {
  const command = new SlashCommandBuilder()
    .setName("dog")
    .setDescription("Личная статистика игрока WARDOGS")
    .addStringOption((option) =>
      option
        .setName("steamid")
        .setDescription("SteamID64 игрока (17 цифр)")
        .setRequired(true)
        .setMinLength(17)
        .setMaxLength(17)
    )
    .toJSON();

  const commands = await client.application.commands.fetch();
  const existing = commands.find((item) => item.name === "dog");

  if (existing) {
    await client.application.commands.edit(existing.id, command);
  } else {
    await client.application.commands.create(command);
  }

  console.log("Discord: команда /dog зарегистрирована");
}

async function handleDogCommand(interaction) {
  if (interaction.channelId !== DOG_CHANNEL_ID) {
    await interaction.reply({
      content: `<#${DOG_CHANNEL_ID}> — канал личной статистики WARDOGS. Используй команду /dog там.`,
      ephemeral: true,
    });
    return;
  }

  const steamId = String(interaction.options.getString("steamid", true) || "").trim();

  if (!/^7656119\d{10}$/.test(steamId)) {
    await interaction.reply({
      content: "Укажи корректный SteamID64 — 17 цифр, например `7656119...`.",
      ephemeral: true,
    });
    return;
  }

  if (!warconConfigured()) {
    await interaction.reply({
      content: "Статистика Warcon ещё не подключена к боту: нужны `WARCON_URL` и `WARCON_SERVER_ID`.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    const { player, career } = await fetchWarconCareer(steamId);
    const kills = Number(career?.kills || 0);
    const deaths = Number(career?.deaths || 0);
    const matches = Number(career?.matches || 0);
    const wins = Number(career?.wins || 0);
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? kills.toFixed(2) : "0.00";
    const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : "0.0";

    let avatar = "";
    const key = steamApiKey();
    if (key) {
      try {
        const profiles = await fetchPlayerSummaries(key, [steamId]);
        avatar = String(profiles?.[0]?.avatarfull || profiles?.[0]?.avatarmedium || "");
      } catch (error) {
        console.error("Steam avatar:", error.message);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("🐕 WARDOG // БОЕВОЕ ДОСЬЕ")
      .setDescription(`**${player?.name || steamId}**\nSteamID: \`${steamId}\``)
      .addFields(
        { name: "⚔️ Убийства", value: fmtInt(kills), inline: true },
        { name: "☠️ Смерти", value: fmtInt(deaths), inline: true },
        { name: "🔥 K/D", value: kd, inline: true },
        { name: "🎖 Матчи", value: fmtInt(matches), inline: true },
        { name: "🏆 Победы", value: fmtInt(wins), inline: true },
        { name: "📊 Win Rate", value: `${winRate}%`, inline: true },
        { name: "⏱ Время в бою", value: fmtHours(career?.minutes), inline: true },
        { name: "🎯 Headshots", value: fmtInt(career?.headshots), inline: true },
        { name: "🚙 Техника", value: fmtInt(career?.vehicleKills), inline: true },
        { name: "📏 Дальний килл", value: career?.longestM == null ? "—" : `${Math.round(Number(career.longestM))} м`, inline: true },
        { name: "💥 Лучший стрик", value: fmtInt(career?.killStreak), inline: true },
        { name: "🏅 Место ZARUBA", value: fmtRank(career?.rank?.org ?? career?.rank?.server), inline: true }
      )
      .setFooter({ text: "ZARUBA × WARDOGS • данные Warcon" })
      .setTimestamp();

    if (avatar) embed.setThumbnail(avatar);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Discord /dog:", error);
    await interaction.editReply(`Не удалось получить статистику: **${String(error?.message || error)}**`);
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

    try {
      await registerDogCommand(ready);
    } catch (error) {
      console.error("Discord /dog register:", error.message);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === "dog") {
      await handleDogCommand(interaction);
      return;
    }

    if (interaction.isButton() && ROLE_BUTTONS[interaction.customId]) {
      await handleRoleButton(interaction);
    }
  });

  await client.login(token);
  return client;
}
