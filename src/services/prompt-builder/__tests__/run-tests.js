#!/usr/bin/env node
/**
 * Test runner for PromptBuilder service
 * Run after compiling TypeScript with: npm run build
 * Usage: node src/services/prompt-builder/__tests__/run-tests.js
 */

import { createPromptBuilder } from '../../../../dist/services/prompt-builder/index.js';
import assert from 'node:assert';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

console.log('Running PromptBuilder Tests...\n');

const builder = createPromptBuilder();

// Test 1: Build prompt with multiple contexts
test('should build prompt with multiple contexts', () => {
  const question = 'What is machine learning?';
  const contexts = [
    'Machine learning is a subset of AI.',
    'ML algorithms learn from data.',
  ];
  const result = builder.buildPrompt(question, contexts);

  assert.ok(result.includes(question), 'Should include question');
  assert.ok(result.includes('[1] Machine learning'), 'Should include first context with [1]');
  assert.ok(result.includes('[2] ML algorithms'), 'Should include second context with [2]');
  assert.ok(result.includes('Context:'), 'Should include Context section');
});

// Test 2: Handle empty contexts
test('should handle empty contexts array', () => {
  const question = 'What is AI?';
  const contexts = [];
  const result = builder.buildPrompt(question, contexts);

  assert.ok(result.includes('No context available'), 'Should show no context message');
  assert.ok(result.includes(question), 'Should include question');
});

// Test 3: Handle single context
test('should handle single context', () => {
  const question = 'What is AI?';
  const contexts = ['Artificial Intelligence is the simulation of human intelligence.'];
  const result = builder.buildPrompt(question, contexts);

  assert.ok(result.includes('[1] Artificial Intelligence'), 'Should number single context as [1]');
  assert.ok(result.includes(question), 'Should include question');
});

// Test 4: Number contexts sequentially
test('should number contexts sequentially', () => {
  const question = 'Test?';
  const contexts = ['First', 'Second', 'Third', 'Fourth'];
  const result = builder.buildPrompt(question, contexts);

  assert.ok(result.includes('[1] First'), 'Should have [1]');
  assert.ok(result.includes('[2] Second'), 'Should have [2]');
  assert.ok(result.includes('[3] Third'), 'Should have [3]');
  assert.ok(result.includes('[4] Fourth'), 'Should have [4]');
});

// Test 5: Use custom template
test('should use custom template', () => {
  const customTemplate = {
    template: 'Q: {question}\nC: {context}\nA:',
  };
  const question = 'What is AI?';
  const contexts = ['AI is intelligence by machines.'];
  const result = builder.buildPromptWithTemplate(question, contexts, customTemplate);

  assert.ok(result.includes('Q: What is AI?'), 'Should use custom question format');
  assert.ok(result.includes('C: [1] AI is intelligence'), 'Should use custom context format');
  assert.ok(result.includes('A:'), 'Should include answer section');
  assert.ok(!result.includes('Instructions:'), 'Should not include default template');
});

// Test 6: Replace all placeholders in custom template
test('should replace all placeholders in custom template', () => {
  const customTemplate = {
    template: 'Question: {question}\n\nContext:\n{context}\n\nPlease answer: {question}',
  };
  const question = 'Test question';
  const contexts = ['Test context'];
  const result = builder.buildPromptWithTemplate(question, contexts, customTemplate);

  const questionCount = (result.match(/Test question/g) || []).length;
  assert.strictEqual(questionCount, 2, 'Should replace all {question} placeholders');
  assert.ok(result.includes('[1] Test context'), 'Should replace {context}');
});

// Test 7: Separate contexts with double newlines
test('should separate multiple contexts with double newlines', () => {
  const question = 'Test?';
  const contexts = ['First context', 'Second context'];
  const result = builder.buildPrompt(question, contexts);

  assert.ok(result.includes('[1] First context\n\n[2] Second context'), 'Should separate with \\n\\n');
});

// Test 8: Preserve special characters
test('should preserve context text exactly', () => {
  const question = 'Test?';
  const contexts = ['Context with @#$%', 'Context with\nnewlines'];
  const result = builder.buildPrompt(question, contexts);

  assert.ok(result.includes('@#$%'), 'Should preserve special chars');
  assert.ok(result.includes('newlines'), 'Should preserve formatting');
});

// Test 9: Handle empty question
test('should handle empty question string', () => {
  const question = '';
  const contexts = ['Context'];
  const result = builder.buildPrompt(question, contexts);

  assert.ok(result.includes('Context:'), 'Should include structure');
  assert.ok(result.includes('[1] Context'), 'Should include context');
});

// Test 10: Handle empty contexts with custom template
test('should handle empty contexts with custom template', () => {
  const customTemplate = {
    template: 'Question: {question}\nContext: {context}',
  };
  const question = 'Test';
  const contexts = [];
  const result = builder.buildPromptWithTemplate(question, contexts, customTemplate);

  assert.ok(result.includes('No context available'), 'Should handle empty contexts');
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✓ All tests passed!');
