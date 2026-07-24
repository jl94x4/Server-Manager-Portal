# Cleaner

**Cleaner** (nav label for Library Maintenance) is the admin toolkit for finding and removing unwanted library media. Enable it under Settings when the maintenance feature flag is available, then open **Cleaner** in the nav.

## Sections

| Section | Purpose |
| --- | --- |
| Overview | High-level maintenance status and insights |
| Exclusions | Titles or libraries that rules should skip |
| Rules | Define keep / remove criteria |
| Collections | Collection-aware maintenance helpers |
| Candidates | Items matching rules, ready for review |
| Calendar | Schedule-oriented maintenance view |
| Storage Metrics | Space and library size context |
| Rule Library | Reusable rule templates |
| Cleaner Settings | Feature configuration |
| Logs | Run history and diagnostics |

## Typical workflow

1. Configure exclusions for anything that must never be touched.
2. Create or pick rules from the rule library.
3. Review **Candidates** before acting.
4. Run cleanup and check **Logs** for what changed.

Cleaner is separate from [ColleXions](/features/collexions) (which builds Plex collections) and [Upgrader](/features/upgrader) (which improves file quality through ARR).

## Related

- [Admin Dashboard](/features/admin)
- [Upgrader](/features/upgrader)
- [Background Tasks](/operations/background-tasks)
