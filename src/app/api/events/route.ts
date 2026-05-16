import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { visitSchema } from "@/lib/validation";

export async function GET() {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const visits = await prisma.visit.findMany({
    take: 25,
    orderBy: {
      observedAt: "desc"
    },
    include: {
      feeder: true
    }
  });

  return NextResponse.json(visits);
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const body = await request.json();
  const result = visitSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid visit payload", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const visit = await prisma.visit.create({
    data: {
      ...result.data,
      observedAt: result.data.observedAt ?? new Date()
    }
  });

  return NextResponse.json(visit, { status: 201 });
}
