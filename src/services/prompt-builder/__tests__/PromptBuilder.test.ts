import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createPromptBuilder } from '../index.js';
import { PromptTemplate } from '../models/PromptTemplate.js';

describe('PromptBuilder', () => {
  describe('buildPrompt', () => {
    it('should build a prompt with multiple contexts', () => {
      const builder = createPromptBuilder();
      const question = 'What is machine learning?';
      const contexts = [
        'Machine learning is a subset of AI that enables systems to learn from data.',
        'ML algorithms can identify patterns and make predictions without explicit programming.',
      ];

      const result = builder.buildPrompt(question, contexts);

      // Verify question is included
      assert.ok(result.includes(question), 'Result should include the question');

      // Verify contexts are numbered correctly
      assert.ok(result.includes('[1] Machine learning is a subset'), 'Should include first context with [1]');
      assert.ok(result.includes('[2] ML algorithms can identify'), 'Should include second context with [2]');

      // Verify structure includes instructions
      assert.ok(result.includes('Context:'), 'Should include Context section');
      assert.ok(result.includes('Instructions:'), 'Should include Instructions section');
      assert.ok(result.includes('Question:'), 'Should include Question section');
    });

    it('should handle empty contexts array', () => {
      const builder = createPromptBuilder();
      const question = 'What is machine learning?';
      const contexts: string[] = [];

      const result = builder.buildPrompt(question, contexts);

      // Verify it handles empty contexts gracefully
      assert.ok(result.includes('No context available'), 'Should indicate no context available');
      assert.ok(result.includes(question), 'Should still include the question');
    });

    it('should handle single context', () => {
      const builder = createPromptBuilder();
      const question = 'What is AI?';
      const contexts = ['Artificial Intelligence is the simulation of human intelligence.'];

      const result = builder.buildPrompt(question, contexts);

      assert.ok(result.includes('[1] Artificial Intelligence'), 'Should number single context as [1]');
      assert.ok(result.includes(question), 'Should include the question');
    });

    it('should preserve context text exactly', () => {
      const builder = createPromptBuilder();
      const question = 'Test question?';
      const contexts = [
        'Context with special characters: @#$%',
        'Context with newlines\nand tabs\there',
      ];

      const result = builder.buildPrompt(question, contexts);

      assert.ok(result.includes('@#$%'), 'Should preserve special characters');
      assert.ok(result.includes('newlines\nand tabs\there'), 'Should preserve formatting');
    });

    it('should number contexts sequentially', () => {
      const builder = createPromptBuilder();
      const question = 'Test?';
      const contexts = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

      const result = builder.buildPrompt(question, contexts);

      assert.ok(result.includes('[1] First'), 'Should have [1]');
      assert.ok(result.includes('[2] Second'), 'Should have [2]');
      assert.ok(result.includes('[3] Third'), 'Should have [3]');
      assert.ok(result.includes('[4] Fourth'), 'Should have [4]');
      assert.ok(result.includes('[5] Fifth'), 'Should have [5]');
    });
  });

  describe('buildPromptWithTemplate', () => {
    it('should use custom template', () => {
      const builder = createPromptBuilder();
      const customTemplate: PromptTemplate = {
        template: 'Q: {question}\nC: {context}\nA:',
      };
      const question = 'What is AI?';
      const contexts = ['AI is intelligence demonstrated by machines.'];

      const result = builder.buildPromptWithTemplate(question, contexts, customTemplate);

      assert.ok(result.includes('Q: What is AI?'), 'Should use custom question format');
      assert.ok(result.includes('C: [1] AI is intelligence'), 'Should use custom context format');
      assert.ok(result.includes('A:'), 'Should include answer section from template');
      assert.ok(!result.includes('Instructions:'), 'Should not include default template instructions');
    });

    it('should replace all placeholders in custom template', () => {
      const builder = createPromptBuilder();
      const customTemplate: PromptTemplate = {
        template: 'Question: {question}\n\nContext:\n{context}\n\nPlease answer: {question}',
      };
      const question = 'Test question';
      const contexts = ['Test context'];

      const result = builder.buildPromptWithTemplate(question, contexts, customTemplate);

      // Count occurrences of the question (should appear twice)
      const questionCount = (result.match(/Test question/g) || []).length;
      assert.strictEqual(questionCount, 2, 'Should replace all {question} placeholders');

      // Verify context is replaced
      assert.ok(result.includes('[1] Test context'), 'Should replace {context} placeholder');
    });

    it('should handle empty contexts with custom template', () => {
      const builder = createPromptBuilder();
      const customTemplate: PromptTemplate = {
        template: 'Question: {question}\nContext: {context}',
      };
      const question = 'Test';
      const contexts: string[] = [];

      const result = builder.buildPromptWithTemplate(question, contexts, customTemplate);

      assert.ok(result.includes('No context available'), 'Should handle empty contexts in custom template');
    });

    it('should work with template containing no placeholders', () => {
      const builder = createPromptBuilder();
      const customTemplate: PromptTemplate = {
        template: 'Static template with no placeholders',
      };
      const question = 'Test';
      const contexts = ['Context'];

      const result = builder.buildPromptWithTemplate(question, contexts, customTemplate);

      assert.strictEqual(result, 'Static template with no placeholders', 'Should return template as-is');
    });
  });

  describe('context formatting', () => {
    it('should separate multiple contexts with double newlines', () => {
      const builder = createPromptBuilder();
      const question = 'Test?';
      const contexts = ['First context', 'Second context', 'Third context'];

      const result = builder.buildPrompt(question, contexts);

      // Check for double newlines between contexts
      assert.ok(result.includes('[1] First context\n\n[2] Second context'), 'Should separate contexts with \\n\\n');
      assert.ok(result.includes('[2] Second context\n\n[3] Third context'), 'Should separate all contexts with \\n\\n');
    });

    it('should handle contexts with varying lengths', () => {
      const builder = createPromptBuilder();
      const question = 'Test?';
      const contexts = [
        'Short',
        'This is a much longer context with multiple sentences. It should still be numbered correctly and formatted properly.',
        'Medium length context here',
      ];

      const result = builder.buildPrompt(question, contexts);

      assert.ok(result.includes('[1] Short'), 'Should handle short context');
      assert.ok(result.includes('[2] This is a much longer context'), 'Should handle long context');
      assert.ok(result.includes('[3] Medium length context'), 'Should handle medium context');
    });
  });

  describe('edge cases', () => {
    it('should handle question with special characters', () => {
      const builder = createPromptBuilder();
      const question = 'What is "AI" & how does it work?';
      const contexts = ['AI explanation'];

      const result = builder.buildPrompt(question, contexts);

      assert.ok(result.includes('What is "AI" & how does it work?'), 'Should preserve question special characters');
    });

    it('should handle empty question string', () => {
      const builder = createPromptBuilder();
      const question = '';
      const contexts = ['Context'];

      const result = builder.buildPrompt(question, contexts);

      // Should still build a valid prompt structure
      assert.ok(result.includes('Context:'), 'Should include structure even with empty question');
      assert.ok(result.includes('[1] Context'), 'Should include context');
    });

    it('should handle whitespace-only contexts', () => {
      const builder = createPromptBuilder();
      const question = 'Test?';
      const contexts = ['   ', '\t\t', '\n\n'];

      const result = builder.buildPrompt(question, contexts);

      // Should number them but preserve the whitespace
      assert.ok(result.includes('[1]'), 'Should number first context');
      assert.ok(result.includes('[2]'), 'Should number second context');
      assert.ok(result.includes('[3]'), 'Should number third context');
    });
  });
});
