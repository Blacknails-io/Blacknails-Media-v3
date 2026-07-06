---
name: json-to-pydantic
description: Converts JSON data snippets into Python Pydantic data models. Use when generating strongly-typed Python schemas from API response payloads.
---

# JSON to Pydantic Converter

## Goal
To convert raw JSON data structures, configurations, or payload responses into strongly-typed Python classes using Pydantic `BaseModel` schemas.

## When to use this skill
- When designing Python API models or typing wrappers for JSON payloads.
- When generating schemas for serialization/deserialization validation.

## When NOT to use this skill
- For backend TypeScript, frontend React components, or configurations not related to Python Pydantic.

## Core Rules (Must Follow)
- **MUST** use `PascalCase` for class names.
- **MUST** extract nested JSON objects into their own independent Pydantic sub-classes.
- **MUST** default fields that can be null or missing to `None` using the `Optional` type hint from typing.
- **MUST** map types correctly:
  - String -> `str`
  - Number -> `int` or `float`
  - Boolean -> `bool`
  - Array -> `List[Type]`
  - Null -> `Optional[Type]`

---

## Detailed Workflows & Examples
- **[JSON to Pydantic Conversion Example](./examples/conversion-example.md)**: Side-by-side comparison of a nested input JSON and the corresponding Python Pydantic schema structure.
