# ZARUBA WARDOGS JOIN

Минимальный сервис из исходного проекта.

Делает только одно:

**Discord -> кнопка «Играть» -> HTTPS /join -> актуальный Steam Lobby ID -> steam://joinlobby -> WARDOGS.**

Никакого `steam://connect/IP:PORT`, мониторинга, статистики и сервер-браузера.

## Bothost

Нужны переменные:

- `DISCORD_CHANNEL_ID`
- Discord Bot Token в поле Bothost
- `STEAM_API_KEY`
- `WARDOGS_APP_ID=1867240`
- `SERVER_1_NAME`
- `SERVER_1_QUERY`
- `SERVER_1_GAME_ID`

Для автоматического получения Lobby ID, как в исходном проекте, нужен один из источников SteamID игроков:

- `SERVER_1_RCON_HOST`, `SERVER_1_RCON_PORT`, `SERVER_1_RCON_PASSWORD`
- или `SERVER_1_SEEDS` со SteamID игроков.

При запуске бот сам публикует/обновляет в `DISCORD_CHANNEL_ID` сообщение с кнопкой **Играть**.
