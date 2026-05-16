import { NextResponse } from "next/server";
import { getRequiredApiSession } from "@/lib/session";

export async function requireApiSession() {
  const session = await getRequiredApiSession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 })
    };
  }

  return {
    session,
    response: null
  };
}
