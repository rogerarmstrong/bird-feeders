import type { Feeder, FeedMeasurement, Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FeederWithMeasurement = Feeder & {
  measurements?: FeedMeasurement[];
  assignedUser?: Pick<User, "email"> | null;
};

type HistoryClient = typeof prisma | Prisma.TransactionClient;

export function feederHistorySnapshot(feeder: FeederWithMeasurement | null) {
  if (!feeder) {
    return null;
  }

  const latestMeasurement = feeder.measurements?.[0];
  const assignedUserEmail = feeder.assignedUser?.email ?? null;

  return {
    id: feeder.id,
    name: feeder.name,
    location: feeder.location,
    latitude: feeder.latitude,
    longitude: feeder.longitude,
    capacityGrams: feeder.capacityGrams,
    notes: feeder.notes,
    cleanStatus: feeder.cleanStatus,
    fillStatus: feeder.fillStatus,
    assignedUserId: feeder.assignedUserId,
    assignedUserEmail,
    lastCleanedAt: feeder.lastCleanedAt,
    latestFillPercent: latestMeasurement?.fillPercent,
    latestWeightGrams: latestMeasurement?.weightGrams
  };
}

export async function recordFeederHistory(
  client: HistoryClient,
  {
    action,
    feederId,
    feederName,
    summary,
    changedByUserId,
    before,
    after
  }: {
    action: "CREATE" | "UPDATE" | "DELETE";
    feederId?: string;
    feederName: string;
    summary: string;
    changedByUserId?: string;
    before?: unknown;
    after?: unknown;
  }
) {
  const changedByUser = changedByUserId
    ? await client.user.findUnique({
        where: {
          id: changedByUserId
        },
        select: {
          id: true
        }
      })
    : null;

  await client.feederHistory.create({
    data: {
      action,
      feederId,
      feederName,
      summary,
      changedByUserId: changedByUser?.id,
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: after ? JSON.stringify(after) : null
    }
  });
}
