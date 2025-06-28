# SuperClaude Orchestrator Integration Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Initial Setup](#initial-setup)
4. [Basic Usage](#basic-usage)
5. [Advanced Usage](#advanced-usage)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)
8. [Customization](#customization)

---

## Prerequisites

### Required
- **SuperClaude**: Installed via `./install.sh` (usually in `~/.claude/`)
- **Claude Code**: Active subscription at claude.ai/code
- **Project**: Any codebase you want to work with

### Optional (Recommended)
- **MCP Servers**: For enhanced capabilities
  - Context7 (documentation lookup)
  - Sequential (complex reasoning)
  - Magic (UI generation)
  - Puppeteer (browser automation)

---

## Installation Steps

### Step 1: Install SuperClaude
```bash
# Clone SuperClaude repository
git clone https://github.com/NomenAK/SuperClaude.git
cd SuperClaude

# Run installer
./install.sh

# Or with custom directory
./install.sh --dir /custom/path
```

### Step 2: Copy Orchestrator Files
```bash
# Navigate to your project
cd /path/to/your/project

# Create orchestrator directory
mkdir orchestrator

# Copy all 8 orchestrator files into the directory
cp /path/to/orchestrator/*.md orchestrator/
```

### Step 3: Verify Files
Ensure you have all 8 files:
```
orchestrator/
├── README.md
├── ORCHESTRATOR.md
├── COMMAND_MAPPING.md
├── FLAG_COMBINATIONS.md
├── PERSONA_GUIDE.md
├── WORKFLOW_TEMPLATES.md
├── INTEGRATION_GUIDE.md
└── FILE_OVERVIEW.md
```

---

## Initial Setup

### Method 1: Direct Activation (Recommended)

In your Claude Code conversation, paste this exact message:

```
I have a SuperClaude Orchestrator system in the orchestrator/ directory with these files:
- ORCHESTRATOR.md (main command router)
- COMMAND_MAPPING.md (command reference)
- FLAG_COMBINATIONS.md (flag optimization rules)
- PERSONA_GUIDE.md (9 expert personas)
- WORKFLOW_TEMPLATES.md (pre-built workflows)
- INTEGRATION_GUIDE.md (usage instructions)

Please use these files to translate my natural language requests into optimized SuperClaude commands. When I make a request, analyze it using the orchestrator and provide the appropriate SuperClaude command with optimal flags and personas.
```

### Method 2: Reference in CLAUDE.md

Add to your project's CLAUDE.md file:

```markdown
## Orchestrator Integration
This project uses the SuperClaude Orchestrator for natural language command translation.
See orchestrator/ORCHESTRATOR.md for the main routing logic.
Translate all natural language requests into SuperClaude commands using the orchestrator system.
```

### Method 3: Quick Activation

Simply say:
```
Use the orchestrator system in orchestrator/ to handle my requests
```

---

## Basic Usage

### Simple Requests

**You say**: "Review my code"  
**Orchestrator returns**: `/review --quality --evidence --think`

**You say**: "Build a React component"  
**Orchestrator returns**: `/build --react --component --frontend --magic`

**You say**: "Fix this bug"  
**Orchestrator returns**: `/debug --fix --evidence --seq`

### Context-Aware Requests

**You say**: "Security review of my authentication code"  
**Context detected**: security + authentication  
**Orchestrator returns**: `/review --security --auth --evidence --persona-security --owasp`

**You say**: "Deploy to production safely"  
**Context detected**: production + safety  
**Orchestrator returns**: `/deploy --prod --safe --critical --evidence --plan --monitor`

### Using Natural Language

The orchestrator understands various phrasings:

**All these work**:
- "Check my code for bugs"
- "Find bugs in my code"
- "Debug my application"
- "Help me fix issues"

**All translate to**: `/debug --investigate --evidence --think`

---

## Advanced Usage

### Combining Multiple Intents

**You say**: "Build a secure API with testing and documentation"

**Orchestrator breaks down**:
1. Build intent → `/build`
2. Security intent → `--secure --persona-security`
3. API intent → `--api --backend`
4. Testing intent → `--tdd --test`
5. Documentation intent → `--docs --evidence`

**Final command**: `/build --api --secure --tdd --test --docs --persona-backend --evidence`

### Workflow Execution

**You say**: "I need to optimize performance in production"

**Orchestrator suggests workflow**:
```bash
# From WORKFLOW_TEMPLATES.md - Performance Optimization
/analyze --performance --prod --profile --persona-performance --seq
/troubleshoot --performance --five-whys --prod --persona-analyzer
/improve --performance --cache --threshold 90% --evidence
/test --performance --load --benchmark --pup
```

### Emergency Situations

**You say**: "Production is down!"

**Orchestrator recognizes emergency**:
```bash
/troubleshoot --emergency --prod --all-personas --seq
```

### Persona-Specific Requests

**You say**: "Explain this code like I'm a beginner"  
**Orchestrator adds**: `--persona-mentor --depth beginner`

**You say**: "Design a scalable microservices architecture"  
**Orchestrator adds**: `--persona-architect --microservices --scalable`

---

## Troubleshooting

### Issue: Orchestrator Not Responding

**Solution 1**: Verify activation
```
Are you using the orchestrator system in orchestrator/?
```

**Solution 2**: Direct reference
```
Please check orchestrator/ORCHESTRATOR.md and translate my request
```

### Issue: Wrong Command Generated

**Solution**: Be more specific
- Instead of: "fix it"
- Say: "fix the performance issue in the database queries"

### Issue: Missing Flags

**Solution**: Check context
- Add environment: "in production"
- Add intent: "for security"
- Add quality: "with testing"

### Issue: Too Many Flags

**Solution**: Specify constraints
- "Quick review" → Minimal flags
- "Simple build" → Basic flags only
- "Just analyze" → Skip evidence flags

---

## Best Practices

### 1. Start with Natural Language
Don't try to remember commands. Just describe what you want.

### 2. Add Context When Helpful
- **Environment**: "in production", "on staging"
- **Priority**: "urgent", "when you have time"
- **Quality**: "quick and dirty", "production-ready"

### 3. Use Workflows for Complex Tasks
Instead of multiple commands, reference the workflow:
```
"I want to do the security-first development workflow"
```

### 4. Leverage Personas
Mention the expertise you need:
```
"Review this like a security expert would"
"Explain this like a teacher"
```

### 5. Progressive Enhancement
Start simple, add complexity:
```
"Build a feature" → Simple
"Build a secure feature with tests" → Enhanced
"Build a secure feature with tests for production" → Full
```

---

## Customization

### Adding Custom Mappings

Edit `ORCHESTRATOR.md` to add your patterns:

```markdown
### Custom Domain Requests
| User Says | SuperClaude Command |
|-----------|-------------------|
| "Your phrase" | `/command --your --flags` |
```

### Creating Team-Specific Workflows

Add to `WORKFLOW_TEMPLATES.md`:

```markdown
## Your Team Workflow

### Scenario: Your common task

**Workflow**:
```bash
# Your steps here
```
```

### Modifying Flag Combinations

Edit `FLAG_COMBINATIONS.md`:

```markdown
### Your Domain Focus Detection
**Triggers:** "your", "keywords"
**Auto-add:** `--your --flags`
```

### Adding Domain-Specific Personas

While you can't add new personas to SuperClaude, you can create persona combinations in your workflows.

---

## Tips and Tricks

### 1. Batch Operations
```
"Review all my controllers for security issues"
→ Orchestrator understands bulk operations
```

### 2. Conditional Logic
```
"If tests pass, deploy to staging"
→ Orchestrator creates conditional workflow
```

### 3. Time-Based Requests
```
"Schedule a security scan for tonight"
→ Orchestrator adds appropriate timing flags
```

### 4. Learning Mode
```
"Show me how to do X step by step"
→ Orchestrator adds --interactive --persona-mentor
```

### 5. Comparison Requests
```
"Compare React vs Vue for this project"
→ Orchestrator uses research commands
```

---

## Common Patterns

### Development Flow
```
Natural: "Start a new feature"
Process: Design → Build → Test → Deploy
```

### Debugging Flow
```
Natural: "Something is broken"
Process: Investigate → Analyze → Fix → Test
```

### Review Flow
```
Natural: "Is this code good?"
Process: Security → Quality → Performance → Documentation
```

### Learning Flow
```
Natural: "How does this work?"
Process: Explain → Examples → Practice → Validate
```

---

## Integration with CI/CD

The orchestrator can generate commands for automation:

```yaml
# Example: GitHub Actions
- name: Security Review
  run: |
    # Orchestrator command for CI
    /review --security --automated --evidence --strict
```

---

## Measuring Success

You'll know the orchestrator is working when:

1. ✅ You stop looking up command syntax
2. ✅ You describe tasks naturally
3. ✅ Commands include appropriate flags automatically
4. ✅ Complex workflows become simple requests
5. ✅ You get better results with less effort

---

## Next Steps

1. **Practice**: Try simple requests first
2. **Explore**: Check WORKFLOW_TEMPLATES.md for ideas
3. **Customize**: Adapt to your team's needs
4. **Share**: Document your custom patterns

Remember: The orchestrator is here to make SuperClaude accessible. Let it handle the complexity while you focus on what you want to achieve!