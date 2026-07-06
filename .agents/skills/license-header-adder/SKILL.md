---
name: license-header-adder
description: Adds the standard open-source license header to new source files. Use involves creating new code files that require copyright attribution.
---

# License Header Adder

## Goal
To automatically prepend the standard copyright and open-source license header to any newly created source code files, ensuring legal compliance.

## When to use this skill
- Whenever creating a new source file (e.g., `.ts`, `.tsx`, `.js`, `.py`, `.sh`, `.yml`, `.json`).

## When NOT to use this skill
- When modifying existing source files that already contain copyright headers.
- When creating markdown files, JSON configurations, or documentation.

## Core Rules (Must Follow)
- **MUST** read the standard license header text from the local resource: **[HEADER_TEMPLATE.txt](./resources/HEADER_TEMPLATE.txt)**.
- **MUST** prepend the header at the very top of any newly created source code file.
- **MUST** adjust comment syntax to match the target language:
  - C-style block comments (`/* ... */`) for TypeScript, JavaScript, Java, CSS, and C++.
  - Line comments (`#`) for Python, Shell scripts, and YAML.
  - HTML comments (`<!-- ... -->`) for HTML and XML.
