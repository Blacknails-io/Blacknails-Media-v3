# Documentation Guidelines

To keep the project easily understandable for new developers (or agents) being onboarded, you must adhere to the following rules:

1. **Central Documentation**: All high-level features, system architecture, and workflows are documented in `/srv/storage/ai-lab/Blacknails-Media-v3/docs/FEATURES_AND_ARCHITECTURE.md`.
2. **Mandatory Updates**: Whenever you implement a new feature, you MUST open the central documentation file and add or update the relevant section.
3. **What to Document**:
   - New APIs (endpoints, expected payloads).
   - Database schema changes.
   - Core algorithms (e.g., how deduplication or Face AI works).
   - Any new external dependency (e.g., a new Ollama model or Docker container).
4. **Style**: Be concise. Use Markdown. Do not copy-paste code; explain the concepts and the flow.
