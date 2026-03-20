# Play Console Data Safety - Filled Guidance

Use this as your declaration guide in Play Console.

## High-Level Answers
- Does your app collect or share any required user data types?
  - Yes, optional user-provided data can be transmitted to third-party services when the user explicitly enables AI/media features.
- Is all data encrypted in transit?
  - Yes (HTTPS API calls).
- Can users request data deletion?
  - Yes. Users can clear in-app data or uninstall the app.

## Data Types and Handling

### Personal Info
- Name
  - Collected: Yes (entered by user)
  - Shared: No
  - Purpose: App functionality (account profile in app)
  - Processing: Stored locally on device

- Email Address
  - Collected: Yes (entered by user)
  - Shared: No
  - Purpose: App functionality (profile identity)
  - Processing: Stored locally on device

### Health and Fitness
- Workout logs, meal logs, nutrition targets, weight records
  - Collected: Yes
  - Shared: No
  - Purpose: App functionality, analytics for user insights
  - Processing: Stored locally on device

### Photos and Videos
- Progress photos
  - Collected: Yes
  - Shared: Optional (only if user triggers AI photo analysis)
  - Purpose: App functionality
  - Processing: Stored locally; optional AI analysis call is user-initiated

### Other User Content
- Meal descriptions and optional voice-transcribed text
  - Collected: Yes
  - Shared: Optional (only if user triggers AI meal estimation)
  - Purpose: App functionality
  - Processing: Stored locally; optional AI analysis call is user-initiated

## Third-Party Data Flows
- OpenRouter (optional AI features)
  - Trigger: User initiates AI meal/photo analysis
  - Data: User-provided text and optional image input for analysis
  - Basis: User action and feature request

- Tenor (exercise GIF guides)
  - Trigger: User opens GIF guide
  - Data: Search query terms for exercise names
  - Basis: User action

## Security Practices
- Transport encryption: HTTPS for external requests
- Local storage for core app records
- No selling of personal data

## Notes
- Keep policy links in listing aligned with these declarations.
- If you change integrations or telemetry later, update Data Safety immediately.