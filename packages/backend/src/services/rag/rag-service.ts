import { getBedrockService } from '../bedrock';
import { getVectorStore, SearchResult } from './vector-store';

export interface RAGQuery {
  question: string;
  category?: string;
  language?: string;
  topK?: number;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    title: string;
    content: string;
    relevance: number;
  }>;
  confidence: number;
}

export class RAGService {
  private bedrock = getBedrockService();
  private vectorStore = getVectorStore();

  /**
   * Query knowledge base using RAG
   */
  async query(query: RAGQuery): Promise<RAGResponse> {
    // Step 1: Retrieve relevant documents
    const searchResults = await this.vectorStore.search(query.question, {
      topK: query.topK || 5,
      category: query.category,
    });

    // Step 2: Build context from retrieved documents
    const context = this.buildContext(searchResults);

    // Step 3: Generate answer using context
    const answer = await this.generateAnswer(query.question, context, query.language);

    // Step 4: Calculate confidence based on relevance scores
    const confidence = this.calculateConfidence(searchResults);

    return {
      answer,
      sources: searchResults.map((result) => ({
        title: result.document.metadata.title,
        content: result.document.content.substring(0, 200) + '...',
        relevance: result.score,
      })),
      confidence,
    };
  }

  /**
   * Build context string from search results
   */
  private buildContext(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant information found in knowledge base.';
    }

    const contextParts = results.map((result, index) => {
      return `[Source ${index + 1}: ${result.document.metadata.title}]
${result.document.content}`;
    });

    return contextParts.join('\n\n');
  }

  /**
   * Generate answer using retrieved context
   */
  private async generateAnswer(question: string, context: string, language?: string): Promise<string> {
    const systemPrompt = `You are a helpful assistant for RuralConnect AI.
Answer questions based ONLY on the provided context.
If the context doesn't contain relevant information, say "I don't have enough information to answer that."
${language ? `Respond in ${language} language.` : ''}
Be concise and practical.`;

    const prompt = `Context:
${context}

Question: ${question}

Answer:`;

    const response = await this.bedrock.generateWithCache(prompt, {
      modelType: 'sonnet',
      systemPrompt,
      useCache: false, // Don't cache RAG responses as context varies
    });

    return response.text;
  }

  /**
   * Calculate confidence score based on relevance
   */
  private calculateConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;

    // Average of top 3 scores
    const topScores = results.slice(0, 3).map((r) => r.score);
    const avgScore = topScores.reduce((sum, score) => sum + score, 0) / topScores.length;

    // Normalize to 0-1 range
    return Math.min(avgScore, 1.0);
  }

  /**
   * Stream RAG response
   */
  async *streamQuery(query: RAGQuery): AsyncGenerator<string> {
    // Retrieve relevant documents
    const searchResults = await this.vectorStore.search(query.question, {
      topK: query.topK || 5,
      category: query.category,
    });

    // Build context
    const context = this.buildContext(searchResults);

    // System prompt
    const systemPrompt = `You are a helpful assistant for RuralConnect AI.
Answer questions based ONLY on the provided context.
${query.language ? `Respond in ${query.language} language.` : ''}`;

    const prompt = `Context:
${context}

Question: ${query.question}

Answer:`;

    // Stream the response
    yield* this.bedrock.streamGenerate(prompt, {
      modelType: 'sonnet',
    });
  }

  /**
   * Add knowledge to vector store
   */
  async addKnowledge(
    content: string,
    metadata: {
      title: string;
      category: string;
      language: string;
      source?: string;
      tags?: string[];
    }
  ): Promise<string> {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.vectorStore.addDocument({
      id,
      content,
      metadata,
    });

    return id;
  }

  /**
   * Bulk import knowledge base
   */
  async bulkImport(
    documents: Array<{
      content: string;
      metadata: {
        title: string;
        category: string;
        language: string;
        source?: string;
        tags?: string[];
      };
    }>
  ): Promise<string[]> {
    const docsWithIds = documents.map((doc) => ({
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...doc,
    }));

    await this.vectorStore.addDocuments(docsWithIds);

    return docsWithIds.map((d) => d.id);
  }

  /**
   * Get knowledge base statistics
   */
  getStats() {
    return this.vectorStore.getStats();
  }
}

// Singleton instance
let ragServiceInstance: RAGService | null = null;

export function getRAGService(): RAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new RAGService();
  }
  return ragServiceInstance;
}
