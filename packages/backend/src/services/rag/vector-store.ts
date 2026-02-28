import { getBedrockService } from '../bedrock';

export interface Document {
  id: string;
  content: string;
  metadata: {
    title: string;
    category: string;
    language: string;
    source?: string;
    tags?: string[];
  };
  embedding?: number[];
}

export interface SearchResult {
  document: Document;
  score: number;
}

export class VectorStore {
  private bedrock = getBedrockService();
  private documents: Map<string, Document> = new Map();

  /**
   * Add document to vector store
   */
  async addDocument(doc: Omit<Document, 'embedding'>): Promise<void> {
    // Generate embedding for document content
    const embedding = await this.bedrock.embed(doc.content);

    const document: Document = {
      ...doc,
      embedding,
    };

    this.documents.set(doc.id, document);
  }

  /**
   * Add multiple documents in batch
   */
  async addDocuments(docs: Omit<Document, 'embedding'>[]): Promise<void> {
    // Generate embeddings in batch
    const contents = docs.map((d) => d.content);
    const embeddings = await this.bedrock.batchEmbed(contents);

    // Store documents with embeddings
    docs.forEach((doc, index) => {
      const document: Document = {
        ...doc,
        embedding: embeddings[index],
      };
      this.documents.set(doc.id, document);
    });
  }

  /**
   * Search for similar documents using cosine similarity
   */
  async search(query: string, options?: { topK?: number; category?: string }): Promise<SearchResult[]> {
    const topK = options?.topK || 5;

    // Generate query embedding
    const queryEmbedding = await this.bedrock.embed(query);

    // Calculate similarity scores
    const results: SearchResult[] = [];

    for (const [id, doc] of this.documents.entries()) {
      // Filter by category if specified
      if (options?.category && doc.metadata.category !== options.category) {
        continue;
      }

      if (!doc.embedding) continue;

      const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
      results.push({ document: doc, score });
    }

    // Sort by score and return top K
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  /**
   * Get all documents in category
   */
  getDocumentsByCategory(category: string): Document[] {
    return Array.from(this.documents.values()).filter((doc) => doc.metadata.category === category);
  }

  /**
   * Get store statistics
   */
  getStats(): { totalDocuments: number; categories: string[] } {
    const categories = new Set<string>();
    for (const doc of this.documents.values()) {
      categories.add(doc.metadata.category);
    }

    return {
      totalDocuments: this.documents.size,
      categories: Array.from(categories),
    };
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents.clear();
  }
}

// Singleton instance
let vectorStoreInstance: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore();
  }
  return vectorStoreInstance;
}
