import { RunStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { buildDAG, AppNode, AppEdge } from "./graph";
import { NodeHandlers } from "./nodes";
import pLimit from "p-limit";

const limit = pLimit(5); 

export async function executeWorkflowGraph(workflowId: string, runId: string, state: any) {
  const nodes: AppNode[] = state.nodes || [];
  const edges: AppEdge[] = state.edges || [];
  
  console.log(JSON.stringify({ event: "workflow_started", workflowId, runId, totalNodes: nodes.length }));
  
  const { adjacencyList, indegree, nodeMap } = buildDAG(nodes, edges);
  
  for (const node of nodes) {
    await db.nodeRun.create({
      data: {
        workflowRunId: runId,
        nodeId: node.id,
        nodeType: node.type,
        status: RunStatus.PENDING,
      }
    });
  }

  const queue: string[] = [];
  indegree.forEach((count, nodeId) => {
    if (count === 0) queue.push(nodeId);
  });

  const globalOutputs = new Map<string, any>();

  while (queue.length > 0) {
    const currentBatch = [...queue];
    queue.length = 0; 

    console.log(JSON.stringify({ event: "batch_execution_start", batchNodes: currentBatch }));

    await Promise.all(
      currentBatch.map(nodeId => limit(async () => {
        const node = nodeMap.get(nodeId)!;
        const maxRetries = 2; // Basic retry limit
        let attempts = 0;
        let success = false;
        let lastError: any = null;

        const nodeRun = await db.nodeRun.findFirst({ where: { workflowRunId: runId, nodeId } });
        
        if (nodeRun) {
           await db.nodeRun.update({
             where: { id: nodeRun.id },
             data: { status: RunStatus.RUNNING, startedAt: new Date() }
           });
        }

        while (attempts < maxRetries && !success) {
          try {
            console.log(JSON.stringify({ event: "node_execution_attempt", nodeId, type: node.type, attempt: attempts + 1 }));
            const nodeInputs = resolveNodeInputs(nodeId, edges, globalOutputs);
            
            const nodeOutput = await executeNode(node.type, nodeInputs, node.data);
            
            if (nodeOutput && nodeOutput.error) {
               throw new Error(nodeOutput.error);
            }

            globalOutputs.set(nodeId, nodeOutput);

            if (nodeRun) {
               await db.nodeRun.update({
                 where: { id: nodeRun.id },
                 data: { 
                   status: RunStatus.COMPLETED, 
                   completedAt: new Date(),
                   inputs: nodeInputs,       
                   outputs: nodeOutput,
                   retryCount: attempts
                 }
               });
            }
            success = true;
            console.log(JSON.stringify({ event: "node_execution_success", nodeId, type: node.type }));
          } catch (error: any) {
            lastError = error;
            attempts++;
            console.warn(JSON.stringify({ event: "node_execution_warning", nodeId, attempt: attempts, error: error.message }));
          }
        }

        if (!success) {
          console.error(JSON.stringify({ event: "node_execution_failed", nodeId, maxRetriesReached: true }));
          if (nodeRun) {
             await db.nodeRun.update({
               where: { id: nodeRun.id },
               data: { 
                 status: RunStatus.FAILED, 
                 completedAt: new Date(),
                 error: lastError?.message || "Unknown error",
                 retryCount: attempts
               }
             });
          }
          throw lastError; 
        }
        
        const neighbors = adjacencyList.get(nodeId) || [];
        for (const neighbor of neighbors) {
          const currentIndegree = indegree.get(neighbor)! - 1;
          indegree.set(neighbor, currentIndegree);
          if (currentIndegree === 0) queue.push(neighbor);
        }
      }))
    );
  }

  console.log(JSON.stringify({ event: "workflow_completed", workflowId, runId }));
}

function resolveNodeInputs(nodeId: string, edges: AppEdge[], globalOutputs: Map<string, any>) {
  const incomingEdges = edges.filter(e => e.target === nodeId);
  const inputs: Record<string, any> = {};
  
  for (const edge of incomingEdges) {
    const sourceOutput = globalOutputs.get(edge.source);
    if (sourceOutput) {
       inputs[edge.targetHandle || edge.source] = sourceOutput[edge.sourceHandle || "output"] || sourceOutput;
    }
  }
  return inputs;
}

async function executeNode(type: string, inputs: any, config: any) {
  const handler = NodeHandlers[type];
  if (!handler) throw new Error(`Unregistered execution node pattern: ${type}`);
  return await handler(inputs, config);
}
