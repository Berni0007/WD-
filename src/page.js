function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function joinPage(result) {
  const ready = Boolean(result?.ok && result?.steamUrl);
  const name = result?.server?.name || "ZARUBA";
  const steamUrl = result?.steamUrl || "";

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-store">
  ${ready ? `<meta http-equiv="refresh" content="0;url=${esc(steamUrl)}">` : ""}
  <title>${esc(name)}</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d11;color:#fff;font-family:Segoe UI,Arial,sans-serif;padding:20px}
    main{text-align:center;max-width:520px}h1{margin:0 0 14px}p{color:#aeb6c0;line-height:1.5}a{display:inline-block;margin-top:10px;padding:13px 24px;border-radius:9px;background:#16a34a;color:#fff;text-decoration:none;font-weight:700}a[hidden]{display:none}
  </style>
</head>
<body>
<main>
  <h1>${esc(name)}</h1>
  <p id="status">${ready ? "Открываем WARDOGS…" : "Получаем ссылку подключения…"}</p>
  <a id="play" href="${esc(steamUrl)}" ${ready ? "" : "hidden"}>Играть</a>
</main>
<script>
  const play=document.getElementById("play");
  const statusEl=document.getElementById("status");
  let launched=false;
  function launch(url){
    if(!url)return;
    play.href=url; play.hidden=false; statusEl.textContent="Открываем WARDOGS…";
    if(launched)return; launched=true;
    const frame=document.createElement("iframe"); frame.style.display="none"; frame.src=url; document.body.appendChild(frame);
    location.href=url;
  }
  async function poll(){
    if(launched)return;
    try{
      const res=await fetch("/api/wardogs/join-link",{cache:"no-store"});
      const data=await res.json();
      if(data.steamUrl){launch(data.steamUrl);return;}
      statusEl.textContent="Ждём Steam-лобби сервера…";
    }catch{statusEl.textContent="Нет связи. Повторяем…";}
    setTimeout(poll,2000);
  }
  ${ready ? `launch(${JSON.stringify(steamUrl)});` : "poll();"}
</script>
</body>
</html>`;
}
