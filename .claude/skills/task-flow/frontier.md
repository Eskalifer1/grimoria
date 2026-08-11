# Frontier — an epic that is already broken down

Reached from `SKILL.md` when the issue has `epic` and sub-issues. **Never break it down again.**

List the open children whose blockers are all closed, and hand the user the choice:

```bash
gh api repos/{owner}/{repo}/issues/<child> --jq '.issue_dependencies_summary.blocked_by'
```

`blocked_by` counts **open** blockers only. Present the ready children in issue order with their
labels; on the user's pick, re-enter `/task-flow` on that number.
