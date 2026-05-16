import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { feederHistorySnapshot, recordFeederHistory } from "@/lib/feeder-history";
import { feederMutationSchema } from "@/lib/feeder-validation";
import { getFeederDetail } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const feeder = await getFeederDetail(params.id);

  if (!feeder) {
    return NextResponse.json({ error: "Feeder not found" }, { status: 404 });
  }

  return NextResponse.json(feeder);
}

export async function PUT(request: Request, { params }: RouteContext) {
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

  const [existingFeeder, assignedUser] = await Promise.all([
    prisma.feeder.findUnique({
      where: {
        id: params.id
      },
      include: {
        measurements: {
          orderBy: {
            measuredAt: "desc"
          },
          take: 1
        }
      }
    }),
    prisma.user.findUnique({
      where: {
        id: result.data.assignedUserId
      }
    })
  ]);

  if (!existingFeeder) {
    return NextResponse.json({ error: "Feeder not found" }, { status: 404 });
  }

  if (!assignedUser) {
    return NextResponse.json({ error: "Assigned user not found" }, { status: 404 });
  }

  const feeder = await prisma.$transaction(async (transaction) => {
    await transaction.feeder.update({
      where: {
        id: params.id
      },
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
        lastCleanedAt:
          result.data.cleanStatus === "CLEAN" && existingFeeder.cleanStatus !== "CLEAN"
            ? new Date()
            : existingFeeder.lastCleanedAt
      }
    });

    if (typeof result.data.fillPercent === "number") {
      await transaction.feedMeasurement.create({
        data: {
          feederId: params.id,
          fillPercent: result.data.fillPercent,
          weightGrams: result.data.weightGrams ?? 0,
          measuredAt: new Date()
        }
      });
    }

    const updatedFeeder = await transaction.feeder.findUniqueOrThrow({
      where: {
        id: params.id
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
      action: "UPDATE",
      feederId: updatedFeeder.id,
      feederName: updatedFeeder.name,
      summary: `Updated feeder ${updatedFeeder.name}`,
      changedByUserId: session?.user.id,
      before: feederHistorySnapshot(existingFeeder),
      after: feederHistorySnapshot(updatedFeeder)
    });

    return updatedFeeder;
  });

  return NextResponse.json(feeder);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { session, response } = await requireApiSession();

  if (response) {
    return response;
  }

  const feeder = await prisma.feeder.findUnique({
    where: {
      id: params.id
    },
    include: {
      measurements: {
        orderBy: {
          measuredAt: "desc"
        },
        take: 1
      }
    }
  });

  if (!feeder) {
    return NextResponse.json({ error: "Feeder not found" }, { status: 404 });
  }

  await prisma.$transaction(async (transaction) => {
    await recordFeederHistory(transaction, {
      action: "DELETE",
      feederId: feeder.id,
      feederName: feeder.name,
      summary: `Deleted feeder ${feeder.name}`,
      changedByUserId: session?.user.id,
      before: feederHistorySnapshot(feeder)
    });

    await transaction.feeder.delete({
      where: {
        id: params.id
      }
    });
  });

  return NextResponse.json({ ok: true });
}
