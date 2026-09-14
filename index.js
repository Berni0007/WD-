import "dotenv/config";
import { startWeb } from "./src/web.js";
import { startDiscordBot } from "./src/bot.js";

async function main() {
  await startWeb();
  await startDiscordBot();
}

main().catch((error) => {
  console.error("ZARUBA JOIN не запустился:", error);
  process.exit(1);
});
