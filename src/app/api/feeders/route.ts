import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { feederHistorySnapshot, recordFeederHistory } from "@/lib/feeder-history";
import { feederMutationSchema } from "@/lib/feeder-validation";
import { getFeeders } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const feeders = await getFeeders();

  return NextResponse.json(feeders);
}

export async function POST(request: Request) {
  const { session, response } = await requireApiSession();

  if (response) {
    return response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const result = feederMutationSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid feeder payload", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const assignedUser = await prisma.user.findUnique({
    where: {
      id: result.data.assignedUserId
    }
  });

  if (!assignedUser) {
    return NextResponse.json({ error: "Assigned user not found" }, { status: 404 });
  }

  const feeder = await prisma.$transaction(async (transaction) => {
    const createdFeeder = await transaction.feeder.create({
      data: {
        name: result.data.name,
        location: result.data.location,
        latitude: result.data.latitude,
        longitude: result.data.longitude,
        capacityGrams: result.data.capacityGrams,
        notes: result.data.notes,
        cleanStatus: result.data.cleanStatus,
        fillStatus: result.data.fillStatus,
        assignedUserId: result.data.assignedUserId,
        lastCleanedAt: result.data.cleanStatus === "CLEAN" ? new Date() : new Date(0),
        measurements:
          typeof result.data.fillPercent === "number"
            ? {
                create: {
                  fillPercent: result.data.fillPercent,
                  weightGrams: result.data.weightGrams ?? 0,
                  measuredAt: new Date()
                }
              }
            : undefined
      },
      include: {
        assignedUser: true,
        measurements: {
          orderBy: {
            measuredAt: "desc"
          },
          take: 1
        }
      }
    });

    await recordFeederHistory(transaction, {
      action: "CREATE",
      feederId: createdFeeder.id,
      feederName: createdFeeder.name,
      summary: `Created feeder ${createdFeeder.name}`,
      changedByUserId: session?.user.id,
      after: feederHistorySnapshot(createdFeeder)
    });

    return createdFeeder;
  });

  return NextResponse.json(feeder, { status: 201 });
}
