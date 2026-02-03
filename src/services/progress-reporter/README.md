# Progress Reporter Service

## Responsibility
Displays progress updates and status messages to the console during long-running operations.

## Public Interface
```typescript
interface IProgressReporter {
  start(totalSteps: number, message: string): void;
  update(currentStep: number, message?: string): void;
  complete(message: string): void;
  error(message: string): void;
}
```

## Models
- None (stateless or minimal internal state)

## Dependencies (Injected)
- None (console output is standard Node.js)

## Usage Example
```typescript
import { createProgressReporter } from './services/progress-reporter';

const reporter = createProgressReporter();

reporter.start(100, "Processing documents...");

for (let i = 0; i < 100; i++) {
  // Do work
  reporter.update(i + 1, `Processing chunk ${i + 1}/100`);
}

reporter.complete("All documents processed successfully!");
```

## Implementation Notes
- Uses console.log for output
- Shows percentage completion
- Updates on same line for cleaner output (optional)
- Color-coded messages: info (blue), success (green), error (red)
- Timestamps can be included (optional)

## Testing Considerations
- Mock console output
- Verify message formatting
- Test percentage calculations
- Validate color codes (if using)
- Test with rapid successive updates
