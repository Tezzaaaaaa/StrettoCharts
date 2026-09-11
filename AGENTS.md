# AI Implementation Workflow

This repository uses a mandatory two-checkpoint process for AI-assisted changes.

## Checkpoint 1 — Before implementation

The AI must stop before making changes and:

1. Inspect the repository.
2. Read `BUILD.md` and any applicable repository instructions.
3. Identify the existing implementation relevant to the request.
4. Check for duplicate, competing, obsolete, patched, or dead implementations.
5. Check dependencies, workflows, tests, data flow, and deployment where relevant.
6. Confirm that the requested change fits the StrettoCharts product definition and existing architecture.
7. Determine the smallest complete implementation.
8. Present the findings and implementation plan.
9. **Do not modify files until the human approves the plan.**

### Checkpoint 1 gate

The AI must explicitly state that Checkpoint 1 is complete and wait for approval before implementation.

## Implementation

After approval:

- Reuse existing capabilities before creating new ones.
- Extend existing implementations before creating parallel systems.
- Make the smallest complete change.
- Remove obsolete code made unnecessary by the change.
- Preserve functionality, accessibility, responsiveness, security, reliability, error handling, validation, and data integrity.
- Do not add unrelated changes.

## Checkpoint 2 — Before completion

After implementation, the AI must stop and verify:

1. Run the repository's appropriate tests, checks, builds, or validation.
2. Test the changed behaviour itself.
3. Inspect the complete final diff.
4. Check for unnecessary files, duplication, competing implementations, dead code, temporary patches, and unrelated changes.
5. Confirm existing functionality remains intact.
6. Confirm relevant loading, empty, error, responsive, and data states are handled.
7. Confirm workflows and deployment remain valid where applicable.
8. Fix anything discovered during verification.
9. Re-run affected validation after fixes.
10. **Do not declare the task complete until this checkpoint passes.**

### Checkpoint 2 gate

The AI must explicitly report the validation results, final diff review, cleanup status, and deployment status when applicable before declaring the change done.

## Standard command/prompt

Use this process for AI-assisted implementation:

```text
Implement the requested change in this existing repository.

CHECKPOINT 1 — STOP BEFORE CHANGING ANYTHING
- Inspect the repository and applicable instructions.
- Read BUILD.md.
- Identify the existing implementation.
- Find duplicates, competing systems, obsolete code, dead code, patches, and conflicts.
- Check dependencies, workflows, tests, data flow, and deployment as relevant.
- Confirm the request fits the product and architecture.
- Determine the smallest complete change.
- Report findings and the implementation plan.
- STOP and wait for approval.

IMPLEMENTATION — only after approval
- Reuse before creating.
- Extend before duplicating.
- Prefer existing/native capabilities.
- Make the smallest complete change.
- Remove obsolete code made unnecessary by the change.
- Preserve existing functionality and required quality attributes.

CHECKPOINT 2 — STOP BEFORE DECLARING DONE
- Run appropriate validation/tests/builds.
- Test the changed behaviour.
- Inspect the complete diff.
- Check for duplication, dead code, patches, unnecessary files, unrelated changes, and product drift.
- Verify existing functionality.
- Verify workflows/deployment where applicable.
- Fix anything found and re-run validation.
- Report the results.
- Only then declare the change complete.
```

## Product boundary

StrettoCharts is a **search-first music chart lookup platform**. AI changes must not turn it into a general music analytics, chart-health, data-pipeline monitoring, streaming-consumption analytics, editorial/news, or unrelated visualisation product.

**Done means inspected, approved, implemented, validated, cleaned up, and verified — not merely added.**
