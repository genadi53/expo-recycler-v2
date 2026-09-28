# Agent rules

## Git finish

- Start each code task on a **new branch** from up-to-date `main`.
- When the task is finished: **merge into `main`**, resolve all conflicts, and **push `main`** to GitHub (`https://github.com/genadi53/expo-recycler-v2.git`). Remote may be named `github` or `origin` — ensure that repo receives `main`.
- Do **not** force-push unless the user explicitly asks.
- Pushing `main` deploys the Fly API (`recycler-api`) via the existing pre-push hook — that is expected.
- **Exception:** if the user says leave it on the feature branch / do not merge yet, skip the merge and leave the work on the feature branch.
