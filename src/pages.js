function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statusText(result) {
  const reason = result?.reason;

  if (reason === "server-id") {
    return "Прямое Steam-подключение недоступно. Join ID сервера найден.";
  }
  if (reason === "empty") return "На сервере пока нет игроков.";
  if (reason === "rcon-error") return "RCON нового сервера не отвечает.";
  if (reason === "rcon-not-configured") return "RCON не настроен.";
  if (reason === "steam-key-missing") return "Не задан STEAM_API_KEY.";
  if (reason === "nolobby") {
    return "Steam не отдаёт Lobby ID или адрес сервера.";
  }
  return "Ищем активную Steam-сессию…";
}

export function joinPage(result) {
  const name = result?.server?.name || "ZARUBA";
  const steamUrl = result?.steamUrl || "";
  const serverId = result?.serverId || "";
  const appId = result?.appId || "1867240";
  const ready = Boolean(result?.ok && steamUrl);
  const hasServerId = Boolean(serverId);

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-store">
  <title>${escapeHtml(name)}</title>
  <style>
    [hidden] { display: none !important; }
    body {
      margin: 0;
      background: #0b0d11;
      color: #fff;
      font-family: Arial, sans-serif;
      min-height: 100vh;
      display: grid;
      place-items: center;
    }
    main { text-align: center; padding: 24px; max-width: 760px; }
    .btn {
      display: inline-block;
      margin: 6px;
      padding: 14px 24px;
      background: #198754;
      color: #fff;
      text-decoration: none;
      border: 0;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      font-size: 16px;
    }
    .code {
      margin: 18px auto;
      padding: 12px 16px;
      max-width: 620px;
      background: #171a20;
      border: 1px solid #30343d;
      border-radius: 8px;
      overflow-wrap: anywhere;
      font-family: Consolas, monospace;
      user-select: all;
    }
    .hint { color: #b9c0ca; line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(name)}</h1>
    <p id="status">${ready ? "Подключаем к серверу…" : escapeHtml(statusText(result))}</p>

    <a id="play" class="btn" href="${escapeHtml(steamUrl)}" ${ready ? "" : "hidden"}>ИГРАТЬ</a>

    <section id="idBox" ${hasServerId && !ready ? "" : "hidden"}>
      <div class="code" id="serverId">${escapeHtml(serverId)}</div>
      <button class="btn" id="copyLaunch" type="button">СКОПИРОВАТЬ ID И ЗАПУСТИТЬ WARDOGS</button>
      <p class="hint">
        В игре: <b>DEPLOY → JOIN BY ID → Ctrl+V → LOOKUP</b>
      </p>
    </section>
  </main>

  <script>
    const play = document.getElementById("play");
    const status = document.getElementById("status");
    const idBox = document.getElementById("idBox");
    const serverIdEl = document.getElementById("serverId");
    const copyLaunch = document.getElementById("copyLaunch");
    let launched = false;
    let currentServerId = ${JSON.stringify(serverId)};
    const appId = ${JSON.stringify(appId)};

    function textFor(reason) {
      if (reason === "server-id") return "Прямое Steam-подключение недоступно. Join ID сервера найден.";
      if (reason === "empty") return "На сервере пока нет игроков.";
      if (reason === "rcon-error") return "RCON нового сервера не отвечает.";
      if (reason === "rcon-not-configured") return "RCON не настроен.";
      if (reason === "steam-key-missing") return "Не задан STEAM_API_KEY.";
      if (reason === "nolobby") return "Steam не отдаёт Lobby ID или адрес сервера.";
      return "Ищем активную Steam-сессию…";
    }

    function showServerId(id) {
      if (!id) return;
      currentServerId = id;
      serverIdEl.textContent = id;
      idBox.hidden = false;
    }

    function launch(url) {
      if (!url) return;
      play.href = url;
      play.hidden = false;
      idBox.hidden = true;
      status.textContent = "Подключаем к серверу…";

      if (launched) return;
      launched = true;
      location.href = url;
    }

    copyLaunch?.addEventListener("click", async () => {
      if (!currentServerId) return;

      try {
        await navigator.clipboard.writeText(currentServerId);
        status.textContent = "Join ID скопирован. Запускаем WARDOGS…";
      } catch {
        status.textContent = "Скопируй Join ID вручную. Запускаем WARDOGS…";
      }

      location.href = `steam://run/${appId}`;
    });

    async function poll() {
      if (launched) return;

      try {
        const response = await fetch("/api/wardogs/join-link", { cache: "no-store" });
        const data = await response.json();

        if (data.steamUrl) {
          launch(data.steamUrl);
          return;
        }

        if (data.serverId) {
          showServerId(data.serverId);
        }

        status.textContent = textFor(data.reason);
      } catch {
        status.textContent = "Повторяем проверку подключения…";
      }

      setTimeout(poll, 1500);
    }

    ${ready ? `launch(${JSON.stringify(steamUrl)});` : "poll();"}
  </script>
</body>
</html>`;
}
