import os
import glob
import hashlib
import numpy as np
import pdfplumber
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Tuple
import io
import joblib
class RAGSystem:
    # def __init__(self, pdf_folder: str):
    #     self.pdf_folder = pdf_folder
    #     self.model = SentenceTransformer('all-MiniLM-L6-v2')
    #     self.documents = []
    #     self.index = None
    #     self.load_pdfs()
    #     self.build_index()
    def __init__(self, pdf_folder: str):
        self.pdf_folder = pdf_folder
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents = []
        self.index = None
        self.cache_file = "rag_cache.pkl"
        if os.path.exists(self.cache_file):
            self._load_cache()
        else:
            self.load_pdfs()
            self.build_index()
            self._save_cache()

    def _load_cache(self):
        with open(self.cache_file, 'rb') as f:
            data = joblib.load(f)
        self.documents = data['documents']
        self.index = data['index']
        print(f"Loaded {len(self.documents)} chunks from cache.")

    def _save_cache(self):
        with open(self.cache_file, 'wb') as f:
            joblib.dump({'documents': self.documents, 'index': self.index}, f)
        print("Saved RAG cache.")
    def load_pdfs(self):
        if not os.path.exists(self.pdf_folder):
            print(f"PDF folder {self.pdf_folder} does not exist. No PDFs loaded.")
            return
        pdf_files = glob.glob(os.path.join(self.pdf_folder, "*.pdf"))
        print(f"Found {len(pdf_files)} PDF files in {self.pdf_folder}")
        for pdf_path in pdf_files:
            print(f"Processing {os.path.basename(pdf_path)}...")
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    full_text = ""
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            full_text += page_text + "\n"
                if not full_text.strip():
                    print(f"Warning: No text extracted from {pdf_path}")
                    continue
                chunks = chunk_text(full_text, chunk_size=300)
                for i, chunk in enumerate(chunks):
                    snippet_id = f"{os.path.basename(pdf_path).replace('.pdf', '')}-{i}"
                    content_hash = hashlib.sha256(chunk.encode()).hexdigest()
                    if any(d["hash"] == content_hash for d in self.documents):
                        continue
                    embedding = self.model.encode(chunk).tolist()
                    self.documents.append({
                        "snippet_id": snippet_id,
                        "content": chunk,
                        "embedding": embedding,
                        "hash": content_hash
                    })
            except Exception as e:
                print(f"Error parsing {pdf_path}: {e}")
        print(f"Loaded {len(self.documents)} chunks total.")

    def build_index(self):
        if not self.documents:
            print("No documents to index.")
            return
        embeddings = np.array([d["embedding"] for d in self.documents]).astype('float32')
        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)
        print(f"FAISS index built with {self.index.ntotal} vectors.")

    def search(self, query: str, top_k: int = 3, threshold: float = 0.5) -> List[Tuple[str, str, float]]:
        if self.index is None or self.index.ntotal == 0:
            return []
        query_emb = self.model.encode(query).astype('float32').reshape(1, -1)
        faiss.normalize_L2(query_emb)
        scores, indices = self.index.search(query_emb, top_k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if score > threshold and idx < len(self.documents):
                doc = self.documents[idx]
                results.append((doc["snippet_id"], doc["content"], float(score)))
        return results

# ---------- Shared chunking function ----------
def chunk_text(text: str, chunk_size: int = 300) -> List[str]:
    """
    Split text into small chunks by lines, ensuring each chunk is at most chunk_size.
    Headings and short lines become separate chunks.
    """
    lines = text.split('\n')
    chunks = []
    current = ""
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if len(current) + len(line) > chunk_size and current:
            chunks.append(current)
            current = line
        else:
            current += (' ' + line) if current else line
    if current:
        chunks.append(current)
    return chunks

def process_pdf_bytes(file_bytes: bytes, filename: str, model: SentenceTransformer, chunk_size: int = 300):
    """
    Extract text from PDF bytes, split into chunks, generate embeddings.
    Uses the same chunk_text function as RAGSystem.
    """
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        full_text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
    if not full_text.strip():
        return []

    print(f"Extracted text from {filename} (first 500 chars):\n{full_text[:500]}")

    chunk_list = chunk_text(full_text, chunk_size)
    chunks = []
    for i, chunk_text_str in enumerate(chunk_list):
        if not chunk_text_str.strip():
            continue
        embedding = model.encode(chunk_text_str).tolist()
        chunks.append({
            "content": chunk_text_str,
            "embedding": embedding,
            "source": f"uploaded-{filename}-{i}"
        })
    return chunks