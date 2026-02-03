import chalk from 'chalk';
import { IProgressReporter } from './IProgressReporter.js';

export class ConsoleProgressReporter implements IProgressReporter {
  start(message: string): void {
    console.log(chalk.blue('▶ ') + chalk.bold(message));
  }

  progress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(current, total);

    const progressMessage = message
      ? `${progressBar} ${percentage}% - ${message}`
      : `${progressBar} ${percentage}% (${current}/${total})`;

    // Use \r to overwrite the current line for a cleaner progress display
    process.stdout.write('\r' + chalk.cyan(progressMessage));

    // Add newline when complete
    if (current === total) {
      console.log();
    }
  }

  success(message: string): void {
    console.log(chalk.green('✓ ') + message);
  }

  error(message: string): void {
    console.error(chalk.red('✗ ') + chalk.red(message));
  }

  info(message: string): void {
    console.log(chalk.gray('ℹ ') + message);
  }

  private createProgressBar(current: number, total: number, length: number = 20): string {
    const filled = Math.round((current / total) * length);
    const empty = length - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }
}
