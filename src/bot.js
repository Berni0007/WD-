import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { discordToken, getServer, getServers, publicUrl } from "./config.js";
import { clearJoinUrl, getJoinUrl, setJoinUrl } from "./store.js";

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

function panelPayload() {
  const site = publicUrl();
  const servers = getServers();

  const embed = new EmbedBuilder()
    .setTitle(process.env.PANEL_TITLE || "ZARUBA · WARDOGS")
    .setDescription("Выбери сервер и нажми **Играть**. Steam откроет WARDOGS и выполнит подключение.")
    .setColor(0xb51e24);

  const banner = String(process.env.PANEL_BANNER_URL || "").trim();
  if (banner.startsWith("http")) embed.setImage(banner);

  const row = new ActionRowBuilder();
  for (const server of servers.slice(0, 5)) {
    const hasLink = Boolean(getJoinUrl(server.id));
    if (site) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel(server.name)
          .setStyle(ButtonStyle.Link)
          .setURL(`${site}/join/${encodeURIComponent(server.id)}`)
      );
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`join:${server.id}`)
          .setLabel(server.name)
          .setStyle(hasLink ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(!hasLink)
      );
    }
  }

  return { embeds: [embed], components: row.components.length ? [row] : [] };
}

function serverChoices() {
  return getServers().map((server) => ({ name: server.name, value: server.id }));
}

async function registerCommands(client, token) {
  const commands = [
    new SlashCommandBuilder()
      .setName("панель")
      .setDescription("Создать панель подключения ZARUBA")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .toJSON(),
    new SlashCommandBuilder()
      .setName("ссылка")
      .setDescription("Задать ссылку подключения к серверу")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((option) =>
        option.setName("сервер").setDescription("Сервер").setRequired(true).addChoices(...serverChoices())
      )
      .addStringOption((option) =>
        option.setName("значение").setDescription("steam://joinlobby/... или Lobby ID").setRequired(true)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName("сброс-ссылки")
      .setDescription("Удалить сохранённую ссылку и вернуться к ENV")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((option) =>
        option.setName("сервер").setDescription("Сервер").setRequired(true).addChoices(...serverChoices())
      )
      .toJSON(),
  ];

  const rest = new REST({ version: "10" }).setToken(token);
  const guildId = String(process.env.DISCORD_GUILD_ID || "").trim();
  const route = guildId
    ? Routes.applicationGuildCommands(client.user.id, guildId)
    : Routes.applicationCommands(client.user.id);
  await rest.put(route, { body: commands });
}

export async function startDiscordBot() {
  const token = discordToken();
  if (!token) {
    console.log("Discord: токен не найден, web-сервис продолжает работать.");
    return null;
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once("ready", async () => {
    console.log(`Discord: ${client.user.tag}`);
    try {
      await registerCommands(client, token);
      console.log("Discord commands: OK");
    } catch (error) {
      console.error("Не удалось зарегистрировать Discord-команды:", error.message);
    }

    const channelId = String(process.env.DISCORD_CHANNEL_ID || "").trim();
    if (channelId && process.env.AUTO_POST_PANEL === "1") {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel?.isTextBased()) await channel.send(panelPayload());
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton() && interaction.customId.startsWith("join:")) {
      const server = getServer(interaction.customId.slice(5));
      const steamUrl = server ? getJoinUrl(server.id) : "";
      if (!steamUrl) {
        await interaction.reply({ ephemeral: true, content: "Ссылка подключения ещё не задана." });
        return;
      }
      await interaction.reply({ ephemeral: true, content: steamUrl });
      return;
    }

    if (!interaction.isChatInputCommand()) return;
    if (!isAdmin(interaction)) {
      await interaction.reply({ ephemeral: true, content: "Недостаточно прав." });
      return;
    }

    if (interaction.commandName === "панель") {
      await interaction.reply({ ephemeral: true, content: "Панель создана." });
      await interaction.channel.send(panelPayload());
      return;
    }

    if (interaction.commandName === "ссылка") {
      const serverId = interaction.options.getString("сервер");
      const value = interaction.options.getString("значение");
      const server = getServer(serverId);
      if (!server || !setJoinUrl(serverId, value)) {
        await interaction.reply({
          ephemeral: true,
          content: "Неверная ссылка. Используй `steam://joinlobby/...`, `steam://connect/IP:PORT` или только Lobby ID.",
        });
        return;
      }
      await interaction.reply({ ephemeral: true, content: `Ссылка для **${server.name}** сохранена.` });
      return;
    }

    if (interaction.commandName === "сброс-ссылки") {
      const serverId = interaction.options.getString("сервер");
      const server = getServer(serverId);
      if (!server) {
        await interaction.reply({ ephemeral: true, content: "Сервер не найден." });
        return;
      }
      clearJoinUrl(serverId);
      await interaction.reply({ ephemeral: true, content: `Сохранённая ссылка **${server.name}** удалена.` });
    }
  });

  await client.login(token);
  return client;
}
