import express from "express";
import { publicUrl } from "./config.js";
import { joinPage } from "./page.js";
import { liveJoin } from "./tracker.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.get("/", (_req, res) => res.redirect(302, "/join"));
  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.get("/api/wardogs/join-link", async (_req, res) => {
    try {
      const result = await liveJoin();
      res.json({
        ok: Boolean(result.ok && result.steamUrl),
        reason: result.reason || "nolobby",
        steamUrl: result.steamUrl || "",
      });
    } catch (error) {
      console.error("Join link:", error.message);
      res.status(503).json({ ok: false, reason: "error", steamUrl: "" });
    }
  });

  app.get(["/join", "/join/1"], async (_req, res) => {
    let result;
    try {
      result = await liveJoin();
    } catch (error) {
      console.error("Join page:", error.message);
      result = { ok: false, reason: "error" };
    }
    res.status(200).set("Cache-Control", "no-store").type("html").send(joinPage(result));
  });

  return app;
}

export function startWeb() {
  const port = Number(process.env.PORT || 3000);
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Web: 0.0.0.0:${port}`);
      console.log(`Join URL: ${publicUrl() ? `${publicUrl()}/join` : "DOMAIN не задан"}`);
      resolve(server);
    });
    server.on("error", reject);
  });
}
