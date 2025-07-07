# Backlog.md Integration for SuperClaude

## Overview

SuperClaude now includes integrated support for [Backlog.md](https://github.com/MrLesk/Backlog.md), a Markdown-native task manager and Kanban board visualizer. This integration provides visual task management while maintaining SuperClaude's powerful automation features.

## Quick Start

### View Your Tasks
```bash
# Show Kanban board
/backlog board

# List all tasks
/backlog list

# Show only your tasks
/backlog board --mine
```

### Create a Task
```bash
# Basic task creation
/backlog create "Implement user authentication"

# With options
/backlog create "Fix critical bug" --priority=high --labels=bug,urgent
```

### Move Tasks
```bash
# Move to in-progress
/backlog move 42 in-progress

# Mark as done
/backlog move 42 done
```

## File Structure

Tasks are stored as markdown files in the `.backlog/` directory:

```
.backlog/
├── todo/          # New tasks
├── in-progress/   # Active tasks
├── done/          # Completed tasks
└── archive/       # Archived tasks
```

## Task Format

Each task is a markdown file with YAML frontmatter:

```markdown
---
id: task-042
title: Implement feature X
status: in-progress
assignee: @pranav
priority: high
labels: [feature, backend]
created: 2025-01-07
superclaude:
  session_id: abc123
  todos:
    - [x] Research approach
    - [ ] Write code
    - [ ] Add tests
---

# Description
Detailed task description...

## Acceptance Criteria
- [ ] All tests pass
- [ ] Documentation updated
```

## Integration with SuperClaude

### Automatic Todo Sync
Your TodoWrite/TodoRead items automatically sync with Backlog.md tasks:
- Todos become subtasks in the markdown file
- Completion status stays synchronized
- Progress updates in real-time

### Session Recovery
When you resume work:
1. SuperClaude scans `.backlog/in-progress/`
2. Loads task context and todos
3. Continues where you left off

### Natural Language Commands
```bash
"Claude, show my tasks"
"Move task 42 to done"
"What tasks are blocked?"
"Create a high priority bug task"
```

## Workflows

### Standard Development Flow
1. Create task: `/backlog create "New feature"`
2. Start work: `/backlog move 1 in-progress`
3. Track with todos: Automatic sync
4. Complete: `/backlog move 1 done`
5. Archive: `/backlog archive --older-than=30d`

### Quick Task
```bash
/bl c "Quick fix" --priority=high
# Automatically moves to in-progress when you start
# Automatically completes when all todos are done
```

## Best Practices

1. **One task, one purpose** - Keep tasks focused and atomic
2. **Clear acceptance criteria** - Define what "done" means
3. **Regular archiving** - Keep your board clean
4. **Descriptive titles** - Make tasks searchable
5. **Use labels** - Categorize for easy filtering

## Command Shortcuts

- `/bl` → `/backlog`
- `/bl b` → `/backlog board`
- `/bl c` → `/backlog create`
- `/bl m` → `/backlog move`

## Configuration

Customize in `.claude/.backlog.config.yml`:

```yaml
# Custom columns
columns:
  - todo
  - in-progress
  - review
  - testing
  - done

# Default filters
default_filters:
  board: "assignee:@me"
  list: "status:!archived"
```

## See Also

- [Backlog.md GitHub](https://github.com/MrLesk/Backlog.md)
- [SuperClaude Task Management](/task)
- [Todo Integration](TodoWrite/TodoRead)