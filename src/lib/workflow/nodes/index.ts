import { executeTextNode } from "./text";
import { executeLLMNode } from "./llm";
import { executeCropImageNode } from "./image";
import { executeExtractFrameNode } from "./video";

export const NodeHandlers: Record<string, (inputs: any, config: any) => Promise<any>> = {
  textNode: executeTextNode,
  runLLMNode: executeLLMNode,
  cropImageNode: executeCropImageNode,
  extractFrameNode: executeExtractFrameNode,
  uploadImageNode: async (inputs, config) => {
    // Stunning product photography placeholder for demonstration
    return { image: config.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80" };
  },
  uploadVideoNode: async (inputs, config) => {
    return { video: config.url || "https://sample-videos.com/video123.mp4" };
  },
};
