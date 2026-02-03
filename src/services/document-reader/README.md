# Document Reader Service

## Responsibility
Reads PDF files from the file system and extracts their text content.

## Public Interface
```typescript
interface IDocumentReader {
  readDocument(filePath: string): Promise<Document>;
  readDocuments(directoryPath: string): Promise<Document[]>;
}
```

## Models
- **Document**: Contains file path, raw text content, and metadata (file name, size, etc.)

## Dependencies (Injected)
- None (this is a leaf service with no injected dependencies)

## Usage Example
```typescript
import { createDocumentReader } from './services/document-reader';

const documentReader = createDocumentReader();
const document = await documentReader.readDocument('./documents/sample.pdf');
console.log(document.content);
```

## Implementation Notes
- Uses a PDF parsing library (e.g., pdf-parse) to extract text
- Handles multi-page PDFs by concatenating all pages
- Preserves basic text structure (paragraphs, line breaks)
- Returns empty content for non-text PDFs (images only)
- Throws error if file doesn't exist or isn't a valid PDF

## Testing Considerations
- Mock file system operations
- Test with various PDF formats
- Test error handling for invalid files
- Verify text extraction accuracy
