# Presentation Views

Views are domain-backed frontend screens. They compose shared UI and call logic/use-case boundaries, but they should not own transport details such as raw `fetch` calls.

Examples:

- `views/auth/Login`
- `views/assets/Gallery`
- `views/workers/Pipeline`
- `views/people/PeopleCuration`
