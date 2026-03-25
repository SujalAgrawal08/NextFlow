"use client";

import React, { useEffect, useState, use } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas";
import { useWorkflowStore } from "@/store/workflowStore";
import { Play, Save, Loader2, Wand2 } from "lucide-react";

export default function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const workflowId = resolvedParams.id;

  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    fetch(`/api/workflows/${workflowId}`)
      .then(async res => {
         if (!res.ok) throw new Error(await res.text());
         return res.json();
      })
      .then(data => {
        if (data.state) {
          setNodes(data.state.nodes || []);
          setEdges(data.state.edges || []);
        }
      })
      .catch(console.error);
  }, [workflowId, setNodes, setEdges]);

  // Debounced Auto-Save
  useEffect(() => {
    const handler = setTimeout(() => {
      if (nodes.length > 0 || edges.length > 0) {
         setSaving(true);
         fetch(`/api/workflows/${workflowId}`, {
           method: "PUT",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ state: { nodes, edges } }),
         }).then(async res => {
             if (!res.ok) console.error("Auto-Save Failed:", await res.text());
         }).catch(console.error).finally(() => setSaving(false));
      }
    }, 2000);
    return () => clearTimeout(handler);
  }, [nodes, edges, workflowId]);

  // Load Product Marketing Kit Demo
  const loadDemoWorkflow = () => {
    if(window.confirm("This will overwrite your current canvas. Are you sure?")) {
      const demoNodes = [
        { id: 'img-1', type: 'uploadImageNode', position: { x: 50, y: 100 }, data: { label: 'Product Photo' } },
        { id: 'crop-1', type: 'cropImageNode', position: { x: 350, y: 100 }, data: { label: 'Crop Photo' } },
        { id: 'text-1', type: 'textNode', position: { x: 350, y: 350 }, data: { label: 'Product Details', text: 'New Smartwatch 2026 Pro. Water-resistant and durable.' } },
        { id: 'llm-1', type: 'runLLMNode', position: { x: 700, y: 200 }, data: { label: 'Description Generator', prompt: 'Write an exciting 2 sentence commercial hook.' } },
        { id: 'vid-1', type: 'uploadVideoNode', position: { x: 50, y: 600 }, data: { label: 'Demo Video' } },
        { id: 'extract-1', type: 'extractFrameNode', position: { x: 350, y: 600 }, data: { label: 'Get Highlight Frame' } },
        { id: 'llm-2', type: 'runLLMNode', position: { x: 1050, y: 350 }, data: { label: 'Social Media Writer', prompt: 'Combine the context into an explosive tweet format.' } }
      ];

      const demoEdges = [
        { id: 'e-img-crop', source: 'img-1', target: 'crop-1', sourceHandle: 'image', targetHandle: 'image', animated: true, style: { stroke: "#a855f7" } },
        { id: 'e-text-llm1', source: 'text-1', target: 'llm-1', sourceHandle: 'text', targetHandle: 'prompt', animated: true, style: { stroke: "#a855f7" } },
        { id: 'e-crop-llm1', source: 'crop-1', target: 'llm-1', sourceHandle: 'cropped', targetHandle: 'image', animated: true, style: { stroke: "#a855f7" } },
        { id: 'e-vid-extract', source: 'vid-1', target: 'extract-1', sourceHandle: 'video', targetHandle: 'video', animated: true, style: { stroke: "#a855f7" } },
        { id: 'e-llm1-llm2', source: 'llm-1', target: 'llm-2', sourceHandle: 'output', targetHandle: 'prompt', animated: true, style: { stroke: "#a855f7" } },
        { id: 'e-extract-llm2', source: 'extract-1', target: 'llm-2', sourceHandle: 'frame', targetHandle: 'image', animated: true, style: { stroke: "#a855f7" } }
      ];

      setNodes(demoNodes);
      setEdges(demoEdges);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setSaving(true);
    try {
      const putRes = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: { nodes, edges } }),
      });
      if (!putRes.ok) throw new Error("Save Failed");
      setSaving(false);
      
      const res = await fetch(`/api/workflows/${workflowId}/run`, { method: "POST" });
      if (!res.ok) {
        alert("Run deployment rejected by server. Check terminal for API Errors.");
        setSaving(false);
        return;
      }
      const data = await res.json();
      setRunId(data.id);
    } catch(err) {
      console.error(err);
      setRunning(false);
      setSaving(false);
    }
  };

  // Phase 6: Optimized Polling Backoff
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running && runId) {
      interval = setInterval(async () => {
         try {
           const res = await fetch(`/api/workflows/${workflowId}/runs/${runId}`);
           if (!res.ok) return;
           const data = await res.json();
           
           if (data.nodeRuns) {
             const currentNodes = useWorkflowStore.getState().nodes;
             let stateChanged = false;
             
             const updatedNodes = currentNodes.map(n => {
               const run = data.nodeRuns.find((nr: any) => nr.nodeId === n.id);
               if (!run) return n;
               
               // Strict check to prevent identical states from triggering React Auto-Save loops
               if (n.data.execStatus !== run.status || n.data.error !== run.error || JSON.stringify(n.data.outputs) !== JSON.stringify(run.outputs)) {
                 stateChanged = true;
                 return { ...n, data: { ...n.data, execStatus: run.status, error: run.error, outputs: run.outputs } };
               }
               return n;
             });
             
             if (stateChanged) {
               setNodes(updatedNodes);
             }
           }
           
           if (data.status === "COMPLETED" || data.status === "FAILED") {
             setRunning(false);
             clearInterval(interval);
           }
         } catch(e) { }
      }, 2500); // 2.5s relaxed polling
    }
    return () => clearInterval(interval);
  }, [running, runId, workflowId, setNodes]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-purple-500/30">
      <header className="h-16 border-b border-white/5 bg-slate-950/60 backdrop-blur-2xl flex items-center justify-between px-6 z-10 shrink-0 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
        <div className="font-extrabold text-xl tracking-tight flex items-center gap-3 relative z-10 drop-shadow-lg">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_4px_15px_rgba(168,85,247,0.4)] flex items-center justify-center ring-1 ring-white/10">
             <span className="text-white text-sm font-black tracking-tighter shadow-sm">N</span>
           </div>
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">NextFlow</span>
        </div>
        <div className="flex gap-4 items-center relative z-10">
          <button 
            onClick={loadDemoWorkflow}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-semibold transition-all duration-300 border border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] active:scale-95"
          >
            <Wand2 size={16} /> Load Demo
          </button>
          <div className="flex flex-row items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-white/5 rounded-lg border border-white/5 shadow-inner">
            {saving ? <Loader2 size={14} className="animate-spin text-purple-400" /> : <Save size={14} className="text-emerald-400" />} 
            {saving ? "Saving..." : "Auto-Saving"}
          </div>
          <button 
            onClick={handleRun}
            disabled={running}
            className="flex flex-row items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all duration-300 shadow-[0_5px_20px_rgba(168,85,247,0.4)] hover:shadow-[0_5px_25px_rgba(168,85,247,0.6)] border border-white/10 active:scale-95 group"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="fill-white group-hover:scale-110 transition-transform" />} 
            {running ? "Orchestrating..." : "Deploy Workflow"}
          </button>
        </div>
      </header>
      
      <main className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <WorkflowCanvas />
      </main>
    </div>
  );
}
