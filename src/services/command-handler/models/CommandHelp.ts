/**
 * Help metadata for a command
 */
export interface CommandHelp {
  /** Command name (without leading slash) */
  name: string;
  /** Alternative names/aliases for the command */
  aliases?: string[];
  /** Brief description of what the command does */
  description: string;
  /** Usage pattern (e.g., "/collection <name>") */
  usage?: string;
}
