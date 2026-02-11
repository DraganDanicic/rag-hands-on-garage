import { IErrorHandler } from './IErrorHandler.js';
import { ErrorGuidance } from './models/ErrorGuidance.js';

/**
 * Error pattern definition
 */
interface ErrorPattern {
  pattern: RegExp;
  title: string;
  message: string;
  tips: string[];
  suggestedCommands?: string[];
}

/**
 * Error handler implementation
 * Uses pattern matching to provide context-specific error guidance
 */
export class ErrorHandler implements IErrorHandler {
  private readonly patterns: ErrorPattern[] = [
    // API Key Issues
    {
      pattern: /LLM_FARM_API_KEY.*not set|API key is required|Required environment variable/i,
      title: 'Missing API Key',
      message: 'The LLM Farm API key is not configured.',
      tips: [
        '1. Create a .env file if it doesn\'t exist: cp .env.example .env',
        '2. Add your LLM Farm API key: LLM_FARM_API_KEY=your_key_here',
        '3. Get an API key from: https://aoai-farm.bosch-temp.com',
        '4. Restart your application after updating .env'
      ],
      suggestedCommands: ['rag-garage config validate']
    },

    // Authentication Errors
    {
      pattern: /401|403|Invalid.*API key|Unauthorized|Forbidden/i,
      title: 'API Authentication Failed',
      message: 'Your API key is invalid or has expired.',
      tips: [
        '1. Check that your API key is correct in .env file',
        '2. Verify the key hasn\'t expired',
        '3. Request a new API key if needed: https://aoai-farm.bosch-temp.com',
        '4. Ensure there are no extra spaces or quotes in .env'
      ],
      suggestedCommands: ['rag-garage config show']
    },

    // Rate Limiting
    {
      pattern: /429|rate limit|too many requests/i,
      title: 'API Rate Limit Exceeded',
      message: 'You\'ve hit the API rate limit.',
      tips: [
        '1. Wait a few minutes before retrying',
        '2. LLM Farm has a 6M token/month limit',
        '3. Reduce CHECKPOINT_INTERVAL to save progress more frequently',
        '4. Consider processing documents in smaller batches'
      ],
      suggestedCommands: ['rag-garage config show']
    },

    // Network Connectivity
    {
      pattern: /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|network|connect/i,
      title: 'Network Connectivity Issue',
      message: 'Unable to connect to the API server.',
      tips: [
        '1. Check your internet connection',
        '2. If behind a corporate proxy, enable it in .env:',
        '   PROXY_ENABLED=true',
        '   PROXY_HOST=127.0.0.1',
        '   PROXY_PORT=3128',
        '3. Test connectivity: rag-garage status',
        '4. Check if firewall is blocking the connection'
      ],
      suggestedCommands: ['rag-garage status', 'rag-garage config validate']
    },

    // Proxy Issues
    {
      pattern: /proxy|ECONNRESET.*tunnel/i,
      title: 'Proxy Connection Issue',
      message: 'Proxy configuration may be incorrect.',
      tips: [
        '1. Verify proxy is running: Check localhost:3128',
        '2. Ensure proxy settings in .env are correct:',
        '   PROXY_ENABLED=true',
        '   PROXY_HOST=127.0.0.1',
        '   PROXY_PORT=3128',
        '3. Try disabling proxy if not needed: PROXY_ENABLED=false',
        '4. Restart proxy service if available'
      ],
      suggestedCommands: ['rag-garage config show']
    },

    // No Embeddings Found
    {
      pattern: /No embeddings found|embeddings.*not found|No relevant context/i,
      title: 'No Embeddings Available',
      message: 'The collection has no embeddings to search.',
      tips: [
        '1. Generate embeddings first: rag-garage generate',
        '2. Check collection exists: rag-garage collections list',
        '3. Verify documents are in the documents/ folder',
        '4. Ensure collection name is correct'
      ],
      suggestedCommands: [
        'rag-garage collections list',
        'rag-garage generate --collection <name>'
      ]
    },

    // No Documents Found
    {
      pattern: /No documents found|no.*PDF.*found|No supported documents/i,
      title: 'No Documents to Process',
      message: 'No supported documents found in the documents directory.',
      tips: [
        '1. Add PDF, TXT, or MD files to the documents/ folder',
        '2. Verify the DOCUMENTS_PATH in .env is correct',
        '3. Ensure files have .pdf, .txt, or .md extension (case-insensitive)',
        '4. Check file permissions'
      ],
      suggestedCommands: ['rag-garage config show']
    },

    // File Permission Errors
    {
      pattern: /EACCES|permission denied|EPERM/i,
      title: 'File Permission Error',
      message: 'The application doesn\'t have permission to access a file or directory.',
      tips: [
        '1. Check file/folder permissions',
        '2. Ensure the application can read from documents/',
        '3. Ensure the application can write to data/',
        '4. On Unix: chmod -R 755 documents/ data/'
      ],
      suggestedCommands: []
    },

    // Template Errors
    {
      pattern: /template.*not found|Missing required placeholders|Invalid template/i,
      title: 'Prompt Template Error',
      message: 'There\'s an issue with the prompt template configuration.',
      tips: [
        '1. Check PROMPT_TEMPLATE or PROMPT_TEMPLATE_PATH in .env',
        '2. If using custom template, ensure file exists',
        '3. Templates must contain {context} and {question} placeholders',
        '4. Use built-in templates: default, concise, detailed, technical'
      ],
      suggestedCommands: ['rag-garage config validate']
    },

    // Collection Not Found
    {
      pattern: /Collection.*not found/i,
      title: 'Collection Not Found',
      message: 'The specified collection doesn\'t exist.',
      tips: [
        '1. List available collections: rag-garage collections list',
        '2. Create collection: rag-garage generate --collection <name>',
        '3. Check for typos in collection name',
        '4. Collection names are case-sensitive'
      ],
      suggestedCommands: ['rag-garage collections list']
    },

    // Invalid Configuration
    {
      pattern: /Invalid.*value|out of range|must be.*between/i,
      title: 'Invalid Configuration',
      message: 'One or more configuration values are invalid.',
      tips: [
        '1. Validate configuration: rag-garage config validate',
        '2. Check .env for invalid numeric values',
        '3. Refer to .env.example for valid ranges',
        '4. Common issues:',
        '   - LLM_TEMPERATURE must be between 0.0 and 2.0',
        '   - CHUNK_SIZE should be 100-5000',
        '   - TOP_K should be 1-20'
      ],
      suggestedCommands: ['rag-garage config validate', 'rag-garage config show']
    },

    // Timeout Errors
    {
      pattern: /timeout|timed out|ETIMEDOUT/i,
      title: 'API Timeout',
      message: 'The API request took too long to complete.',
      tips: [
        '1. Increase timeout values in .env:',
        '   EMBEDDING_API_TIMEOUT_MS=60000',
        '   LLM_API_TIMEOUT_MS=120000',
        '2. Check network connection speed',
        '3. Try again - API might be temporarily slow',
        '4. Consider reducing request size'
      ],
      suggestedCommands: ['rag-garage config show']
    },

    // Disk Space
    {
      pattern: /ENOSPC|no space left|disk full/i,
      title: 'Disk Space Error',
      message: 'No space left on disk.',
      tips: [
        '1. Free up disk space',
        '2. Delete old collections: rag-garage collections delete <name>',
        '3. Check data/ folder size',
        '4. Move large files elsewhere'
      ],
      suggestedCommands: ['rag-garage collections list']
    },

    // JSON Parse Errors
    {
      pattern: /JSON|parse|Unexpected token|Unexpected end/i,
      title: 'Data Corruption',
      message: 'A data file may be corrupted.',
      tips: [
        '1. The embeddings or chunks file may be corrupted',
        '2. Delete and regenerate the collection:',
        '   rag-garage collections delete <name>',
        '   rag-garage generate --collection <name>',
        '3. Check disk space and file permissions',
        '4. Restore from backup if available'
      ],
      suggestedCommands: ['rag-garage collections list']
    },

    // PDF Parse Errors
    {
      pattern: /PDF|parse.*fail|Invalid PDF/i,
      title: 'PDF Processing Error',
      message: 'Failed to process one or more PDF files.',
      tips: [
        '1. Ensure PDF files are not corrupted',
        '2. Check if PDFs are password-protected (not supported)',
        '3. Try opening PDFs in a PDF reader to verify validity',
        '4. Convert problematic PDFs to a different format and back',
        '5. Remove problematic files and retry'
      ],
      suggestedCommands: []
    },

    // Generic API Errors
    {
      pattern: /API error|server error|5\d{2}/i,
      title: 'API Server Error',
      message: 'The API server encountered an error.',
      tips: [
        '1. Wait a few minutes and retry',
        '2. The LLM Farm API might be temporarily unavailable',
        '3. Check API status at: https://aoai-farm.bosch-temp.com',
        '4. If persists, contact API support'
      ],
      suggestedCommands: ['rag-garage status']
    }
  ];

