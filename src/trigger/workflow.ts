import { task } from "@trigger.dev/sdk/v3";
import { db } from "../lib/db";
import { RunStatus } from "@prisma/client";
import { executeWorkflowGraph } from "../lib/workflow/engine";

export const executeWorkflow = task({
  id: "execute-workflow",
  run: async (payload: { workflowId: string; runId: string }) => {
    console.log(`[WorkflowExecution] Started run ${payload.runId} for workflow ${payload.workflowId}`);

    // Update the run status to RUNNING in the DB (Await properly)
    await db.workflowRun.update({
      where: { id: payload.runId },
      data: { status: RunStatus.RUNNING },
    });

    try {
      // 1. Fetch Workflow from DB to get the JSON state
      const workflow = await db.workflow.findUnique({
        where: { id: payload.workflowId }
      });

      if (!workflow || !workflow.state) {
        throw new Error("Workflow or layout state not found");
      }

      // 2. Delegate to the core execution engine
      await executeWorkflowGraph(payload.workflowId, payload.runId, workflow.state);

      // 3. Mark complete successfully
      await db.workflowRun.update({
        where: { id: payload.runId },
        data: { status: RunStatus.COMPLETED, completedAt: new Date() },
      });

      return { success: true, message: "Workflow DAG executed successfully." };

    } catch (error: any) {
      console.error("[WorkflowExecution] Failed:", error);

      // Handle failures safely
      await db.workflowRun.update({
        where: { id: payload.runId },
        data: { status: RunStatus.FAILED, completedAt: new Date() },
      });

      throw error; // Alert Trigger.dev of the task failure
    }
  },
});
