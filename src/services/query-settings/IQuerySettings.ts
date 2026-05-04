/**
 * Query Settings Interface
 *
 * Manages runtime query parameters that affect RAG query behavior:
 * - topK: Number of embeddings to retrieve
 * - temperature: LLM temperature for response generation
 * - maxTokens: Maximum tokens in LLM response
 * - promptTemplate: Template selection for prompt building
 * - showPrompt: Whether to display prompt details before query
 * - useHistory: Enable conversation history (multi-turn conversations)
 * - historyWindowSize: Number of turns to keep in sliding window
 * - historyMaxTokens: Token budget for conversation history
 * - maxContextTokens: Total token budget for RAG context + history combined
 */

export interface IQuerySettings {
  // Getters
  getTopK(): number;
  getTemperature(): number;
  getMaxTokens(): number;
  getPromptTemplate(): string;
  getShowPrompt(): boolean;
  getUseHistory(): boolean;
  getHistoryWindowSize(): number;
  getHistoryMaxTokens(): number;
  getMaxContextTokens(): number;

  // Setters
  setTopK(value: number): void;
  setTemperature(value: number): void;
  setMaxTokens(value: number): void;
  setPromptTemplate(template: string): void;
  setShowPrompt(value: boolean): void;
  setUseHistory(value: boolean): void;
  setHistoryWindowSize(value: number): void;
  setHistoryMaxTokens(value: number): void;
  setMaxContextTokens(value: number): void;

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
  useHistory: boolean;
  historyWindowSize: number;
  historyMaxTokens: number;
  maxContextTokens: number;
}

export const DEFAULT_QUERY_SETTINGS: QuerySettingsData = {
  topK: 3,
  temperature: 0.7,
  maxTokens: 2048,
  promptTemplate: 'default',
  showPrompt: false,
  useHistory: false,
  historyWindowSize: 5,
  historyMaxTokens: 2000,
  maxContextTokens: 4000
};

// Validation ranges
export const QUERY_SETTINGS_CONSTRAINTS = {
  topK: { min: 1, max: 10 },
  temperature: { min: 0.0, max: 2.0 },
  maxTokens: { min: 100, max: 8000 },
  historyWindowSize: { min: 1, max: 20 },
  historyMaxTokens: { min: 0, max: 4000 },
  maxContextTokens: { min: 1000, max: 8000 }
} as const;
