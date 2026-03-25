"use client";

import React from "react";
import { Type, Image, Video, FileText, Crop, Settings } from "lucide-react";

const NODE_TYPES = [
  { type: "textNode", label: "Text Input", icon: <Type size={16} /> },
  { type: "uploadImageNode", label: "Upload Image", icon: <Image size={16} /> },
  { type: "uploadVideoNode", label: "Upload Video", icon: <Video size={16} /> },
  { type: "runLLMNode", label: "Run Any LLM", icon: <Settings size={16} /> },
  { type: "cropImageNode", label: "Crop Image", icon: <Crop size={16} /> },
  { type: "extractFrameNode", label: "Extract Frame", icon: <FileText size={16} /> },
];

export const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-[280px] bg-slate-950/80 backdrop-blur-2xl border-r border-white/5 p-5 flex flex-col gap-6 h-full shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-10">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 drop-shadow-sm ml-1">Nodes Library</div>
      <div className="flex flex-col gap-3">
        {NODE_TYPES.map((nt) => (
          <div
            key={nt.type}
            className="flex items-center gap-4 p-3.5 bg-white/[0.03] rounded-xl cursor-grab active:cursor-grabbing hover:bg-white/[0.08] hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-300 border border-white/5 hover:border-purple-500/30 group"
            onDragStart={(event) => onDragStart(event, nt.type)}
            draggable
          >
            <div className="text-slate-400 group-hover:text-purple-400 transition-colors drop-shadow">{nt.icon}</div>
            <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{nt.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};