  getGuidance(error: Error | unknown): ErrorGuidance {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    const fullError = `${errorMessage}\n${errorStack}`;

    // Try to match against known patterns
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(fullError)) {
        return {
          title: pattern.title,
          message: pattern.message,
          tips: pattern.tips,
          suggestedCommands: pattern.suggestedCommands
        };
      }
    }

    // Fallback for unknown errors
    return {
      title: 'Unexpected Error',
      message: errorMessage,
      tips: [
        '1. Check the error message above for details',
        '2. Validate your configuration: rag-garage config validate',
        '3. Check system status: rag-garage status',
        '4. Review logs for more information',
        '5. If issue persists, check documentation or seek support'
      ],
      suggestedCommands: ['rag-garage config validate', 'rag-garage status']
    };
  }

  formatGuidance(guidance: ErrorGuidance): string {
    let output = `\n${guidance.title}\n`;
    output += `${guidance.message}\n\n`;

    if (guidance.tips.length > 0) {
      output += 'Troubleshooting:\n';
      for (const tip of guidance.tips) {
        output += `  ${tip}\n`;
      }
    }

    if (guidance.suggestedCommands && guidance.suggestedCommands.length > 0) {
      output += '\nSuggested commands:\n';
      for (const cmd of guidance.suggestedCommands) {
        output += `  $ ${cmd}\n`;
      }
    }

    return output;
  }
}
