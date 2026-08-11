## npx prisma generate

## npm run test:unit


## npm run test:security

## npm run test:integration


## npm test


1. Coverage report — know your baseline
Run npm run test:coverage to see exact % per file before deciding what to tackle next.

2. Raise coverage thresholds
The jest.config.ts thresholds are still at the bare minimum (2/3/25/25). Once you see the real numbers, bump them to reflect actual coverage so regressions get caught automatically.

3. CI/CD pipeline
Set up GitHub Actions (or whatever your host is) to run the full test suite on every push/PR. Without this, the tests only run locally and provide no safety net for the team. A basic workflow would:

Install deps

Run migrations against a test DB

Run npm test

Block merges on failure

4. API documentation
If this is going to be consumed by a frontend or mobile client, generating OpenAPI/Swagger docs from your validators/routes is the next high-value step. Tools like zod-to-openapi work well with your existing Zod validators.

5. Production hardening

Rate limiter tuning (the 429s in tests show the auth limiter is quite aggressive — worth reviewing limits)

Logging/observability (structured logs, error tracking like Sentry)

Health check endpoint expansion (DB connectivity check, queue health)

6. Feature work
Whatever is on the product backlog — personal-study.service, community.service, marketplace.service, planner.service all have zero test coverage and likely incomplete implementations.

Which of these do you want to tackle? If you're unsure, run the coverage report first — it'll make the decision obvious.

