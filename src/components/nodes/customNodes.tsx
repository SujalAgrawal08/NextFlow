import React from "react";
import { Handle, Position } from "@xyflow/react";

const BaseNode = ({ id, data, title, inputs, outputs, children }: any) => {
  let ringClass = "border-white/10 hover:border-white/20";
  if (data.execStatus === "RUNNING") ringClass = "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]";
  else if (data.execStatus === "COMPLETED") ringClass = "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
  else if (data.execStatus === "FAILED") ringClass = "border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)]";

  return (
    <div className={`bg-[#0B0F19]/90 backdrop-blur-2xl text-slate-200 rounded-[28px] min-w-[280px] border-[1.5px] transition-all duration-500 ${ringClass} shadow-[0_8px_32px_rgba(0,0,0,0.6)] group overflow-hidden`}>
      <div className="px-5 py-4 bg-white/[0.02] border-b border-white/[0.08] text-sm font-bold flex justify-between items-center transition-all">
        <span className="tracking-wide text-slate-100 drop-shadow-md">{title}</span>
        {data.execStatus && (
          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md shadow-inner ${
            data.execStatus === "RUNNING" ? "bg-purple-500/10 text-purple-300 border border-purple-500/20" :
            data.execStatus === "COMPLETED" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" :
            "bg-rose-500/10 text-rose-300 border border-rose-500/20"
          }`}>
            {data.execStatus}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-4 relative">
        {inputs.map((inp: any) => (
          <div key={inp.id} className="relative flex items-center">
            <Handle
              type="target"
              position={Position.Left}
              id={inp.id}
              className="w-3.5 h-3.5 bg-slate-300 border-2 border-slate-900 absolute rounded-full hover:bg-white transition-transform duration-300 hover:scale-[1.3] shadow-[0_0_8px_rgba(255,255,255,0.2)]"
              style={{ left: "-23.5px" }}
            />
            <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase drop-shadow-sm">{inp.label}</span>
          </div>
        ))}
        
        {children}

        {data.execStatus === "FAILED" && data.error && (
          <div className="mt-2 text-[10px] text-red-300 bg-red-950/40 p-2 rounded-md border border-red-900/50 break-words leading-tight">
             ⚠️ {data.error}
          </div>
        )}

        {data.outputs && (
          <div className="mt-4 text-[12px] text-slate-300 bg-black/50 p-4 rounded-2xl border border-white/[0.08] break-words overflow-y-auto max-h-[160px] shadow-inner custom-scrollbar relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none" />
            {Object.entries(data.outputs).map(([key, val]: any) => (
               <div key={key} className="flex flex-col gap-2 relative z-10">
                 <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest">{key}:</span>
                 {typeof val === 'string' && (val.startsWith('http') || val.startsWith('data:image')) ? (
                    <div className="rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl mt-1">
                      <img src={val} alt="Output" className="w-full object-cover" />
                    </div>
                 ) : (
                    <span className="whitespace-pre-wrap leading-relaxed font-medium text-slate-100">{String(val)}</span>
                 )}
               </div>
            ))}
          </div>
        )}

        {outputs.map((out: any) => (
          <div key={out.id} className="relative flex items-center justify-end mt-1">
            <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase drop-shadow-sm">{out.label}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={out.id}
              className="w-3.5 h-3.5 bg-purple-500 border-2 border-slate-900 absolute rounded-full hover:shadow-[0_0_15px_rgba(168,85,247,0.9)] transition-transform duration-300 hover:scale-[1.3] hover:bg-purple-400"
              style={{ right: "-23.5px" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TextNode = (props: any) => (
  <BaseNode {...props} title="Text Input" inputs={[]} outputs={[{ id: "text", label: "Text Output" }]}>
    <textarea
      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-slate-100 resize-none min-h-[80px] focus:border-purple-500 focus:bg-white/[0.05] outline-none transition-all shadow-inner"
      placeholder="Enter text prompt..."
      defaultValue={props.data.text}
    />
  </BaseNode>
);

export const UploadImageNode = (props: any) => (
  <BaseNode {...props} title="Upload Image" inputs={[]} outputs={[{ id: "image", label: "Image URL" }]}>
    <button className="w-full bg-white/[0.03] hover:bg-white/[0.08] transition-all text-sm py-4 rounded-2xl border border-white/10 border-dashed text-slate-300 font-bold tracking-wide">
      Drop Image Here
    </button>
  </BaseNode>
);

export const UploadVideoNode = (props: any) => (
  <BaseNode {...props} title="Upload Video" inputs={[]} outputs={[{ id: "video", label: "Video URL" }]}>
    <button className="w-full bg-white/[0.03] hover:bg-white/[0.08] transition-all text-sm py-4 rounded-2xl border border-white/10 border-dashed text-slate-300 font-bold tracking-wide">
      Drop Video Here
    </button>
  </BaseNode>
);

export const RunLLMNode = (props: any) => (
  <BaseNode
    {...props}
    title="Run AI Agent"
    inputs={[
      { id: "prompt", label: "System Prompt" },
      { id: "image", label: "Context Image" },
    ]}
    outputs={[{ id: "output", label: "Generation Result" }]}
  >
    <div className="flex flex-col gap-3">
      <select className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-sm font-semibold text-slate-100 outline-none focus:border-purple-500 transition-all cursor-pointer shadow-inner appearance-none" defaultValue="gemini-2.0-flash">
        <option value="gemini-2.0-flash" className="bg-slate-900">Gemini 2.0 Flash</option>
        <option value="gemini-2.5-flash" className="bg-slate-900">Gemini 2.5 Flash</option>
      </select>
      <input type="text" placeholder="Base Prompt..." className="w-full bg-white/[0.03] border border-white/10 rounded-max rounded-2xl p-3 text-sm text-slate-100 outline-none focus:border-purple-500 transition-all shadow-inner" defaultValue={props.data.prompt} />
    </div>
  </BaseNode>
);

export const CropImageNode = (props: any) => (
  <BaseNode {...props} title="Crop Image" inputs={[{ id: "image", label: "Image Input" }]} outputs={[{ id: "cropped", label: "Cropped Output" }]}>
    <div className="grid grid-cols-2 gap-3">
      <input type="number" placeholder="X%" className="bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm font-bold text-center text-slate-100 outline-none focus:border-purple-500 transition-all shadow-inner" />
      <input type="number" placeholder="Y%" className="bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm font-bold text-center text-slate-100 outline-none focus:border-purple-500 transition-all shadow-inner" />
      <input type="number" placeholder="W%" className="bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm font-bold text-center text-slate-100 outline-none focus:border-purple-500 transition-all shadow-inner" />
      <input type="number" placeholder="H%" className="bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm font-bold text-center text-slate-100 outline-none focus:border-purple-500 transition-all shadow-inner" />
    </div>
  </BaseNode>
);

export const ExtractFrameNode = (props: any) => (
  <BaseNode {...props} title="Extract Frame" inputs={[{ id: "video", label: "Video Input" }]} outputs={[{ id: "frame", label: "Image Output" }]}>
    <input type="text" placeholder="Timestamp (00:05.5)" className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-sm font-bold text-center text-slate-100 w-full outline-none focus:border-purple-500 transition-all shadow-inner" />
  </BaseNode>
);

export const nodeTypes = {
  textNode: TextNode,
  uploadImageNode: UploadImageNode,
  uploadVideoNode: UploadVideoNode,
  runLLMNode: RunLLMNode,
  cropImageNode: CropImageNode,
  extractFrameNode: ExtractFrameNode,
};
