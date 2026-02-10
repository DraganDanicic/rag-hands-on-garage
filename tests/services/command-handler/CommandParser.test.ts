import { describe, it, expect } from '@jest/globals';
import { CommandParser } from '../../../src/services/command-handler/CommandParser.js';

describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser();
  });

  describe('parse', () => {
    it('should parse slash commands without arguments', () => {
      const result = parser.parse('/help');

      expect(result.type).toBe('command');
      expect(result.name).toBe('help');
      expect(result.args).toBe('');
      expect(result.text).toBeUndefined();
    });

    it('should parse slash commands with arguments', () => {
      const result = parser.parse('/collection project-a');

      expect(result.type).toBe('command');
      expect(result.name).toBe('collection');
      expect(result.args).toBe('project-a');
      expect(result.text).toBeUndefined();
    });

    it('should parse commands with multiple word arguments', () => {
      const result = parser.parse('/collection my test collection');

      expect(result.type).toBe('command');
      expect(result.name).toBe('collection');
      expect(result.args).toBe('my test collection');
    });

    it('should parse commands with hyphens in name', () => {
      const result = parser.parse('/dry-run');

      expect(result.type).toBe('command');
      expect(result.name).toBe('dry-run');
      expect(result.args).toBe('');
    });

    it('should handle extra whitespace around commands', () => {
      const result = parser.parse('  /help  ');

      expect(result.type).toBe('command');
      expect(result.name).toBe('help');
      expect(result.args).toBe('');
    });

    it('should handle extra whitespace in arguments', () => {
      const result = parser.parse('/collection   project-a  ');

      expect(result.type).toBe('command');
      expect(result.name).toBe('collection');
      expect(result.args).toBe('project-a');
    });

    it('should parse regular queries as query type', () => {
      const result = parser.parse('What is the capital of France?');

      expect(result.type).toBe('query');
      expect(result.text).toBe('What is the capital of France?');
      expect(result.name).toBeUndefined();
      expect(result.args).toBeUndefined();
    });

    it('should parse queries that contain forward slashes', () => {
      const result = parser.parse('What is the URL http://example.com/test?');

      expect(result.type).toBe('query');
      expect(result.text).toBe('What is the URL http://example.com/test?');
    });

    it('should not parse slash in middle of text as command', () => {
      const result = parser.parse('This is a test/example');

      expect(result.type).toBe('query');
      expect(result.text).toBe('This is a test/example');
    });

    it('should handle empty input as query', () => {
      const result = parser.parse('');

      expect(result.type).toBe('query');
      expect(result.text).toBe('');
    });

    it('should handle single slash as query', () => {
      const result = parser.parse('/');

      expect(result.type).toBe('query');
      expect(result.text).toBe('/');
    });

    it('should not parse commands with uppercase letters', () => {
      const result = parser.parse('/Help');

      expect(result.type).toBe('query');
      expect(result.text).toBe('/Help');
    });

    it('should not parse commands with numbers', () => {
      const result = parser.parse('/help123');

      expect(result.type).toBe('query');
      expect(result.text).toBe('/help123');
    });
  });
});
