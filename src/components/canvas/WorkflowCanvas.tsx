"use client";

import React, { useCallback, useRef } from "react";
import { ReactFlow, Background, Controls, MiniMap, ReactFlowProvider, BackgroundVariant } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "@/store/workflowStore";
import { nodeTypes } from "../nodes/customNodes";

export const WorkflowCanvas = () => {
  const reactFlowWrapper = useRef(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes } = useWorkflowStore();

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) return;

      const position = {
        x: event.clientX - 280, // Approximate offset for sidebar width
        y: event.clientY - 80,  // Approximate offset for header height
      };

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: `${type} node`, execStatus: null },
      };

      setNodes(nodes.concat(newNode));
    },
    [nodes, setNodes]
  );

  return (
    <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="bg-slate-950"
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background color="#334155" variant={BackgroundVariant.Dots} gap={24} size={2} />
          <Controls className="fill-slate-400 bg-slate-900 border-slate-800" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};
