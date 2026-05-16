import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { telemetrySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const body = await request.json();
  const result = telemetrySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid telemetry payload", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const {
    serialNumber,
    fillPercent,
    weightGrams,
    status,
    measuredAt
  } = result.data;

  const device = await prisma.device.findUnique({
    where: { serialNumber },
    include: { feeder: true }
  });

  if (!device) {
    return NextResponse.json({ error: "Device not found" }, { status: 404 });
  }

  const [updatedDevice, measurement] = await prisma.$transaction([
    prisma.device.update({
      where: { serialNumber },
      data: {
        status,
        lastSeenAt: new Date()
      }
    }),
    prisma.feedMeasurement.create({
      data: {
        feederId: device.feederId,
        fillPercent,
        weightGrams,
        measuredAt: measuredAt ?? new Date()
      }
    })
  ]);

  return NextResponse.json(
    {
      device: updatedDevice,
      measurement
    },
    { status: 201 }
  );
}
