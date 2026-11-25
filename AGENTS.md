# Agent rules

## Git finish

- Start each code task on a **new branch** from up-to-date `main`.
- When the task is finished: **merge into `main`**, resolve all conflicts, and **push `main`** to GitHub (`https://github.com/genadi53/expo-recycler-v2.git`). Remote may be named `github` or `origin` — ensure that repo receives `main`.
- Do **not** force-push unless the user explicitly asks.
- Pushing `main` deploys the Fly API (`recycler-api`) via the existing pre-push hook — that is expected.
- **Exception:** if the user says leave it on the feature branch / do not merge yet, skip the merge and leave the work on the feature branch.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `genadi53/expo-recycler-v2` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
