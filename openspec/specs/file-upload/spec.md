## ADDED Requirements

### Requirement: Multipart file upload handling
The system SHALL accept multipart/form-data requests containing PDF files using the Multer middleware.

#### Scenario: Single file upload
- **WHEN** user uploads a single PDF file
- **THEN** the system SHALL store it in the temporary upload directory
- **AND** make it available to the indexing workflow

#### Scenario: Multiple files upload
- **WHEN** user uploads multiple PDF files in one request
- **THEN** the system SHALL store all files in the temporary upload directory
- **AND** return confirmation for all uploaded files

### Requirement: File type validation
The system SHALL validate that uploaded files are PDF documents before accepting them.

#### Scenario: Valid PDF file
- **WHEN** user uploads a file with .pdf extension and PDF MIME type
- **THEN** the system SHALL accept the file

#### Scenario: Invalid file extension
- **WHEN** user uploads a file without .pdf extension
- **THEN** the system SHALL reject the file with a 400 error
- **AND** return error message "Only PDF files are allowed"

#### Scenario: Invalid MIME type
- **WHEN** user uploads a file with .pdf extension but non-PDF MIME type
- **THEN** the system SHALL reject the file with a 400 error

### Requirement: File size limits
The system SHALL enforce maximum file size limits to prevent resource exhaustion.

#### Scenario: File within size limit
- **WHEN** user uploads a PDF smaller than 50MB
- **THEN** the system SHALL accept the file

#### Scenario: File exceeds size limit
- **WHEN** user uploads a PDF larger than 50MB
- **THEN** the system SHALL reject the upload with a 413 error
- **AND** return error message indicating the size limit

### Requirement: Temporary storage management
The system SHALL store uploaded files in a temporary directory organized by collection name.

#### Scenario: Organize by collection
- **WHEN** files are uploaded for collection "project-a"
- **THEN** the system SHALL store them in `documents/temp-uploads/project-a/`
- **AND** preserve original filenames with timestamp prefix to prevent conflicts

#### Scenario: Cleanup after indexing
- **WHEN** indexing workflow completes successfully
- **THEN** the system SHALL optionally move files from temp to permanent documents directory
- **OR** keep them in temp for manual management

### Requirement: Upload response format
The system SHALL return structured JSON responses for all upload operations.

#### Scenario: Successful upload response
- **WHEN** upload completes successfully
- **THEN** the response SHALL include status 200
- **AND** JSON body with fields: `files` (array of filenames), `count` (number), `message` (string)

#### Scenario: Failed upload response
- **WHEN** upload fails validation
- **THEN** the response SHALL include appropriate 4xx status code
- **AND** JSON body with `error` field containing descriptive message
