import { getAuth as auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const resolvedParams = await params;

    const workflow = await db.workflow.findUnique({
      where: {
        id: resolvedParams.id,
      },
      include: {
        runs: {
          orderBy: {
            startedAt: "desc",
          },
          take: 10, // Fetch recent runs for the layout
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({
         id: resolvedParams.id,
         name: "Demo Workflow",
         state: { nodes: [], edges: [] }
      });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("[WORKFLOW_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    const { name, description, state } = body;

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return new NextResponse("Unauthorized", { status: 401 });

    const workflow = await db.workflow.upsert({
      where: {
        id: resolvedParams.id,
      },
      update: {
        name,
        description,
        state,
      },
      create: {
        id: resolvedParams.id,
        name: name || "Demo Workflow",
        description: description || "",
        state: state || { nodes: [], edges: [] },
        userId: dbUser.id,
      }
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("[WORKFLOW_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;

    const workflow = await db.workflow.delete({
      where: {
        id: resolvedParams.id,
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("[WORKFLOW_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
