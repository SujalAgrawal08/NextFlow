import { getAuth as auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executeWorkflow } from "@/trigger/workflow";
import { RunStatus } from "@prisma/client";
import fs from "fs";
import path from "path";

// Turbopack on Windows cache-bust mitigation
if (!process.env.TRIGGER_SECRET_KEY) {
  try {
     const envText = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
     const match = envText.match(/TRIGGER_SECRET_KEY=["']?(.*?)["']?(\n|$)/);
     if (match) process.env.TRIGGER_SECRET_KEY = match[1].trim();
  } catch (e) {}
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    
    // Verify user owns the workflow
    const workflow = await db.workflow.findUnique({
      where: { id: resolvedParams.id },
      include: { user: true },
    });

    if (!workflow || workflow.user.clerkId !== userId) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    // Create a new WorkflowRun in the DB with status PENDING
    const workflowRun = await db.workflowRun.create({
      data: {
        workflowId: resolvedParams.id,
        status: RunStatus.PENDING,
      },
    });

    // Trigger the background job queue via Trigger.dev platform
    await executeWorkflow.trigger({
      workflowId: resolvedParams.id,
      runId: workflowRun.id,
    });

    return NextResponse.json(workflowRun);
  } catch (error) {
    console.error("[WORKFLOW_RUN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
