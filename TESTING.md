# Testing Guide

## Objective

This repository enforces minimum coverage of 80% for:

- lines
- statements
- functions
- branches

The thresholds are validated in local runs and in CI.

## Test Structure

- Backend tests live under `backend/tests`
- Frontend tests live under `frontend/tests`

Suggested convention:

- `unit/` for isolated tests (single module/component/hook)
- `integration/` for interaction between modules or API boundaries

## Local Commands

From repository root:

```bash
npm run test:coverage
```

Per workspace:

```bash
npm --workspace frontend run test:coverage
npm --workspace backend run test:coverage
```

Fast feedback during development:

```bash
npm run test --workspace=backend
npm --workspace frontend run test
```

## CI Validation

The workflow at `.github/workflows/ci.yml` runs:

- frontend coverage
- backend coverage
- frontend lint/build checks

If any coverage threshold is below 80%, CI fails.

## Test Design Rules

- Keep tests small and focused on one behavior.
- Prefer explicit arrange-act-assert flow.
- Cover success and failure branches for public behavior.
- Avoid coupling tests to implementation details.
- Mock only external boundaries (network, filesystem, browser APIs).
- Use deterministic data and avoid timing-dependent assertions.

## When Adding New Code

- Add or update tests in the same pull request.
- Keep or improve coverage in touched modules.
- For non-runtime files (types or generated files), prefer excluding them from coverage scope instead of forcing artificial tests.
