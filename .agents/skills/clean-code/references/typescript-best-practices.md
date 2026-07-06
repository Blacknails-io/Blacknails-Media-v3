# JS / TypeScript Best Practices & Error Handling Guideline

Coding standards and patterns specifically targeting JavaScript/TypeScript development.

## JS / TypeScript Best Practices
- **Strict Typing**: Avoid `any` whenever possible. Use explicit types, interfaces, or generic types.
- **Async/Await**: Prefer `async/await` over raw Promises or callbacks. Always handle rejections properly.
- **Avoid Magic Values**: Define constants for numbers and strings used multiple times or representing configurations.
- **Array Methods**: Prefer declarative methods (`map`, `filter`, `reduce`, `find`, `some`, `every`) over imperative `for` loops when processing arrays.

## Error Handling
- Always use `try/catch` blocks around code that can throw exceptions, especially asynchronous operations (I/O, database, API requests).
- Avoid silent failure: never leave a catch block empty (`catch (error) {}`). Log the error or handle it gracefully.
- Return structured error responses or propagate descriptive custom errors.

---

### Examples
Refer to [typescript-best-practices-examples.md](../examples/typescript-best-practices-examples.md) for a concrete comparison.

