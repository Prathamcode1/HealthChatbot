import { generateEmbedding, cosineSimilarity } from "./gemini";
import type { RagDocument } from "../shared/schema";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import PDFParser from 'pdf2json';

export interface RAGDocument {
  snippetId: string;
  title: string;
  content: string;
  category: string;
  embedding: number[];
  contentHash?: string;
}

// ========== YOUR EXISTING NCCN ENTRIES GO HERE ==========
// (Keep all your NCCN-BC, NCCN-SC, NCCN-TC, etc. entries exactly as they were)
export const healthDocuments: RAGDocument[] = [
  // ... your NCCN entries ...
];

let documentsInitialized = false;

/**
 * Extract text from a PDF file using pdf2json (pure Node.js, no browser dependencies)
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on('pdfParser_dataError', (err: any) => reject(err));
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      let fullText = '';
      if (pdfData.Pages) {
        for (const page of pdfData.Pages) {
          if (page.Texts) {
            for (const textItem of page.Texts) {
              if (textItem.R && textItem.R[0] && textItem.R[0].T) {
                let rawText = textItem.R[0].T;
                let decodedText = rawText;
                try {
                  decodedText = decodeURIComponent(rawText);
                } catch (e) {
                  // If decoding fails, keep the raw text (it's already plain)
                  decodedText = rawText;
                }
                fullText += decodedText + ' ';
              }
            }
            fullText += '\n';
          }
        }
      }
      resolve(fullText.trim());
    });
    pdfParser.loadPDF(filePath);
  });
}

export async function loadPDFsFromFolder(folderPath: string) {
  if (!fs.existsSync(folderPath)) {
    console.log(`Folder ${folderPath} does not exist. Skipping PDF loading.`);
    return;
  }

  const files = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`Found ${files.length} PDF files in ${folderPath}`);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    let text;
    try {
      text = await extractTextFromPDF(filePath);
    } catch (err) {
      console.error(`Error parsing PDF ${file}:`, err);
      continue;
    }

    if (!text || text.length < 50) {
      console.log(`Skipping ${file} – extracted text too short.`);
      continue;
    }

    const chunks = splitIntoChunks(text, 1000);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      if (!chunk) continue;

      const contentHash = crypto.createHash('sha256').update(chunk).digest('hex');
      const exists = healthDocuments.some(doc => doc.contentHash === contentHash);
      if (exists) {
        console.log(`Skipping duplicate chunk from ${file} (part ${i+1})`);
        continue;
      }

      const snippetId = `PDF-${path.basename(file, '.pdf').replace(/[^a-zA-Z0-9]/g, '_')}-${i}`;
      healthDocuments.push({
        snippetId,
        title: `${file} - part ${i+1}`,
        content: chunk,
        category: 'pdf-upload',
        embedding: [],
        contentHash,
      });
      console.log(`Added document: ${snippetId}`);
    }
  }
}

function splitIntoChunks(text: string, chunkSize: number): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

export async function initializeDocuments() {
  if (documentsInitialized) return;

  console.log("Initializing RAG document embeddings...");
  for (const doc of healthDocuments) {
    if (doc.embedding.length === 0) {
      doc.embedding = await generateEmbedding(doc.content);
    }
  }
  documentsInitialized = true;
  console.log("RAG documents initialized with embeddings");
}

export async function searchDocuments(
  query: string,
  topK: number = 3
): Promise<Array<{ document: RAGDocument; score: number }>> {
  await initializeDocuments();

  const queryEmbedding = await generateEmbedding(query);

  const scores = healthDocuments.map(doc => ({
    document: doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK).filter(item => item.score > 0.3);
}

export async function generateRAGResponse(query: string): Promise<{
  answer: string;
  citations: string[];
}> {
  const relevantDocs = await searchDocuments(query);

  if (relevantDocs.length === 0) {
    return {
      answer: "I don't have specific information about that in my knowledge base. Would you like me to help you book an appointment with a doctor instead?",
      citations: [],
    };
  }

  const context = relevantDocs
    .map(item => `[${item.document.snippetId}] ${item.document.content}`)
    .join("\n\n");

  const citations = relevantDocs.map(item => item.document.snippetId);

  return {
    answer: context,
    citations,
  };
}

export function getAllDocuments(): RagDocument[] {
  return healthDocuments.map(doc => ({
    id: doc.snippetId,
    snippetId: doc.snippetId,
    title: doc.title,
    content: doc.content,
    category: doc.category,
    embedding: JSON.stringify(doc.embedding),
    createdAt: new Date(),
  }));
}