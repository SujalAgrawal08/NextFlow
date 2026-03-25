import { getAuth as auth, getCurrentUser as currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Ensure the user exists in our DB (upsert based on clerkId)
    const dbUser = await db.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    const body = await req.json();
    const { name, description, state } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const workflow = await db.workflow.create({
      data: {
        userId: dbUser.id,
        name,
        description,
        state: state || { nodes: [], edges: [] },
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("[WORKFLOWS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json([]);
    }

    const workflows = await db.workflow.findMany({
      where: {
        userId: dbUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("[WORKFLOWS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
