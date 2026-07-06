# TDD Instructions

Lógica paso a paso para aplicar el patrón de desarrollo guiado por pruebas (Test-Driven Development) antes de modificar el código.

## Step-by-Step Instructions
1.  **Analyze the Change**: Identify which class, module, or function needs to be created or modified.
2.  **Design Test Cases**: Before writing any implementation code, write down the test scenarios (happy paths, boundary conditions, edge cases, error cases).
3.  **Find or Create the Test File**:
    *   Locate the matching test file under `server/tests/` (e.g., if modifying `server/src/domain/entities/User.ts`, find `server/tests/domain/entities/User.test.ts`).
    *   If the test file does not exist, create it under the corresponding directory path under `server/tests/`.
4.  **Write the Tests**:
    *   Import `describe` and `it` from `node:test`.
    *   Import `assert` from `node:assert`.
    *   Write the test cases for the new or modified behavior. Mock dependencies if necessary.
5.  **Run the Tests (Expect Failure/Compilation issues)**: Run `npm run test` in the `server/` directory.
6.  **Write/Update the Code**: Implement the minimum amount of production code required to make the tests pass.
7.  **Run Tests Again**: Ensure the test suite compiles and all test cases pass successfully.
