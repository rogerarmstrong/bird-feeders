import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getOpenAlerts } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { alertSchema } from "@/lib/validation";

export async function GET() {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const alerts = await getOpenAlerts();

  return NextResponse.json(alerts);
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const body = await request.json();
  const result = alertSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid alert payload", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const alert = await prisma.alert.create({
    data: result.data
  });

  return NextResponse.json(alert, { status: 201 });
}
