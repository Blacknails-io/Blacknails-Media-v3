# Workspace Rules for Agents

These rules apply globally to all tasks within this workspace. All agents MUST follow them.

## 1. Clean Workspace Policy (No Root Pollution)
- **DO NOT** create temporary scratch scripts, test generators, or one-off tools in the root directory of the project.
- **ALWAYS** place testing scripts or one-off utilities in designated directories (e.g., `test-files/scripts/`) or use your own artifact scratch directory (`<appDataDir>/brain/<conversation-id>/scratch/`).
- If you must generate files for testing, clean them up immediately after you are done, unless the user explicitly asks to keep them.
- Keep the project root pristine. Only configuration files (`package.json`, `docker-compose.yml`, etc.) and core project directories should exist at the root.
