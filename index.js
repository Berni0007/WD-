import "dotenv/config";
import { startBot } from "./src/bot.js";
import { startJoinServer } from "./src/web.js";

async function main() {
  await startJoinServer();
  await startBot();
}

main().catch((error) => {
  console.error("ZARUBA JOIN:", error);
  process.exit(1);
});
