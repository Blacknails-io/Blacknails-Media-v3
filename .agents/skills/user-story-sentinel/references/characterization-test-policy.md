# Characterization Test Policy

Use characterization tests to preserve observed behavior before changing legacy
areas.

Rules:

- Test what the system does today, not what it should do tomorrow.
- Name uncertain expectations as observed behavior.
- Keep tests focused on the story's touched area.
- Add human questions when a test encodes surprising behavior.
- Do not refactor behavior and characterize it in the same step unless the user
  explicitly accepts that risk.
