/**
 * Estimates token count for text using simple heuristic
 *
 * This is a rough approximation based on GPT tokenization patterns.
 * Real token count may vary by ~20% depending on the actual text.
 *
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  // Simple estimation: ~4 characters per token
  // This works reasonably well for English and most languages
  return Math.ceil(text.length / 4);
}

/**
 * Truncates text to fit within a token limit
 *
 * @param text - Text to truncate
 * @param maxTokens - Maximum number of tokens allowed
 * @returns Truncated text with ellipsis if truncation occurred
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4; // Rough estimation
  if (text.length <= maxChars) {
    return text;
  }
  return text.substring(0, maxChars - 3) + '...';
}
