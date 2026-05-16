import { prisma } from "@/lib/prisma";

const latestMeasurementInclude = {
  orderBy: { measuredAt: "desc" as const },
  take: 1
};

export async function getDashboardMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [feeders, todayVisits, openAlerts, recentVisits] = await Promise.all([
    prisma.feeder.findMany({
      include: {
        assignedUser: true,
        device: true,
        measurements: latestMeasurementInclude,
        alerts: {
          where: { resolved: false }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.visit.count({
      where: {
        observedAt: {
          gte: today
        }
      }
    }),
    prisma.alert.count({
      where: {
        resolved: false
      }
    }),
    prisma.visit.findMany({
      take: 8,
      orderBy: {
        observedAt: "desc"
      },
      include: {
        feeder: true
      }
    })
  ]);

  const activeFeeders = feeders.filter(
    (feeder) => feeder.device?.status !== "OFFLINE"
  ).length;

  const fillLevels = feeders
    .map((feeder) => feeder.measurements[0]?.fillPercent)
    .filter((fillPercent): fillPercent is number => typeof fillPercent === "number");

  const averageFill =
    fillLevels.length > 0
      ? Math.round(fillLevels.reduce((sum, value) => sum + value, 0) / fillLevels.length)
      : 0;

  return {
    feeders,
    summary: {
      totalFeeders: feeders.length,
      activeFeeders,
      todayVisits,
      averageFill,
      openAlerts
    },
    recentVisits
  };
}

export async function getFeeders() {
  return prisma.feeder.findMany({
    include: {
      assignedUser: true,
      device: true,
      measurements: latestMeasurementInclude,
      alerts: {
        where: {
          resolved: false
        }
      },
      visits: {
        take: 1,
        orderBy: {
          observedAt: "desc"
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
}

export async function getFeederDetail(id: string) {
  return prisma.feeder.findUnique({
    where: { id },
    include: {
      device: true,
      assignedUser: true,
      measurements: {
        take: 12,
        orderBy: {
          measuredAt: "desc"
        }
      },
      visits: {
        take: 12,
        orderBy: {
          observedAt: "desc"
        }
      },
      alerts: {
        take: 10,
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}

export async function getOpenAlerts() {
  return prisma.alert.findMany({
    where: {
      resolved: false
    },
    include: {
      feeder: true
    },
    orderBy: [
      {
        severity: "asc"
      },
      {
        createdAt: "desc"
      }
    ]
  });
}

export async function getAssignableUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: {
      email: "asc"
    }
  });
}

export async function getManagedUsers() {
  return prisma.user.findMany({
    include: {
      assignedFeeders: {
        select: {
          id: true,
          name: true,
          location: true
        },
        orderBy: {
          name: "asc"
        }
      }
    },
    orderBy: {
      email: "asc"
    }
  });
}
