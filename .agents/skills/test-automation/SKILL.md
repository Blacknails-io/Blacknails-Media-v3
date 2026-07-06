---
name: test-automation
description: Guidelines for writing and executing E2E integration tests using Playwright. Use when creating test scripts, simulating user interactions, or testing UI in the frontend client.
---

# E2E Test Automation & QA Guidelines

## Goal
To guarantee frontend visual interface and feature correctness by implementing and running E2E integration tests using Playwright.

## When to use this skill
- When creating or modifying frontend user interfaces (vistas, components, animations).
- When writing integration tests to simulate user interactions (clicks, uploads, sidebar navigation).
- Before shipping UI changes to production.

## When NOT to use this skill
- For backend unit testing of logic or database adapters (use `test-before-modify` and `proactive-bug-fixing` instead).
- For purely CSS/styling mockups without interactive behavior.

## Core Rules (Must Follow)
- **MUST** use accessible Playwright locators (`getByRole`, `getByText`, `getByLabel`) instead of raw CSS selectors.
- **MUST** wait for UI transitions (Framer Motion) to complete before capturing E2E screenshots.
- **MUST** generate media test fixtures locally using root shell scripts; **NEVER** commit large binary media fixtures to Git.
- **MUST** clean up database modifications and imported test files in the E2E teardown hook.

---

## Detailed Workflows & Examples
- **[E2E Testing Guidelines](./resources/guidelines.md)**: Rules for writing Playwright selectors, handling animations, generating media test fixtures, and running E2E commands.
