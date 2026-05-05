## ADDED Requirements

### Requirement: Display collections list
The system SHALL display all available collections with their metadata in a selectable list.

#### Scenario: Load collections on page load
- **WHEN** the web UI loads
- **THEN** the interface SHALL fetch collections from `/api/collections`
- **AND** display each collection with name, embedding count, and chunk count

#### Scenario: Empty collections list
- **WHEN** no collections exist
- **THEN** the interface SHALL display a message "No collections yet. Upload documents to create one."

### Requirement: Active collection selection
The system SHALL allow users to select which collection to use for queries and indexing.

#### Scenario: Switch active collection
- **WHEN** user clicks on a different collection in the list
- **THEN** the interface SHALL update the active collection
- **AND** update all API calls to use the selected collection name
- **AND** highlight the selected collection in the list

#### Scenario: Persist selection
- **WHEN** user switches collection
- **THEN** the interface SHALL store the selection in browser localStorage
- **AND** restore it on next page load

### Requirement: Collection metadata display
The system SHALL show relevant statistics for each collection.

#### Scenario: Display embedding count
- **WHEN** collections are loaded
- **THEN** each collection SHALL display the number of embeddings it contains

#### Scenario: Display chunk count
- **WHEN** collections are loaded
- **THEN** each collection SHALL display the number of text chunks indexed

#### Scenario: Display file size
- **WHEN** collections are loaded
- **THEN** each collection SHALL display the total size of its embedding and chunk files

### Requirement: Delete collection action
The system SHALL allow users to delete collections with confirmation.

#### Scenario: Delete with confirmation
- **WHEN** user clicks delete icon for a collection
- **THEN** the interface SHALL show a confirmation dialog "Delete collection 'project-a'? This cannot be undone."
- **AND** only delete if user confirms

#### Scenario: Successful deletion
- **WHEN** user confirms deletion
- **THEN** the interface SHALL send DELETE request to `/api/collections/:name`
- **AND** remove the collection from the list on success
- **AND** show success message "Collection deleted"

#### Scenario: Prevent deleting active collection
- **WHEN** user attempts to delete the currently active collection
- **THEN** the interface SHALL show error "Cannot delete active collection. Switch to another collection first."

### Requirement: Refresh collections action
The system SHALL provide a way to reload the collections list to reflect external changes.

#### Scenario: Manual refresh
- **WHEN** user clicks the refresh button
- **THEN** the interface SHALL re-fetch the collections list from the API
- **AND** update the display with current data

#### Scenario: Auto-refresh after indexing
- **WHEN** indexing workflow completes
- **THEN** the interface SHALL automatically refresh the collections list
- **AND** update embedding/chunk counts for the affected collection

### Requirement: Create new collection workflow
The system SHALL guide users to create new collections by uploading documents.

#### Scenario: Create collection via upload
- **WHEN** user uploads files and specifies a new collection name
- **THEN** the system SHALL create the collection implicitly
- **AND** add it to the collections list after successful indexing
