import { GoogleGenAI } from "@google/genai";
import { pipeline } from '@xenova/transformers';

// Keep Gemini for chat, but embeddings will be local
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: { apiVersion: "v1" }
});

// Local embedding pipeline (lazy-loaded)
let embeddingPipeline: any = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    // This loads a small 384-dim model (fast, ~80MB download on first run)
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embeddingPipeline;
}

export async function generateChatResponse(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string,
): Promise<string> {
  try {
    const contents = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    if (systemPrompt) {
      contents.unshift({
        role: "user",
        parts: [{ text: systemPrompt }],
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents,
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate response");
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use local transformer model
    const extractor = await getEmbeddingPipeline();
    const result = await extractor(text, { pooling: 'mean', normalize: true });
    // Convert tensor to array
    return Array.from(result.data);
  } catch (error) {
    console.error("Local embedding error:", error);
    // Fallback to simple bag-of-words (384-dim to match transformer)
    return generateFallbackEmbedding(text);
  }
}

// Updated fallback to output 384-dim vectors (matching the transformer model)
function generateFallbackEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const index = (charCode + j * 37 + i * 13) % 384;
      embedding[index] += 1 / (words.length + 1);
    }
  }

  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  return magnitude === 0 ? embedding : embedding.map((val) => val / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0; // will now both be 384

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}