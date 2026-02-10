/**
 * Represents parsed user input from the chat interface
 */
export interface ParsedInput {
  /** Type of input: command (starts with /) or query (regular question) */
  type: 'command' | 'query';
  /** Command name (for commands only) */
  name?: string;
  /** Command arguments string (for commands only) */
  args?: string;
  /** Full query text (for queries only) */
  text?: string;
}
