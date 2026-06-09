# Branching Strategy

---

## Overview

The project follows a simplified Git Flow with `main`, `develop`, and `feature` branches.

---

## Branch Structure

```
main ────────────────────────────────────────────────
  │                                                      
  └── develop ────────────────────────────────────────
        │         │           │           │
        │         │           │           │
   feature/    feature/    feature/    feature/
   room-      chat-       sync-       voice-
   creation   system      engine      chat
```

---

## Branch Types

### main

- Production-ready code
- Auto-deploys to Vercel + Render
- Only merged from `develop` via PR
- Protected — no direct pushes

### develop

- Integration branch for active development
- All feature branches merge here
- Deployed to staging environment (optional)
- May be unstable during active sprints

### feature/*

- One branch per feature or sprint deliverable
- Created from `develop`
- Merged back to `develop` when complete
- Naming: `feature/{sprint}-{descriptive-name}`
- Examples: `feature/sprint1-room-creation`, `feature/sprint2-chat`

---

## Workflow

```
1. Create feature branch from develop
   git checkout develop
   git checkout -b feature/sprint3-sync-engine

2. Develop and commit
   git add .
   git commit -m "feat: add sync service with heartbeat"

3. Keep feature branch updated with develop
   git fetch origin
   git rebase origin/develop

4. Open PR to merge into develop
   (Requires review)

5. After merge, delete feature branch
   git branch -d feature/sprint3-sync-engine

6. When develop is stable, PR to main
   (Creates a release)
```

---

## PR Requirements

- Minimum **1 reviewer** for feature → develop
- Minimum **1 reviewer** for develop → main (ideally 2)
- All tests must pass
- No merge conflicts
- Conventional commit messages preferred

---

## Hotfix Flow (post-V1)

```
main ─── hotfix/critical-bug ──► merge to main + develop
```

Hotfix branches are created from `main` for critical production issues. They merge to both `main` and `develop`.

---

## Commit Message Convention

```
<type>: <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`

**Examples:**
```
feat: add room creation endpoint
fix: correct drift detection threshold
docs: update WebSocket event reference
refactor: extract peer connection factory
```

---

## V1 Sprint Branches

| Sprint | Branch Name |
|---|---|
| Sprint 1 | `feature/sprint1-room-creation` |
| Sprint 2 | `feature/sprint2-chat` |
| Sprint 3 | `feature/sprint3-sync-engine` |
| Sprint 4 | `feature/sprint4-voice-chat` |
| Sprint 5 | `feature/sprint5-reconnect` |
