import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuth as auth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string, runId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    
    // Ensure workflow exists and is owned by active user
    const workflow = await db.workflow.findUnique({
      where: { id: resolvedParams.id },
      include: { user: true }
    });

    if (!workflow || workflow.user.clerkId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const run = await db.workflowRun.findUnique({
      where: { id: resolvedParams.runId },
      include: { nodeRuns: true }
    });

    if (!run) return new NextResponse("Not Found", { status: 404 });
    
    return NextResponse.json(run);
  } catch(e) {
    console.error("[RUN_STATUS_GET]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
