const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function createFeeder({
  name,
  location,
  capacityGrams,
  notes,
  latitude,
  longitude,
  lastCleanedAt,
  cleanStatus,
  fillStatus,
  assignedUserId,
  device,
  visits,
  measurements,
  alerts
}) {
  return prisma.feeder.create({
    data: {
      name,
      location,
      capacityGrams,
      notes,
      latitude,
      longitude,
      lastCleanedAt,
      cleanStatus,
      fillStatus,
      assignedUserId,
      device: {
        create: device
      },
      visits: {
        create: visits
      },
      measurements: {
        create: measurements
      },
      alerts: {
        create: alerts
      }
    }
  });
}

async function main() {
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.feederHistory.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.feedMeasurement.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.device.deleteMany();
  await prisma.feeder.deleteMany();
  await prisma.user.deleteMany();

  const demoUser = await prisma.user.create({
    data: {
      name: "Demo Birder",
      email: "demo@birdfeeders.local",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash("birdwatcher123", 12)
    }
  });

  const fieldUser = await prisma.user.create({
    data: {
      name: "Field Keeper",
      email: "field@birdfeeders.local",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash("birdwatcher123", 12)
    }
  });

  const feeders = [
    {
      name: "Univalle Library Feeder",
      location: "Universidad del Valle, Biblioteca Mario Carvajal",
      capacityGrams: 1800,
      latitude: 3.3756,
      longitude: -76.5332,
      lastCleanedAt: daysAgo(2),
      cleanStatus: "NEEDS_CLEANING",
      fillStatus: "FILLED",
      assignedUserId: demoUser.id,
      notes: "High foot traffic near the library; refill early in the morning.",
      device: { serialNumber: "BF-CLO-001", status: "ONLINE", lastSeenAt: hoursAgo(0.2) },
      species: "Blue-gray tanager",
      fillPercent: 72,
      alerts: [
        {
          type: "MAINTENANCE",
          severity: "INFO",
          message: "Clean seed tray during next refill.",
          resolved: false,
          createdAt: hoursAgo(18)
        }
      ]
    },
    {
      name: "Univalle Engineering Feeder",
      location: "Universidad del Valle, engineering gardens",
      capacityGrams: 1600,
      latitude: 3.3729,
      longitude: -76.5321,
      lastCleanedAt: hoursAgo(10),
      cleanStatus: "CLEAN",
      fillStatus: "FILLED",
      assignedUserId: demoUser.id,
      notes: "Check ants around the mounting bracket after rain.",
      device: { serialNumber: "BF-CLO-002", status: "ONLINE", lastSeenAt: hoursAgo(0.8) },
      species: "Saffron finch",
      fillPercent: 88,
      alerts: []
    },
    {
      name: "Univalle Sports Field Feeder",
      location: "Universidad del Valle, sports fields",
      capacityGrams: 1400,
      latitude: 3.3782,
      longitude: -76.5358,
      lastCleanedAt: daysAgo(3),
      cleanStatus: "NEEDS_CLEANING",
      fillStatus: "LOW",
      assignedUserId: fieldUser.id,
      notes: "Use the service gate closest to the sports fields.",
      device: { serialNumber: "BF-CLO-003", status: "DEGRADED", lastSeenAt: hoursAgo(2.4) },
      species: "Ruddy ground dove",
      fillPercent: 22,
      alerts: [
        {
          type: "LOW_FEED",
          severity: "WARNING",
          message: "Seed level is below 25%. Refill soon.",
          resolved: false,
          createdAt: hoursAgo(2)
        }
      ]
    },
    {
      name: "Javeriana Garden Feeder",
      location: "Pontificia Universidad Javeriana Cali, central garden",
      capacityGrams: 950,
      latitude: 3.3476,
      longitude: -76.5317,
      lastCleanedAt: daysAgo(4),
      cleanStatus: "NEEDS_CLEANING",
      fillStatus: "LOW",
      assignedUserId: fieldUser.id,
      notes: "Garden staff requested cleanup before afternoon classes.",
      device: { serialNumber: "BF-CLO-004", status: "DEGRADED", lastSeenAt: hoursAgo(1.6) },
      species: "House wren",
      fillPercent: 24,
      alerts: [
        {
          type: "LOW_FEED",
          severity: "WARNING",
          message: "Seed level is below 25%. Refill soon.",
          resolved: false,
          createdAt: hoursAgo(1.5)
        }
      ]
    },
    {
      name: "Javeriana Lake Feeder",
      location: "Pontificia Universidad Javeriana Cali, lake path",
      capacityGrams: 1200,
      latitude: 3.3502,
      longitude: -76.5343,
      lastCleanedAt: hoursAgo(20),
      cleanStatus: "CLEAN",
      fillStatus: "FILLED",
      assignedUserId: demoUser.id,
      notes: "Avoid spilling seed near the lake path.",
      device: { serialNumber: "BF-CLO-005", status: "ONLINE", lastSeenAt: hoursAgo(0.4) },
      species: "Great kiskadee",
      fillPercent: 67,
      alerts: []
    },
    {
      name: "Javeriana Library Feeder",
      location: "Pontificia Universidad Javeriana Cali, library terrace",
      capacityGrams: 1100,
      latitude: 3.3464,
      longitude: -76.5298,
      lastCleanedAt: daysAgo(1.5),
      cleanStatus: "NEEDS_CLEANING",
      fillStatus: "FILLED",
      assignedUserId: fieldUser.id,
      notes: "Terrace access is easiest through the north stairwell.",
      device: { serialNumber: "BF-CLO-006", status: "ONLINE", lastSeenAt: hoursAgo(3.2) },
      species: "Palm tanager",
      fillPercent: 61,
      alerts: []
    },
    {
      name: "Icesi Courtyard Feeder",
      location: "Universidad Icesi, central courtyard",
      capacityGrams: 2200,
      latitude: 3.3419,
      longitude: -76.5295,
      lastCleanedAt: daysAgo(18),
      cleanStatus: "NEEDS_CLEANING",
      fillStatus: "FILLED",
      assignedUserId: fieldUser.id,
      notes: "Device is offline; inspect enclosure during next visit.",
      device: { serialNumber: "BF-CLO-007", status: "OFFLINE", lastSeenAt: hoursAgo(9.2) },
      species: "Chalk-browed mockingbird",
      fillPercent: 58,
      alerts: [
        {
          type: "CONNECTIVITY",
          severity: "CRITICAL",
          message: "Device has not checked in for more than 8 hours.",
          resolved: false,
          createdAt: hoursAgo(8)
        }
      ]
    },
    {
      name: "Icesi Wetlands Feeder",
      location: "Universidad Icesi, ecological trail",
      capacityGrams: 1500,
      latitude: 3.3398,
      longitude: -76.5314,
      lastCleanedAt: hoursAgo(8),
      cleanStatus: "CLEAN",
      fillStatus: "FILLED",
      assignedUserId: demoUser.id,
      notes: "Wetlands trail can be muddy after rain.",
      device: { serialNumber: "BF-CLO-008", status: "ONLINE", lastSeenAt: hoursAgo(0.9) },
      species: "Bananaquit",
      fillPercent: 79,
      alerts: []
    },
    {
      name: "San Buenaventura Plaza Feeder",
      location: "Universidad de San Buenaventura Cali, plaza",
      capacityGrams: 1300,
      latitude: 3.3665,
      longitude: -76.5269,
      lastCleanedAt: daysAgo(2.5),
      cleanStatus: "NEEDS_CLEANING",
      fillStatus: "EMPTY",
      assignedUserId: fieldUser.id,
      notes: "Bring a full seed bag; current feeder is nearly empty.",
      device: { serialNumber: "BF-CLO-009", status: "DEGRADED", lastSeenAt: hoursAgo(5.5) },
      species: "Tropical kingbird",
      fillPercent: 7,
      alerts: [
        {
          type: "LOW_FEED",
          severity: "CRITICAL",
          message: "Feeder is nearly empty.",
          resolved: false,
          createdAt: hoursAgo(5)
        }
      ]
    },
    {
      name: "Autonoma Shade Feeder",
      location: "Universidad Autonoma de Occidente, shaded walkway",
      capacityGrams: 1700,
      latitude: 3.3534,
      longitude: -76.5228,
      lastCleanedAt: hoursAgo(6),
      cleanStatus: "CLEAN",
      fillStatus: "FILLED",
      assignedUserId: demoUser.id,
      notes: "Shaded walkway feeder attracts tanagers around noon.",
      device: { serialNumber: "BF-CLO-010", status: "ONLINE", lastSeenAt: hoursAgo(0.6) },
      species: "Crimson-backed tanager",
      fillPercent: 83,
      alerts: []
    }
  ];

  for (const feeder of feeders) {
    await createFeeder({
      name: feeder.name,
      location: feeder.location,
      capacityGrams: feeder.capacityGrams,
      notes: feeder.notes,
      latitude: feeder.latitude,
      longitude: feeder.longitude,
      lastCleanedAt: feeder.lastCleanedAt,
      cleanStatus: feeder.cleanStatus,
      fillStatus: feeder.fillStatus,
      assignedUserId: feeder.assignedUserId,
      device: feeder.device,
      visits: [
        {
          species: feeder.species,
          count: 2,
          confidence: 0.92,
          durationSeconds: 48,
          observedAt: hoursAgo(1.5)
        },
        {
          species: "Ruddy ground dove",
          count: 1,
          confidence: 0.86,
          durationSeconds: 31,
          observedAt: hoursAgo(6.2)
        }
      ],
      measurements: [
        {
          fillPercent: feeder.fillPercent,
          weightGrams: Math.round((feeder.capacityGrams * feeder.fillPercent) / 100),
          measuredAt: hoursAgo(0.8)
        },
        {
          fillPercent: Math.min(100, feeder.fillPercent + 9),
          weightGrams: Math.round((feeder.capacityGrams * Math.min(100, feeder.fillPercent + 9)) / 100),
          measuredAt: hoursAgo(12)
        },
        {
          fillPercent: Math.min(100, feeder.fillPercent + 18),
          weightGrams: Math.round((feeder.capacityGrams * Math.min(100, feeder.fillPercent + 18)) / 100),
          measuredAt: daysAgo(1)
        }
      ],
      alerts: feeder.alerts
    });
  }
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
