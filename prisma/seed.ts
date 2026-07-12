import { PrismaClient } from "@prisma/client";
import { runSeed } from "../lib/seed-data";

const db = new PrismaClient();

runSeed(db)
  .then((log) => {
    for (const line of log) console.log(`✓ ${line}`);
    console.log("Seed complete.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
