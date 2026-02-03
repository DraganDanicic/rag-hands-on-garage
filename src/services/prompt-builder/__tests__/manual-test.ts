import { createPromptBuilder } from '../index.js';
import { PromptTemplate } from '../models/PromptTemplate.js';

console.log('Testing PromptBuilder...\n');

const builder = createPromptBuilder();

// Test 1: Basic prompt building with multiple contexts
console.log('Test 1: Multiple contexts');
const question1 = 'What is machine learning?';
const contexts1 = [
  'Machine learning is a subset of AI that enables systems to learn from data.',
  'ML algorithms can identify patterns and make predictions without explicit programming.',
];
const result1 = builder.buildPrompt(question1, contexts1);
console.log(result1);
console.log('\n' + '='.repeat(80) + '\n');

// Test 2: Empty contexts
console.log('Test 2: Empty contexts');
const question2 = 'What is AI?';
const contexts2: string[] = [];
const result2 = builder.buildPrompt(question2, contexts2);
console.log(result2);
console.log('\n' + '='.repeat(80) + '\n');

// Test 3: Custom template
console.log('Test 3: Custom template');
const customTemplate: PromptTemplate = {
  template: 'Question: {question}\n\nContext:\n{context}\n\nAnswer:',
};
const question3 = 'What is AI?';
const contexts3 = ['AI is intelligence demonstrated by machines.'];
const result3 = builder.buildPromptWithTemplate(question3, contexts3, customTemplate);
console.log(result3);
console.log('\n' + '='.repeat(80) + '\n');

// Test 4: Single context
console.log('Test 4: Single context');
const question4 = 'Define neural networks';
const contexts4 = ['Neural networks are computing systems inspired by biological neural networks.'];
const result4 = builder.buildPrompt(question4, contexts4);
console.log(result4);
console.log('\n' + '='.repeat(80) + '\n');

console.log('All manual tests completed successfully!');
