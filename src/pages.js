function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function joinPage(result) {
  const name = result?.server?.name || "ZARUBA";
  const steamUrl = result?.steamUrl || "";
  const ready = Boolean(result?.ok && steamUrl);

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-store">
  <title>${escapeHtml(name)}</title>
</head>
<body style="margin:0;background:#0b0d11;color:#fff;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center">
  <main style="text-align:center;padding:24px">
    <h1>${escapeHtml(name)}</h1>
    <p id="status">${ready ? "Подключаем к серверу…" : "Ищем активное Steam-лобби…"}</p>
    <a id="play" href="${escapeHtml(steamUrl)}" ${ready ? "" : "hidden"} style="display:inline-block;padding:14px 24px;background:#198754;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Играть</a>
  </main>
  <script>
    const play = document.getElementById("play");
    const status = document.getElementById("status");
    let launched = false;

    function launch(url) {
      if (!url || launched) return;
      launched = true;
      play.href = url;
      play.hidden = false;
      status.textContent = "Подключаем к серверу…";
      const frame = document.createElement("iframe");
      frame.style.display = "none";
      frame.src = url;
      document.body.appendChild(frame);
      location.href = url;
    }

    async function poll() {
      if (launched) return;
      try {
        const response = await fetch("/api/wardogs/join-link", { cache: "no-store" });
        const data = await response.json();
        if (data.steamUrl) {
          launch(data.steamUrl);
          return;
        }
        status.textContent = data.reason === "empty"
          ? "На сервере пока нет игрока, через которого можно получить Steam Lobby ID."
          : "Ищем активное Steam-лобби…";
      } catch {
        status.textContent = "Повторяем поиск подключения…";
      }
      setTimeout(poll, 1000);
    }

    ${ready ? `launch(${JSON.stringify(steamUrl)});` : "poll();"}
  </script>
</body>
</html>`;
}
