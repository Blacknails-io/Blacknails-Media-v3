---
name: git-commit-formatter
description: Formats git commit messages according to Conventional Commits specification. Use this when the user asks to commit changes or write a commit message.
---

# Git Commit Formatter

## Goal
To ensure all project commit messages are structured and follow the Conventional Commits specification for versioning and automated changelog generation.

## When to use this skill
- Whenever the user requests to commit changes to git.
- Whenever you are generating a git commit message or reviewing one.

## When NOT to use this skill
- For code refactoring or general coding tasks not involving git operations.

## Core Rules (Must Follow)
- **MUST** format messages using: `<type>[optional scope]: <description>`
- **MUST** write the description in lowercase and imperative mood (e.g., `add` instead of `added`, `fix` instead of `fixed`).
- **MUST** use only the following allowed types:
  - `feat`: A new feature.
  - `fix`: A bug fix.
  - `docs`: Documentation only changes.
  - `style`: Formatting or whitespace changes with no code impact.
  - `refactor`: Code change that neither fixes a bug nor adds a feature.
  - `perf`: Code change that improves performance.
  - `test`: Adding or correcting tests.
  - `chore`: Auxiliary tool changes, dependency upgrades, or workspace configs.
- **MUST** add `!` after the type/scope and append `BREAKING CHANGE:` in the footer for breaking changes.

---

## Examples
Refer to [commit-examples.md](./examples/commit-examples.md) in the `examples/` directory for concrete illustrations of bad vs good commit messages.
