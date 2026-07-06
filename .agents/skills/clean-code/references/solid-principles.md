# SOLID Principles Guideline

Rules for applying object-oriented and structural design patterns in the codebase.

## SOLID Principles
- **Single Responsibility Principle (SRP)**: A function, class, or module should do one thing and do it well. Keep functions under 30-40 lines. Break complex logic into smaller helper functions.
- **Open/Closed Principle (OCP)**: Software entities should be open for extension but closed for modification. Prefer polymorphism or configuration maps over large `switch` or `if/else` chains.
- **Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for their base types without breaking the application.
- **Interface Segregation Principle (ISP)**: Clients should not be forced to depend on interfaces they do not use. Prefer small, specific interfaces over fat ones.
- **Dependency Inversion Principle (DIP)**: Depend on abstractions (interfaces), not concretions. Inject dependencies instead of hardcoding them.

---

### Examples
Refer to [solid-principles-examples.md](../examples/solid-principles-examples.md) for a concrete comparison.

