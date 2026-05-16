import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDashboardMetrics } from "@/lib/monitoring";

export async function GET() {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const dashboard = await getDashboardMetrics();

  return NextResponse.json(dashboard);
}
