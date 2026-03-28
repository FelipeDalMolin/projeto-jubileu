# Delivery

Load this reference when the task includes project tracking, PR preparation, migration notes, or structured technical delivery.

## Technical description template

Summarize the implementation in three parts:

### 1. Domain and contract
- What changed in the domain
- What changed in the API contract
- Whether the task stayed in maintenance mode or refactor mode

### 2. Implementation
- Which models, schemas, services, routes, migrations, and tests changed
- Whether any legacy naming or compatibility path was preserved
- Whether any target architecture movement was introduced

### 3. Compatibility and risks
- What compatibility or migration choices were made
- What remains transitional or temporary
- What known risks or follow-ups still exist

## Validation checklist template

Use a flat checklist similar to:

- [ ] Route contract follows `/dias/{data_iso}/eventos...` or compatibility was documented
- [ ] Domain ownership and status transitions were validated
- [ ] SQLAlchemy models, schemas, and Alembic are aligned
- [ ] Duplicated business logic was avoided or removed
- [ ] Authentication, RBAC, and platform constraints were preserved when applicable
- [ ] Automated tests were added or updated
- [ ] Edge cases were exercised or explicitly listed as pending

Replace each item with executed status and brief evidence when possible.

## Linear guidance

When creating or updating a Linear issue:
- State the user problem in domain terms, not only code terms
- Name affected aggregates, routes, and layers
- Mention whether a migration is required
- Include validation expectations and rollout risks
- If it is refactor work, identify whether the issue is:
  - domain refactor
  - module extraction
  - compatibility bridge
  - migration/debt removal

## GitHub PR guidance

When preparing a PR or PR body, keep this structure:

## Context
- Why the feature, fix, or refactor is needed

## Implementation
- Main API, service, model, and migration changes
- Whether the task moved code toward the target architecture

## Validation
- Tests run
- Manual checks
- Remaining risks

## Notes
- Compatibility, data migration, rollout, or follow-up items

## Release notes hint

If the change is significant enough for a release summary, include:
- domain impact
- migration impact
- API compatibility note
- operational or rollout note