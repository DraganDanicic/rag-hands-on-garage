/**
 * Settings validation constraints
 */
export const SETTINGS_CONSTRAINTS = {
  chunkSize: {
    min: 100,
    max: 2000,
    type: 'integer' as const,
    label: 'Chunk size',
  },
  chunkOverlap: {
    min: 0,
    max: null, // Dynamic: must be < chunkSize
    type: 'integer' as const,
    label: 'Chunk overlap',
  },
  topK: {
    min: 1,
    max: 20,
    type: 'integer' as const,
    label: 'Top K',
  },
  temperature: {
    min: 0.0,
    max: 1.0,
    type: 'float' as const,
    label: 'Temperature',
  },
  maxTokens: {
    min: 100,
    max: 8192,
    type: 'integer' as const,
    label: 'Max tokens',
  },
} as const;

/**
 * Validation error for a specific field
 */
export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}

/**
 * Result of settings validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate settings updates
 * @param updates - Partial settings object from request body
 * @param currentSettings - Current configuration (needed for cross-field validation)
 * @returns Validation result with any errors
 */
export function validateSettings(
  updates: Record<string, unknown>,
  currentSettings: { chunkSize: number }
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate chunkSize
  if (updates['chunkSize'] !== undefined) {
    const value = updates['chunkSize'];

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push({
        field: 'chunkSize',
        message: 'Chunk size must be an integer',
        value,
      });
    } else if (value < SETTINGS_CONSTRAINTS.chunkSize.min || value > SETTINGS_CONSTRAINTS.chunkSize.max) {
      errors.push({
        field: 'chunkSize',
        message: `Chunk size must be between ${SETTINGS_CONSTRAINTS.chunkSize.min} and ${SETTINGS_CONSTRAINTS.chunkSize.max}`,
        value,
      });
    }
  }

  // Validate chunkOverlap
  if (updates['chunkOverlap'] !== undefined) {
    const value = updates['chunkOverlap'];
    const effectiveChunkSize = (updates['chunkSize'] as number | undefined) ?? currentSettings.chunkSize;

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push({
        field: 'chunkOverlap',
        message: 'Chunk overlap must be an integer',
        value,
      });
    } else if (value < SETTINGS_CONSTRAINTS.chunkOverlap.min) {
      errors.push({
        field: 'chunkOverlap',
        message: `Chunk overlap must be at least ${SETTINGS_CONSTRAINTS.chunkOverlap.min}`,
        value,
      });
    } else if (value >= effectiveChunkSize) {
      errors.push({
        field: 'chunkOverlap',
        message: `Chunk overlap must be less than chunk size (currently ${effectiveChunkSize})`,
        value,
      });
    }
  }

  // Validate topK
  if (updates['topK'] !== undefined) {
    const value = updates['topK'];

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push({
        field: 'topK',
        message: 'Top K must be an integer',
        value,
      });
    } else if (value < SETTINGS_CONSTRAINTS.topK.min || value > SETTINGS_CONSTRAINTS.topK.max) {
      errors.push({
        field: 'topK',
        message: `Top K must be between ${SETTINGS_CONSTRAINTS.topK.min} and ${SETTINGS_CONSTRAINTS.topK.max}`,
        value,
      });
    }
  }

  // Validate temperature
  if (updates['temperature'] !== undefined) {
    const value = updates['temperature'];

    if (typeof value !== 'number') {
      errors.push({
        field: 'temperature',
        message: 'Temperature must be a number',
        value,
      });
    } else if (value < SETTINGS_CONSTRAINTS.temperature.min || value > SETTINGS_CONSTRAINTS.temperature.max) {
      errors.push({
        field: 'temperature',
        message: `Temperature must be between ${SETTINGS_CONSTRAINTS.temperature.min} and ${SETTINGS_CONSTRAINTS.temperature.max}`,
        value,
      });
    }
  }

  // Validate maxTokens
  if (updates['maxTokens'] !== undefined) {
    const value = updates['maxTokens'];

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push({
        field: 'maxTokens',
        message: 'Max tokens must be an integer',
        value,
      });
    } else if (value < SETTINGS_CONSTRAINTS.maxTokens.min || value > SETTINGS_CONSTRAINTS.maxTokens.max) {
      errors.push({
        field: 'maxTokens',
        message: `Max tokens must be between ${SETTINGS_CONSTRAINTS.maxTokens.min} and ${SETTINGS_CONSTRAINTS.maxTokens.max}`,
        value,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
