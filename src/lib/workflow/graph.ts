export type AppNode = {
  id: string;
  type: string;
  data: Record<string, any>;
};

export type AppEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export function buildDAG(nodes: AppNode[], edges: AppEdge[]) {
  const adjacencyList = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  const nodeMap = new Map<string, AppNode>();
  
  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    indegree.set(node.id, 0);
    nodeMap.set(node.id, node);
  });
  
  edges.forEach(edge => {
    if (adjacencyList.has(edge.source) && adjacencyList.has(edge.target)) {
      adjacencyList.get(edge.source)!.push(edge.target);
      indegree.set(edge.target, indegree.get(edge.target)! + 1);
    }
  });
  
  // Cycle Detection (Kahn's Algorithm)
  let processedCount = 0;
  const queue: string[] = [];
  const tempIndegree = new Map(indegree);
  
  tempIndegree.forEach((count, id) => {
    if (count === 0) queue.push(id);
  });

  while (queue.length > 0) {
    const curr = queue.shift()!;
    processedCount++;
    const neighbors = adjacencyList.get(curr) || [];
    for (const neighbor of neighbors) {
      tempIndegree.set(neighbor, tempIndegree.get(neighbor)! - 1);
      if (tempIndegree.get(neighbor) === 0) queue.push(neighbor);
    }
  }

  if (processedCount !== nodes.length) {
    throw new Error("Cycle detected! Workflows must be Directed Acyclic Graphs (DAG) to prevent infinite execution loops.");
  }
  
  return { adjacencyList, indegree, nodeMap, edges };
}
