import { Response } from 'express';
import { IProgressReporter } from '../../services/progress-reporter/IProgressReporter.js';

/**
 * SSE-compatible implementation of IProgressReporter
 * Converts progress reporter method calls to Server-Sent Events
 */
export class SSEProgressReporter implements IProgressReporter {
  private closed = false;

  constructor(private readonly res: Response) {
    // Set SSE headers immediately
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Detect client disconnect
    res.on('close', () => {
      this.closed = true;
    });
  }

  start(message: string): void {
    this.sendEvent({
      type: 'start',
      message,
    });
  }

  progress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const defaultMessage = `Processing ${current}/${total}...`;

    this.sendEvent({
      type: 'progress',
      current,
      total,
      percentage,
      message: message ?? defaultMessage,
    });
  }

  success(message: string): void {
    // Try to extract embedding count from message
    const embeddingMatch = message.match(/(\d+)\s+embedding/i);
    const embeddings = embeddingMatch ? parseInt(embeddingMatch[1]!, 10) : undefined;

    this.sendEvent({
      type: 'complete',
      message,
      ...(embeddings !== undefined && { embeddings }),
    });

    this.close();
  }

  error(message: string): void {
    this.sendEvent({
      type: 'error',
      message,
    });

    this.close();
  }

  info(message: string): void {
    this.sendEvent({
      type: 'info',
      message,
    });
  }

  /**
   * Send an SSE event
   */
  private sendEvent(data: Record<string, unknown>): void {
    if (this.closed) {
      return; // Silently ignore writes after close
    }

    try {
      this.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      // Socket may be destroyed - mark as closed
      this.closed = true;
    }
  }

  /**
   * Close the SSE stream
   */
  private close(): void {
    if (this.closed) {
      return; // Already closed
    }

    this.closed = true;

    try {
      this.res.end();
    } catch (error) {
      // Stream already ended or destroyed - ignore
    }
  }
}

/**
 * Factory function following project export pattern
 */
export function createSSEProgressReporter(res: Response): IProgressReporter {
  return new SSEProgressReporter(res);
}
