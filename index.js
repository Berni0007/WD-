import "dotenv/config";
import { startBot } from "./src/bot.js";
import { startWeb } from "./src/web.js";

async function main() {
  await startWeb();
  await startBot();
}

main().catch((error) => {
  console.error("ZARUBA JOIN:", error);
  process.exit(1);
});
