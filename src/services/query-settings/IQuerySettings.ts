/**
 * Query Settings Interface
 *
 * Manages runtime query parameters that affect RAG query behavior:
 * - topK: Number of embeddings to retrieve
 * - temperature: LLM temperature for response generation
 * - maxTokens: Maximum tokens in LLM response
 * - promptTemplate: Template selection for prompt building
 * - showPrompt: Whether to display prompt details before query
 */

export interface IQuerySettings {
  // Getters
  getTopK(): number;
  getTemperature(): number;
  getMaxTokens(): number;
  getPromptTemplate(): string;
  getShowPrompt(): boolean;

  // Setters
  setTopK(value: number): void;
  setTemperature(value: number): void;
  setMaxTokens(value: number): void;
  setPromptTemplate(template: string): void;
  setShowPrompt(value: boolean): void;

  // Utilities
  resetToDefaults(): void;
  getAllSettings(): QuerySettingsData;
  save(): Promise<void>;
  load(): Promise<void>;
  initialize(): Promise<void>;
}

export interface QuerySettingsData {
  topK: number;
  temperature: number;
  maxTokens: number;
  promptTemplate: string;
  showPrompt: boolean;
}

export const DEFAULT_QUERY_SETTINGS: QuerySettingsData = {
  topK: 3,
  temperature: 0.7,
  maxTokens: 2048,
  promptTemplate: 'default',
  showPrompt: false
};

// Validation ranges
export const QUERY_SETTINGS_CONSTRAINTS = {
  topK: { min: 1, max: 10 },
  temperature: { min: 0.0, max: 2.0 },
  maxTokens: { min: 100, max: 8000 }
} as const;
