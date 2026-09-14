# ZARUBA WARDOGS JOIN

Из исходного проекта оставлена только цепочка подключения игрока:

**Discord -> /join -> RCON /v1/players -> Steam GetPlayerSummaries -> lobbysteamid -> steam://joinlobby -> WARDOGS**

Никакого подключения через `steam://connect/IP:PORT` нет.

## Bothost

Нужны переменные:

- `PUBLIC_URL`
- `DISCORD_BOT_TOKEN` или `DISCORD_TOKEN`
- `DISCORD_CHANNEL_ID`
- `GAME_APP_ID=1867240`
- `STEAM_API_KEY`
- `SERVER_1_NAME`
- `SERVER_1_GAME_ID`
- `SERVER_1_QUERY`
- `SERVER_1_RCON_HOST`
- `SERVER_1_RCON_PORT`
- `SERVER_1_RCON_PASSWORD`

Запуск: `npm start`.
