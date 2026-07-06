# Hexagonal Architecture Guidelines (Ports & Adapters)

This project STRICTLY follows the Hexagonal Architecture (Ports and Adapters) pattern. You must organize the backend code using explicit `in` (Driving) and `out` (Driven) directories to guarantee isolation.

## 1. Domain Layer (`domain/`)
- **Pure and Unpolluted**: The domain represents the business core. It must not import any infrastructure dependencies, frameworks, or database libraries (no Express, SQLite, fs, http, etc.).
- **Models and Entities**: Pure TypeScript classes encapsulating state and critical business rules (e.g., `Asset.ts`, `Event.ts`).

## 2. Application Layer (`application/`)
This layer orchestrates business logic using Domain entities, and acts as the true "Hexagon" boundary.
- **`application/ports/in/` (Driving Ports)**: TypeScript interfaces that define use case boundaries (e.g., `IGetAssetsQuery.ts`).
- **`application/ports/out/` (Driven Ports)**: TypeScript interfaces defining contracts for database operations or external services (e.g., `IAssetRepository.ts`).
- **`application/use_cases/`**: Concrete classes or functions that implement Driving Ports (`in`) and consume Driven Ports (`out`) via Dependency Injection. They must not know about Express `req`/`res`.

## 3. Adapters Layer (`adapters/`)
This layer contains all concrete implementations bridging the Application with the outside world.
- **`adapters/in/` (Driving Adapters)**: E.g., `adapters/in/http/AssetController.ts`. Express controllers that receive HTTP requests, parse inputs, call `ports/in` use cases, and format HTTP responses.
- **`adapters/out/` (Driven Adapters)**: Concrete implementations of `ports/out`. 
  - E.g., `adapters/out/database/SqliteAssetRepository.ts`
  - E.g., `adapters/out/services/InMemoryEventBus.ts`

## 4. API Operations: Synchronous vs Asynchronous

Every API endpoint must fall into one of two design categories to ensure both data integrity and UI responsiveness.

### 4.1 Synchronous (Blocking) Operations
Operations that complete immediately and update the transactional database must run síncronamente. The HTTP request blocks until the database writes are finalized, returning a `200 OK` or `201 Created` response.
*   **Examples**: User login, role assignment (`authService.updateUserRole`), naming detections (`peopleService.updateName`), and explicit deletions.
*   **Rule**: Express controller waits (`await`) for the Use Case to complete before writing the HTTP response headers.

### 4.2 Asynchronous (Non-Blocking / Reactive) Operations
Long-running executions or background processing tasks (anything involving transcode, AI processing, or intensive batch operations) **MUST NEVER** block the HTTP thread.
*   **Examples**: Media file import pipelines, AI description generation, face detection extraction, and clustering workflows.
*   **Rule**: 
    1.  The HTTP Controller parses inputs and hands over the execution task to the orchestrator (e.g. `PipelineCoordinatorService` or task queue).
    2.  The Controller immediately returns an HTTP status code `202 Accepted` along with the initial task metadata.
    3.  The task executes asynchronously in background workers. The workers periodically dispatch `PROCESS` and `DOMAIN` events to the system `EventBus`.
    4.  The frontend client catches these events and dynamically updates the interface, avoiding polling and blocking states.

