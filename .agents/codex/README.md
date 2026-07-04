# Codex Agent Profiles

These profiles define how Codex threads should be created for this project. They do not replace the project skills in `.agents/skills`; they select the Codex model, reasoning effort, and starting prompt for each kind of work.

Use these profiles when starting a new Codex thread or subagent for Blacknails Media v3.

## Rules

- Keep architecture and product-shaping work on `gpt-5.5`.
- Use `xhigh` reasoning for decisions that affect long-lived architecture, security, data flow, or visual system foundations.
- Use smaller/faster models only for isolated, low-risk implementation or verification tasks.
- Every Codex agent must follow `.agents/AGENTS.md` and the relevant skills in `.agents/skills`.
- Skills define project rules; profiles define which Codex model should carry those rules.

## Profiles

| Profile | Model | Thinking | Use for |
| --- | --- | --- | --- |
| `codex-architect` | `gpt-5.5` | `xhigh` | Backend/frontend architecture, domain boundaries, Open/Closed decisions |
| `codex-frontend-visual` | `gpt-5.5` | `high` | Design-system decisions, themes, LiquidGlass/materials, high-impact UI |
| `codex-implementation` | `gpt-5.4` | `high` | Focused feature implementation after architecture is agreed |
| `codex-fast-fix` | `gpt-5.4-mini` | `medium` | Small mechanical fixes, simple refactors, quick checks |
| `codex-test-qa` | `gpt-5.4` | `high` | Playwright, regression tests, verification strategy |

## Operational Flow

1. Choose the profile that matches the risk of the task.
2. Start the Codex thread with the profile model and thinking level from `profiles.yaml`.
3. Paste or send the matching prompt from `prompts/`.
4. Tell the agent which files or running server it should inspect first.
5. Keep final decisions documented in `docs/FEATURES_AND_ARCHITECTURE.md` when they change project architecture.
