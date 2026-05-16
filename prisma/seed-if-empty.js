const { PrismaClient } = require("@prisma/client");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const prisma = new PrismaClient();

async function main() {
  const [userCount, feederCount] = await Promise.all([prisma.user.count(), prisma.feeder.count()]);

  if (userCount > 0 || feederCount > 0) {
    console.log("Database already has data; skipping seed.");
    return;
  }

  console.log("Database is empty; seeding demo data.");
  execFileSync(process.execPath, [path.join(__dirname, "seed.js")], {
    stdio: "inherit"
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
