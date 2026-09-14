import express from "express";
import { getServer, publicUrl, steamJoinUrl } from "./config.js";
import { joinPage } from "./page.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.get("/", (_req, res) => {
    res.status(200).type("text/plain").send("ZARUBA JOIN: OK");
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get(["/join/:server", "/join"], (req, res) => {
    const server = getServer(req.params.server || req.query.server);
    if (!server) {
      res.status(404).type("text/plain").send("Сервер не найден");
      return;
    }

    const steamUrl = steamJoinUrl(server);
    res
      .status(200)
      .set("Cache-Control", "no-store")
      .type("html")
      .send(
        joinPage({
          serverName: server.name,
          gameId: server.gameId,
          address: server.address,
          steamUrl,
        })
      );
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
      resolve(server);
    });
    server.on("error", reject);
  });
}
