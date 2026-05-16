import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128)
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid registration payload", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const email = result.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: result.data.name,
      email,
      passwordHash: await bcrypt.hash(result.data.password, 12)
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  return NextResponse.json(user, { status: 201 });
}
