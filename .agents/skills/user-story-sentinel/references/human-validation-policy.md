# Human Validation Policy

Ask for human validation when:

- Functional intent is inferred from code rather than docs or acceptance
  criteria.
- A change touches states, roles, permissions, payments, deletes, migration,
  security, privacy, external side effects, or pipeline scheduling.
- Tests reveal surprising legacy behavior.
- Docs and code disagree.

Validation questions must be concrete and answerable. Avoid broad questions like
"is this correct?" Prefer "Should VIP discounts combine with manual overrides,
or should manual overrides replace every other discount?"
