function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function joinPage({ serverName, gameId, address, steamUrl }) {
  const ready = Boolean(steamUrl);
  const safeUrl = esc(steamUrl);
  const safeName = esc(serverName || "ZARUBA");
  const safeGameId = esc(gameId);
  const safeAddress = esc(address);

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-store">
  <title>${safeName}</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090b0e;color:#f5f5f5;font-family:Arial,Segoe UI,sans-serif;padding:20px}
    main{width:min(540px,100%);background:#11151a;border:1px solid #282f37;border-radius:16px;padding:34px;text-align:center}
    h1{margin:0 0 10px;font-size:28px}p{margin:0 0 16px;color:#aeb6c0;line-height:1.5}
    .id{font-size:18px;color:#fff;margin-bottom:18px}.id b{color:#e5b95c}
    a{display:inline-block;padding:14px 26px;border-radius:10px;background:#b51e24;color:white;text-decoration:none;font-weight:800;font-size:17px}
    .bad{color:#ffb4b4}.small{font-size:13px;margin-top:18px;margin-bottom:0;color:#747e89}code{color:#d9dee5}
  </style>
</head>
<body>
  <main>
    <h1>${safeName}</h1>
    ${safeGameId ? `<p class="id">Server ID: <b>${safeGameId}</b></p>` : ""}
    ${ready
      ? `<p>Открываем Steam и подключаем к серверу WARDOGS.</p><a id="join" href="${safeUrl}">ПОДКЛЮЧИТЬСЯ</a><p class="small">Если Steam не открылся автоматически — нажми кнопку ещё раз.${safeAddress ? ` Адрес: <code>${safeAddress}</code>` : ""}</p>`
      : `<p class="bad">Автоматическое подключение пока не настроено.</p>${safeGameId ? `<p>Открой WARDOGS → <b>Join by ID</b> → введи <b>${safeGameId}</b>.</p>` : ""}`}
  </main>
  ${ready ? `<script>
    const url=${JSON.stringify(steamUrl)};
    window.location.href=url;
  </script>` : ""}
</body>
</html>`;
}
