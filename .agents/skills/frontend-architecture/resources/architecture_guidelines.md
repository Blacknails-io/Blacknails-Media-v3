# Frontend Domain Architecture Guidelines

The frontend mirrors the backend at the domain and use-case level. It does not mirror backend framework classes or transport details.

## 1. Layers

Use these conceptual layers in the client:

- `domain/`: frontend domain entities, value objects, permissions, and pure rules.
- `application/`: use cases that orchestrate domain state and ports.
- `adapters/`: concrete API clients, frontend event bus integrations, storage, and other infrastructure.
- `presentation/`: React views, route composition, layout, shared UI, and themes.

The frontend may keep legacy files temporarily, but new or refactored feature work should move toward these boundaries.

## 1.1 Repository Convention

Use `client/src/presentation` as the stable home for frontend components that have passed architecture and design review.

- `client/src/components` may contain legacy or experimental UI while a migration is in progress.
- Finished domain views move to `client/src/presentation/views/<domain>/<Component>`.
- Finished shared UI moves to `client/src/presentation/ui/<category>/<Component>`.
- Finished themes and material presets move to `client/src/presentation/themes/<theme-name>`.
- Do not duplicate components indefinitely: once the stable version is imported by the app and verified, remove or archive the legacy path.

## 2. Domain Projection Rule

Business views and feature modules must map to real backend concepts.

Valid examples:

- Backend `Auth` -> frontend `domain/auth`, `application/auth`, `presentation/views/auth/Login`.
- Backend `Asset` -> frontend `domain/assets`, `application/assets`, `presentation/views/assets/Gallery`.
- Backend `Worker` -> frontend `domain/workers`, `application/workers`, `presentation/views/workers/Pipeline`.
- Backend events -> frontend event adapters and `presentation/views/events/EventLog`.

Invalid example:

- `ProjectCard`, `TeamDashboard`, or `WorkspacePanel` when no such backend domain exists.

## 3. Presentation Is Not Domain

Shared UI components are allowed without backend equivalents because they are visual infrastructure, not business concepts.

Examples:

- `Button`
- `Modal`
- `GlassSurface`
- `LiquidGlassSurface`
- `ThemeProvider`
- `SidebarShell`
- `EmptyState`
- `Skeleton`

Place these under `presentation/ui`, `presentation/layout`, or `presentation/themes`. They must stay generic and receive domain data through props.

## 4. View and Logic Separation

Presentation views define structure and user interaction points. They do not perform fetches directly and do not encode backend transport details.

Prefer this split:

- `LoginView.tsx`: markup, accessibility, generic class names, callbacks.
- `useLoginLogic.ts` or `application/auth/loginUser`: state transitions, validation flow, use-case orchestration.
- `AuthApi.ts`: HTTP details for auth endpoints.
- `AuthSession.ts`: domain representation of a session.

Views can call callbacks such as `onSubmit`, `onRetry`, `onSelectAsset`, or `onTriggerWorker`; application logic decides what those callbacks do.

## 5. Adapters and Events

Use adapters for:

- HTTP API communication.
- SSE or frontend event-bus integration.
- Local/session storage.
- Browser APIs.

Application use cases should depend on adapter contracts, not on raw `fetch`, DOM APIs, or global browser state.

Use frontend events for cross-cutting signals such as auth changes, worker status, import progress, and notifications. Do not use events to hide ordinary local component flow.

### 5.1 Real-time Dual-Update State Pattern
For stateful, real-time views (e.g. dashboards, workers panels, or logs), updates must occur in two phases:
1.  **Baseline Initialization**: On component mount, the logic layer **MUST** perform an initial HTTP `GET` fetch via its API service adapter to establish the current state.
2.  **Reactive Progression**: Immediately after initialization, the component/hook **MUST** subscribe to the backend EventStream (`BackendEventsController.subscribeEvents`) to receive progress updates, task completion signals, or state increments, merging these incoming events directly into the local state.

*Example pattern (React custom hook):*
```typescript
import { useEffect, useState, useCallback } from 'react';
import { backendEventsController } from '../../controllers/BackendEventsController.js';
import { workerService } from '../../services/api/index.js';

export function useWorkerState(token: string | null) {
  const [workers, setWorkers] = useState<Worker[]>([]);

  // 1. Initial baseline fetch
  const fetchState = useCallback(async () => {
    const data = await workerService.list(token);
    setWorkers(data);
  }, [token]);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  // 2. Real-time progressive subscription
  useEffect(() => {
    const unsubscribe = backendEventsController.subscribeEvents((event) => {
      if (event.type === 'PROCESS') {
        // Incrementally update the targeted item in state
        setWorkers((prev) => 
          prev.map(w => w.id === event.source ? { ...w, isExecuting: event.action === 'STARTED' } : w)
        );
      }
    });
    return () => unsubscribe();
  }, []);

  return { workers, fetchState };
}
```

## 6. Open/Closed Principle

Frontend architecture must be open to extension and closed to unnecessary modification.

- Add a new backend domain by adding a new domain/application/adapter/presentation module.
- Add a new use case by adding a new application module and exposing it through the relevant view logic.
- Add a new theme by adding theme tokens/materials, not by rewriting stable views.
- Add a new visual material by adding a shared UI surface, not by embedding material-specific logic in each view.

Example:

```txt
presentation/ui/surfaces/LiquidGlassSurface
presentation/themes/realistic-cyber-glass
presentation/views/auth/LoginView
application/auth/loginUser
domain/auth/AuthSession
adapters/api/AuthApi
```

`LoginView` should not know how LiquidGlass initializes WebGL. It should compose a generic surface.

## 7. CSS and Themes

Use generic component class names that describe role, not material.

Prefer:

- `.login-panel`
- `.login-button`
- `.media-card`
- `.surface`

Avoid:

- `.glass-login-button`
- `.cyberpunk-card`
- `.blue-neon-worker-panel`

Theme files define materials, light, borders, shadows, and tokens:

```txt
presentation/themes/realistic-cyber-glass.css
presentation/themes/clean-dark.css
```

Components consume tokens. Themes provide values.

## 8. Relationship to Other Skills

- Use `server-architecture` for backend domain, ports, use cases, controllers, repositories, and services.
- Use `frontend-architecture` for frontend domain projection, use cases, adapters, and presentation boundaries.
- Use `frontend-ui-motion` for visual implementation, motion, layout, and React UI polish.
- Use `ux-design-philosophy` when deciding the product experience or information hierarchy.
