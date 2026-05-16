import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getManagedUsers } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/user-validation";

export async function GET() {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  const users = await getManagedUsers();

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();

  if (response) {
    return response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const result = userCreateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid user payload", details: result.error.flatten() },
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

  const user = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        name: result.data.name,
        email,
        emailVerified: new Date(),
        passwordHash: await bcrypt.hash(result.data.password, 12)
      }
    });

    if (result.data.feederIds.length > 0) {
      await transaction.feeder.updateMany({
        where: {
          id: {
            in: result.data.feederIds
          }
        },
        data: {
          assignedUserId: createdUser.id
        }
      });
    }

    return createdUser;
  });

  return NextResponse.json(user, { status: 201 });
}
