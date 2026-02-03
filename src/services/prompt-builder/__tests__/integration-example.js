#!/usr/bin/env node
/**
 * Integration example showing PromptBuilder in a RAG scenario
 * Run after compiling TypeScript with: npm run build
 */

import { createPromptBuilder } from '../../../../dist/services/prompt-builder/index.js';

console.log('='.repeat(80));
console.log('Prompt Builder Service - Integration Example');
console.log('='.repeat(80));
console.log();

const builder = createPromptBuilder();

// Simulate RAG scenario: User asks a question, vector search returns relevant chunks
console.log('Scenario: RAG System answering "What is deep learning?"\n');

const userQuestion = 'What is deep learning?';
const vectorSearchResults = [
  'Deep learning is a subset of machine learning that uses neural networks with multiple layers (deep neural networks) to analyze data.',
  'Deep learning models can automatically learn hierarchical representations of data, making them particularly effective for tasks like image recognition and natural language processing.',
  'Unlike traditional machine learning, deep learning requires large amounts of data and computational power but can achieve superior performance on complex tasks.',
];

console.log('User Question:');
console.log(`  "${userQuestion}"\n`);

console.log('Retrieved Contexts from Vector Search:');
vectorSearchResults.forEach((context, index) => {
  console.log(`  [${index + 1}] ${context}`);
});
console.log();

console.log('Building RAG Prompt...\n');
const prompt = builder.buildPrompt(userQuestion, vectorSearchResults);

console.log('='.repeat(80));
console.log('Generated Prompt for LLM:');
console.log('='.repeat(80));
console.log(prompt);
console.log('='.repeat(80));
console.log();

// Example 2: Handling insufficient context
console.log('\nScenario 2: Question with no relevant context\n');

const question2 = 'What is quantum computing?';
const emptyResults = [];

console.log('User Question:');
console.log(`  "${question2}"\n`);

console.log('Retrieved Contexts:');
console.log('  (No relevant documents found)\n');

const prompt2 = builder.buildPrompt(question2, emptyResults);

console.log('='.repeat(80));
console.log('Generated Prompt for LLM:');
console.log('='.repeat(80));
console.log(prompt2);
console.log('='.repeat(80));
console.log();

// Example 3: Custom template for different use case
console.log('\nScenario 3: Custom template for summarization task\n');

const customTemplate = {
  template: `Summarize the following information to answer the question.

Question: {question}

Information:
{context}

Summary:`,
};

const question3 = 'What are the benefits of machine learning?';
const contexts3 = [
  'Machine learning enables automation of complex tasks without explicit programming.',
  'ML systems can adapt and improve their performance over time as they process more data.',
];

const prompt3 = builder.buildPromptWithTemplate(question3, contexts3, customTemplate);

console.log('Custom Template Used:');
console.log('  "Summarization template"\n');

console.log('='.repeat(80));
console.log('Generated Prompt for LLM:');
console.log('='.repeat(80));
console.log(prompt3);
console.log('='.repeat(80));
console.log();

console.log('✓ Integration examples completed successfully!');
console.log('  This demonstrates how PromptBuilder integrates with:');
console.log('  - Vector search results (as context input)');
console.log('  - LLM client (as prompt output)');
console.log('  - Custom templates for different use cases');
