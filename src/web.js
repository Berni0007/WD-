import express from "express";
import { getServer, getServers, publicUrl, steamApiKey } from "./config.js";
import { joinPage } from "./page.js";
import { resolveJoin } from "./steam.js";

async function renderJoin(res, server) {
  if (!server) {
    res.status(404).type("text/plain").send("Сервер не найден");
    return;
  }

  let resolved = { steamUrl: "", source: "not-found", listing: null };
  try {
    resolved = await resolveJoin(server);
  } catch (error) {
    console.error(`Steam lookup ${server.name}:`, error.message);
    resolved = { steamUrl: "", source: "error", listing: null };
  }

  const address = resolved.listing?.addr || server.address || "";

  res
    .status(200)
    .set("Cache-Control", "no-store")
    .type("html")
    .send(
      joinPage({
        serverName: server.name,
        gameId: server.gameId,
        address,
        steamUrl: resolved.steamUrl,
        steamConfigured: Boolean(steamApiKey()),
        lookupSource: resolved.source,
      })
    );
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.get("/", async (_req, res) => {
    await renderJoin(res, getServers()[0] || null);
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, steamApi: Boolean(steamApiKey()) });
  });

  app.get(["/join/:server", "/join"], async (req, res) => {
    const requested = req.params.server || req.query.server || "1";
    await renderJoin(res, getServer(requested));
  });

  return app;
}

export function startWeb() {
  const port = Number(process.env.PORT || 3000);
  const app = createApp();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Web: 0.0.0.0:${port}`);
      console.log(`Public URL: ${publicUrl() || "не задан"}`);
      console.log(`Steam API: ${steamApiKey() ? "configured" : "MISSING"}`);
      resolve(server);
    });
    server.on("error", reject);
  });
}
