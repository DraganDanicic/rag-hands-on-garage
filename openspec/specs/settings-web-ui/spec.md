## ADDED Requirements

### Requirement: Display current settings
The system SHALL display all configurable parameters with their current values.

#### Scenario: Load settings on page open
- **WHEN** user opens the settings panel
- **THEN** the interface SHALL fetch current settings from `/api/settings`
- **AND** display chunk size, chunk overlap, topK, temperature, and max tokens

### Requirement: Chunk size configuration
The system SHALL allow users to modify the chunk size used during document indexing.

#### Scenario: Update chunk size
- **WHEN** user changes the chunk size value and saves
- **THEN** the interface SHALL send PUT request to `/api/settings` with new value
- **AND** show success message "Settings updated"

#### Scenario: Validate chunk size range
- **WHEN** user enters a chunk size outside the valid range (100-2000)
- **THEN** the interface SHALL display a validation error
- **AND** prevent saving until value is corrected

### Requirement: Chunk overlap configuration
The system SHALL allow users to modify the chunk overlap.

#### Scenario: Update chunk overlap
- **WHEN** user changes the chunk overlap value and saves
- **THEN** the interface SHALL update the configuration
- **AND** validate that overlap is less than chunk size

#### Scenario: Overlap validation
- **WHEN** overlap value is greater than or equal to chunk size
- **THEN** the interface SHALL display error "Overlap must be less than chunk size"

### Requirement: Query parameter configuration
The system SHALL allow users to adjust query-time parameters (topK, temperature, max tokens).

#### Scenario: Update topK
- **WHEN** user changes the topK value
- **THEN** subsequent queries SHALL use the new topK value for retrieval

#### Scenario: Update temperature
- **WHEN** user changes the temperature slider (0.0 to 1.0)
- **THEN** subsequent queries SHALL use the new temperature for LLM generation

#### Scenario: Update max tokens
- **WHEN** user changes max tokens value
- **THEN** subsequent queries SHALL limit LLM responses to the specified token count

### Requirement: Settings persistence
The system SHALL save settings changes and apply them to future operations.

#### Scenario: Persist to configuration
- **WHEN** user saves settings
- **THEN** the system SHALL update the ConfigService or settings file
- **AND** apply changes to new DI container instances

#### Scenario: Collection-specific settings
- **WHEN** settings are changed while a specific collection is active
- **THEN** the system SHALL optionally allow per-collection settings
- **OR** apply globally to all collections (implementation choice)

### Requirement: Reset to defaults
The system SHALL provide a way to restore default configuration values.

#### Scenario: Reset all settings
- **WHEN** user clicks "Reset to Defaults" button
- **THEN** the interface SHALL restore all settings to their original values from `.env.example`
- **AND** display confirmation "Settings reset to defaults"

### Requirement: Settings validation feedback
The system SHALL provide immediate validation feedback as users edit settings.

#### Scenario: Real-time validation
- **WHEN** user modifies a setting value
- **THEN** the interface SHALL validate it in real-time
- **AND** display inline error messages for invalid values
- **AND** disable the Save button until all values are valid

### Requirement: Settings help text
The system SHALL display helpful descriptions for each setting to guide users.

#### Scenario: Show setting descriptions
- **WHEN** user views the settings panel
- **THEN** each setting SHALL include a brief description of what it controls
- **AND** recommended values or ranges where applicable
