import { create } from "zustand";
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";

export type AppNode = Node;
export type AppEdge = Edge;

export type WorkflowState = {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes: NodeChange<AppNode>[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    // Add glowing purple connection style for the node wiring (per project styling requirements)
    set({
      edges: addEdge(
        { ...connection, animated: true, style: { stroke: "#a855f7", strokeWidth: 2 } },
        get().edges
      ),
    });
  },
  setNodes: (nodes: AppNode[]) => set({ nodes }),
  setEdges: (edges: AppEdge[]) => set({ edges }),
}));
