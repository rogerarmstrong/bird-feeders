import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/user-validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
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

  const result = userUpdateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid user payload", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const email = result.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { id: params.id }
  });

  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email }
  });

  if (emailOwner && emailOwner.id !== params.id) {
    return NextResponse.json({ error: "Another user already uses this email." }, { status: 409 });
  }

  const user = await prisma.$transaction(async (transaction) => {
    await transaction.feeder.updateMany({
      where: {
        assignedUserId: params.id,
        id: {
          notIn: result.data.feederIds
        }
      },
      data: {
        assignedUserId: null
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
          assignedUserId: params.id
        }
      });
    }

    return transaction.user.update({
      where: {
        id: params.id
      },
      data: {
        name: result.data.name,
        email,
        ...(result.data.password
          ? {
              passwordHash: await bcrypt.hash(result.data.password, 12)
            }
          : {})
      },
      include: {
        assignedFeeders: true
      }
    });
  });

  return NextResponse.json(user);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { session, response } = await requireApiSession();

  if (response) {
    return response;
  }

  if (session?.user.id === params.id) {
    return NextResponse.json({ error: "You cannot remove your own signed-in account." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.feeder.updateMany({
      where: {
        assignedUserId: params.id
      },
      data: {
        assignedUserId: null
      }
    }),
    prisma.user.delete({
      where: {
        id: params.id
      }
    })
  ]);

  return NextResponse.json({ ok: true });
}
