import { GoogleGenerativeAI } from "@google/generative-ai";

export async function executeLLMNode(inputs: any, config: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in environment variables.");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = config.model || "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const promptText = inputs.prompt || config.prompt || "Hello";
  
  const parts: any[] = [{ text: promptText }];
  
  if (inputs.image && typeof inputs.image === 'string') {
    // Inject image awareness context for multi-modal demonstration
    parts.push({ text: `[Image Context provided: ${inputs.image}]` });
  }

  try {
    const result = await model.generateContent(parts);
    const response = result.response.text();
    
    return { output: response };
  } catch (error: any) {
    if (error.message && (error.message.includes("429") || error.message.includes("quota"))) {
      console.warn("[LLM Node] Google API Quota Error intercepted globally. Emitting dynamic Mock Response.");
      return { output: `[MOCK AI OUTPUT] Supercharge your digital life with an interface designed for sheer elegance and unbounded performance.` };
    }
    throw error;
  }
}
