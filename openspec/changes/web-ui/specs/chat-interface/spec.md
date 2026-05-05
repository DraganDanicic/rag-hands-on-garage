## ADDED Requirements

### Requirement: Chat message display
The system SHALL display a scrollable chat history showing user questions and assistant responses.

#### Scenario: Display conversation history
- **WHEN** user views the chat interface
- **THEN** the interface SHALL show all previous messages in chronological order
- **AND** distinguish between user messages and assistant responses with different styling

#### Scenario: Auto-scroll to latest message
- **WHEN** a new message is added to the conversation
- **THEN** the interface SHALL automatically scroll to show the latest message

### Requirement: Question input and submission
The system SHALL provide a text input field for users to enter questions and submit them to the backend.

#### Scenario: Submit question via button
- **WHEN** user types a question and clicks the "Send" button
- **THEN** the interface SHALL send a POST request to `/api/collections/:name/query`
- **AND** display the user's question in the chat immediately
- **AND** show a loading indicator while waiting for response

#### Scenario: Submit question via Enter key
- **WHEN** user types a question and presses Enter
- **THEN** the interface SHALL submit the question
- **AND** behave identically to clicking the Send button

#### Scenario: Prevent empty submissions
- **WHEN** user attempts to submit an empty question
- **THEN** the interface SHALL prevent submission and keep the input focused

### Requirement: Response rendering
The system SHALL display assistant responses with proper formatting and styling.

#### Scenario: Display text response
- **WHEN** the backend returns a text response
- **THEN** the interface SHALL display it in the chat as an assistant message
- **AND** preserve line breaks and formatting from the response

#### Scenario: Handle markdown in responses
- **WHEN** the response contains markdown formatting
- **THEN** the interface SHALL render it as plain text (no markdown parsing required in MVP)

### Requirement: Loading states
The system SHALL provide visual feedback during query processing.

#### Scenario: Show loading indicator
- **WHEN** a query is sent to the backend
- **THEN** the interface SHALL display a loading indicator or "thinking..." message
- **AND** disable the input field to prevent duplicate submissions

#### Scenario: Hide loading on response
- **WHEN** the backend returns a response or error
- **THEN** the interface SHALL hide the loading indicator
- **AND** re-enable the input field

### Requirement: Error handling
The system SHALL display user-friendly error messages when queries fail.

#### Scenario: Display API error
- **WHEN** the backend returns an error response (4xx or 5xx)
- **THEN** the interface SHALL display the error message in the chat
- **AND** style it distinctly from normal messages

#### Scenario: Network error
- **WHEN** the API request fails due to network issues
- **THEN** the interface SHALL display "Connection error. Please try again."
- **AND** allow the user to retry

### Requirement: Collection context display
The system SHALL indicate which collection is currently being queried.

#### Scenario: Show active collection
- **WHEN** user views the chat interface
- **THEN** the interface SHALL display the name of the active collection
- **AND** update it when the collection is switched

### Requirement: Clear conversation action
The system SHALL provide a button to clear the current conversation history.

#### Scenario: Clear conversation
- **WHEN** user clicks "Clear Conversation" button
- **THEN** the interface SHALL remove all messages from the display
- **AND** reset the conversation state on the backend (if conversation history is enabled)
