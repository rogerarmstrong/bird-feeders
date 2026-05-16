const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { dirname, join } = require("node:path");

const target = join(process.cwd(), "src/generated/build-info.ts");

function readCurrentBuildNumber() {
  try {
    const currentBuildInfo = readFileSync(target, "utf8");
    const match = currentBuildInfo.match(/"buildNumber":\s*(\d+|"(\d+)")/);

    if (!match) {
      return 0;
    }

    return Number(match[2] ?? match[1]);
  } catch {
    return 0;
  }
}

const buildNumber = readCurrentBuildNumber() + 1;
const builtAt = new Date().toISOString();

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `export const buildInfo = ${JSON.stringify({ buildNumber, builtAt }, null, 2)} as const;\n`
);

console.log(`Build ${buildNumber} generated at ${builtAt}`);
