# Evidence And Confidence

Use four claim types:

- `fact`: directly visible from code, config, tests, or file structure.
- `hypothesis`: likely interpretation that needs validation.
- `risk`: a condition that may cause maintenance, correctness, security, or
  delivery problems.
- `unknown`: a question that cannot be answered safely from current evidence.

Confidence:

- `high`: directly supported by source, tests, config, schema, or manifests.
- `medium`: strongly suggested by names and nearby usage.
- `low`: plausible but needs targeted review.

Never convert a code path into business intent without validation. For example,
"returns are blocked after 14 days" can be observed; "the business wants a
14-day return window" requires human confirmation.
