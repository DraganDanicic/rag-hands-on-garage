#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { chatCommand } from './commands/chat.js';
import { collectionsCommand } from './commands/collections.js';
import { configCommand } from './commands/config.js';
import { statusCommand } from './commands/status.js';
import { documentsCommand } from './commands/documents.js';

const program = new Command();

program
  .name('rag-garage')
  .description('RAG system for querying PDF documents')
  .version('1.2.0');

// Add all commands
program.addCommand(generateCommand);
program.addCommand(chatCommand);
program.addCommand(collectionsCommand);
program.addCommand(configCommand);
program.addCommand(statusCommand);
program.addCommand(documentsCommand);

// Parse command line arguments
program.parse();
