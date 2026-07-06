# How to Create a Skill in Antigravity

This guide outlines the standard directory structure, file formats, and expert best practices for creating and maintaining portable, token-efficient skills for Antigravity agents.

---

## 1. Directory Structure

A standardized skill is structured as a directory containing a main definition file and modular subdirectories:

```text
my-skill/
├── SKILL.md                 # [Required] Main definition, metadata, and core rules
├── references/              # [Optional] Detailed workflows, specifications, or instruction guides
│    └── instructions.md
├── examples/                # [Optional] Code snippets or refactoring comparative markdown files
│    └── pattern-examples.md
└── scripts/                 # [Optional] Python, Bash, or Node helper scripts called by the agent
     └── helper.sh
```

---

## 2. The Definition File (`SKILL.md`)

`SKILL.md` acts as the brain of the skill. It consists of two parts: a **YAML Frontmatter** and a **Markdown Body**.

### A. YAML Frontmatter
Used by the agent's high-level router to match the skill semantically with the user's intent.

```yaml
---
name: my-skill-name
description: Use this skill when the user asks to query database tables, inspect PostgreSQL schemas, or debug SQL queries.
---
```
*   **`name`**: Unique, lowercase, and hyphenated identifier.
*   **`description`**: The activation trigger. It **MUST** be semantically precise. Vague descriptions (e.g., "database stuff") will lead to trigger failure or wasteful activations.

### B. Markdown Body Anatomy
To keep prompt context compact while giving the agent immediate guidance:

1.  **Goal**: A clear statement of what the skill achieves.
2.  **When to use / When NOT to use**: Explicit conditions indicating when the agent should apply this skill and when it must ignore it.
3.  **Core Rules**: High-level constraints using strong terminology (**MUST**, **SHOULD**, **NEVER**). These are loaded directly into the agent's context.
4.  **Detailed Workflows & Examples**: Relative markdown links pointing to target files in `references/` or `examples/`.

---

## 3. Skill Lifecycle & Context Flow

Understanding how the agent consumes the skill helps you structure the content efficiently:

1.  **Trigger Matching (YAML Description)**: Before activation, the agent's router scans only the YAML `description` fields across all skills. If a match is found, the skill is triggered.
2.  **Context Injection (SKILL.md)**: Once triggered, the entire markdown body of `SKILL.md` (excluding frontmatter) is appended to the agent's active context window. The agent reads this context *during every single turn* of the task.
3.  **On-Demand Consultation (Subdirectories)**: Files inside `references/`, `resources/`, and `examples/` are **NOT** automatically loaded. The agent will read them using tools (`view_file`) *only* when it encounters their relative links in `SKILL.md` and needs specific details to perform an action.

---

## 4. Expert Design Recommendations

When writing skills, follow these rules to ensure high performance, low latency, and cost-efficient execution:

### 💡 The Hybrid Approach (Core vs. Modular)
To minimize token consumption while preventing latency overhead:
*   **Keep rules in `SKILL.md` short**: Only place core constraints and the high-level goal in the main file (under 100 lines). These are loaded automatically into every turn's system prompt.
*   **Delegate steps and examples to subdirectories**: Move detailed step-by-step procedures to `references/` or `resources/` and code examples to `examples/`. The agent will read these files under demand (`view_file`) only when necessary, preventing token bloat in long conversations.

### 🌐 Always Use Relative Paths
*   **NEVER** use absolute paths (e.g., `file:///srv/storage/...`) in links.
*   **ALWAYS** use relative paths (e.g., `./references/instructions.md` or `../examples/tdd-examples.md`) so the skill is portable and works in any environment, workspace, or CI pipeline.

### 📝 Use Markdown (`.md`) for Code Examples
*   Write your code examples in Markdown files (inside the `examples/` folder) instead of raw source files (like `.ts`, `.js`, or `.py`).
*   **Why?**
    *   It allows comparing ❌ **Bad Code** and  **Good Code** side-by-side with clear explanatory text.
    *   It prevents false positives and warnings in the IDE's linter panel due to intentionally broken or duplicate example code.