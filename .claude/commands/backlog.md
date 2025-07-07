# /backlog

Markdown-native task management & Kanban board visualization integrated with SuperClaude.

## Usage

```
/backlog [operation] [options]
```

## Operations

### board
Display Kanban board view of all tasks
```
/backlog board
/backlog board --filter="label:urgent"
```

### create
Create a new task in backlog
```
/backlog create "Implement user authentication"
/backlog create "Fix bug #123" --priority=high --labels=bug,critical
```

### move
Move task between columns
```
/backlog move 42 in-progress
/backlog move 42 done
```

### list
List tasks with filters
```
/backlog list
/backlog list --status=todo
/backlog list --assignee=@pranav
```

### sync
Sync with SuperClaude task system
```
/backlog sync
/backlog sync --force
```

## Task Format

Tasks are stored as markdown files: `.backlog/{status}/task-{id} - {title}.md`

```markdown
---
id: task-042
title: Implement feature X
status: in-progress
assignee: @pranav
priority: high
labels: [feature, backend]
created: 2025-01-07
updated: 2025-01-07
superclaude:
  session_id: abc123
  branch: feature/task-042
  checkpoint: checkpoint-042-v1
  todos:
    - [x] Research implementation
    - [ ] Design architecture
    - [ ] Write code
dependencies: [task-041]
---

# Description
Detailed task description...

## Acceptance Criteria
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Code reviewed

## Notes
Implementation notes, session data, etc.
```

## Integration Features

### Auto-sync with TodoWrite/TodoRead
- Todos automatically sync to task subtasks
- Task status updates reflect in board
- Session recovery preserves task state

### Git Integration
- Branch creation: `git checkout -b feature/task-{id}`
- Commit links stored in task metadata
- PR tracking in task notes

### AI-Ready Commands
- "Claude, work on task 42"
- "Show me all high-priority bugs"
- "Move completed tasks to archive"

## Visualization

### Terminal Board (Default)
```
┌─────────────┬─────────────┬─────────────┐
│   TO DO     │ IN PROGRESS │    DONE     │
├─────────────┼─────────────┼─────────────┤
│ [42] Auth   │ [43] API    │ [41] Setup  │
│ [44] Tests  │             │ [40] Docs   │
└─────────────┴─────────────┴─────────────┘
```

### Web Interface
```
/backlog serve --port=3000
```
Opens interactive drag-and-drop Kanban board

## Examples

### Creating a feature task
```
/backlog create "Add dark mode support" --priority=medium --labels=feature,ui
```

### Working on a task
```
/backlog move 42 in-progress
/task resume 42  # Integrates with SuperClaude task system
```

### Quick status check
```
/backlog board --my-tasks
```

### Archive completed tasks
```
/backlog archive --older-than=30d
```

## Configuration

### Custom columns
```yaml
# .claude/.backlog.config.yml
columns:
  - todo
  - in-progress
  - review
  - testing
  - done
```

### Default filters
```yaml
default_filters:
  board: "assignee:@me"
  list: "status:!archived"
```

## Best Practices

1. **One task, one purpose** - Keep tasks focused
2. **Clear acceptance criteria** - Define "done"
3. **Regular archiving** - Keep board clean
4. **Descriptive titles** - `task-042 - Add user auth` not `task-042 - Feature`
5. **Use labels** - Categorize for easy filtering

## Shortcuts

- `/bl` → `/backlog`
- `/bl b` → `/backlog board`
- `/bl c` → `/backlog create`
- `/bl m` → `/backlog move`

## See Also

- `/task` - SuperClaude task management
- `/review` - Code review integration
- `/status` - Project status overview