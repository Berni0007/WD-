function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function joinPage({ serverName, steamUrl }) {
  const ready = Boolean(steamUrl);
  const safeUrl = esc(steamUrl);
  const safeName = esc(serverName || "ZARUBA");

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-store">
  <title>${safeName}</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090b0e;color:#f5f5f5;font-family:Arial,Segoe UI,sans-serif;padding:20px}
    main{width:min(520px,100%);background:#11151a;border:1px solid #282f37;border-radius:16px;padding:34px;text-align:center}
    h1{margin:0 0 12px;font-size:28px}p{margin:0 0 22px;color:#aeb6c0;line-height:1.5}
    a{display:inline-block;padding:14px 26px;border-radius:10px;background:#b51e24;color:white;text-decoration:none;font-weight:800;font-size:17px}
    .bad{color:#ffb4b4}.small{font-size:13px;margin-top:18px;margin-bottom:0;color:#747e89}
  </style>
</head>
<body>
  <main>
    <h1>${safeName}</h1>
    ${ready
      ? `<p>Открываем Steam и подключаем к серверу WARDOGS.</p><a id="join" href="${safeUrl}">Открыть Steam</a><p class="small">Если Steam не открылся автоматически — нажми кнопку.</p>`
      : `<p class="bad">Ссылка подключения к этому серверу пока не задана.</p>`}
  </main>
  ${ready ? `<script>
    const url=${JSON.stringify(steamUrl)};
    // Переход выполняется только после реального клика игрока по ссылке Discord.
    setTimeout(()=>{ window.location.href=url; }, 120);
  </script>` : ""}
</body>
</html>`;
}
