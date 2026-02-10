import type { ParsedInput } from './models/ParsedInput.js';

/**
 * Parses user input to detect slash commands vs regular queries
 */
export class CommandParser {
  private readonly commandPattern = /^\/([a-z-]+)(?:\s+(.+))?$/;

  /**
   * Parse user input into a command or query
   *
   * @param input - Raw user input from chat
   * @returns Parsed input object
   */
  parse(input: string): ParsedInput {
    const trimmed = input.trim();

    // Check if it's a command (starts with /)
    const match = this.commandPattern.exec(trimmed);

    if (match) {
      return {
        type: 'command',
        name: match[1],
        args: match[2] || '',
      };
    }

    // Otherwise it's a regular query
    return {
      type: 'query',
      text: trimmed,
    };
  }
}
