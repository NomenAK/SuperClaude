---
allowed-tools: [Read, Grep, TodoWrite]
description: "Analyze user queries and recommend optimal SuperClaude commands"
---

# /sc:recommend - Command Recommendation Engine

## Purpose
Analyze what you're trying to accomplish and recommend the most appropriate SuperClaude commands, flags, and approaches to achieve your goal efficiently.

## Usage
```
/sc:recommend [query description]
```

## Arguments
- `query description` - Natural language description of what you want to accomplish

## Execution
1. Parse query to identify action verbs, artifacts, and domain indicators
2. Classify intent (CREATE, MODIFY, FIX, ANALYZE, OPTIMIZE, DOCUMENT)
3. Detect technical domains (frontend, backend, security, performance, etc.)
4. Calculate complexity score based on scope, domains, and uncertainty
5. Select optimal commands and flag combinations
6. Generate step-by-step recommendations with reasoning

## Claude Code Integration
- Analyzes natural language to understand developer intent
- Maps intentions to specific SuperClaude capabilities
- Recommends appropriate MCP servers and personas
- Provides contextual workflow suggestions

## Query Analysis Framework

### Intent Classification
- **CREATE**: build, create, implement, make, develop, add
- **MODIFY**: change, update, refactor, improve, enhance
- **FIX**: fix, debug, troubleshoot, resolve, solve
- **ANALYZE**: analyze, understand, explain, investigate, review
- **OPTIMIZE**: optimize, speed up, improve performance
- **DOCUMENT**: document, write, describe, explain

### Domain Detection
- **Frontend**: UI, component, React, Vue, CSS, responsive, design
- **Backend**: API, database, server, endpoint, service, REST
- **Security**: vulnerability, auth, encryption, compliance
- **Performance**: slow, optimize, bottleneck, speed
- **Infrastructure**: deploy, Docker, AWS, CI/CD, cloud

### Complexity Assessment
Factors that increase complexity:
- Multiple domains involved
- System-wide scope ("entire", "all", "comprehensive")
- Uncertainty indicators ("sometimes", "intermittent")
- Production/critical systems
- Legacy code or technical debt

## Command Selection Logic

### Simple Tasks (Single Domain, Clear Path)
| Query Pattern | Recommendation |
|---------------|----------------|
| "create a [UI component]" | `/sc:implement --magic` |
| "fix [specific bug]" | `/sc:troubleshoot` |
| "explain [code/concept]" | `/sc:explain` |
| "add tests" | `/sc:test` |
| "document [feature]" | `/sc:document` |
| "deploy [application]" | `/sc:git` |

### Moderate Tasks (2-3 Domains, Some Investigation)
| Query Pattern | Recommendation |
|---------------|----------------|
| "implement [feature]" | `/sc:design` → `/sc:implement` |
| "debug [complex issue]" | `/sc:troubleshoot --think` |
| "improve [module]" | `/sc:analyze` → `/sc:improve` |
| "optimize [performance]" | `/sc:analyze --performance` → `/sc:improve` |
| "refactor [code]" | `/sc:analyze` → `/sc:improve --quality` |

### Complex Tasks (Multiple Domains, Significant Work)
| Query Pattern | Recommendation |
|---------------|----------------|
| "redesign [system]" | `/sc:analyze --ultrathink` → `/sc:design` → `/sc:task` |
| "fix performance issues" | `/sc:analyze --think-hard` → `/sc:improve --wave-mode` |
| "security audit" | `/sc:analyze --security --ultrathink` |
| "modernize legacy code" | `/sc:analyze` → `/sc:improve --wave-mode --systematic` |
| "build complete feature" | `/sc:design` → `/sc:task` → `/sc:implement --wave-mode` |

## Flag Recommendations

### Thinking Flags
- `--think`: Module-level analysis (5-20 files)
- `--think-hard`: System-wide analysis (20-50 files)
- `--ultrathink`: Critical analysis (50+ files or high complexity)

### MCP Server Flags
- `--magic`: UI component generation
- `--c7`/`--context7`: Library documentation and patterns
- `--seq`/`--sequential`: Complex reasoning and analysis
- `--play`/`--playwright`: Browser testing and automation

### Efficiency Flags
- `--uc`: Token compression for large operations
- `--delegate`: Parallel processing for many files
- `--wave-mode`: Multi-stage improvement campaigns

### Persona Flags
Auto-activated based on domain:
- Frontend work → `--persona-frontend`
- Backend work → `--persona-backend`
- Security concerns → `--persona-security`
- Performance issues → `--persona-performance`
- Code quality → `--persona-refactorer`

## Examples

### Example 1: UI Component Creation
```
/sc:recommend "create a dropdown menu component"

Analysis:
• Intent: CREATE
• Domain: frontend
• Complexity: Low

Recommendation:
→ Use: /sc:implement --magic --c7
→ Why: Magic generates UI components, Context7 provides React/Vue patterns
→ Persona: frontend (auto-activated)
```

### Example 2: Performance Problem
```
/sc:recommend "our API endpoints are really slow"

Analysis:
• Intent: FIX + OPTIMIZE
• Domain: backend, performance
• Complexity: High (requires investigation)

Recommendation:
→ Step 1: /sc:analyze --think --focus performance
  (Understand current performance bottlenecks)
→ Step 2: /sc:troubleshoot --seq
  (Identify root causes systematically)
→ Step 3: /sc:improve --performance
  (Implement optimizations)
→ Persona: performance + backend
```

### Example 3: Feature Implementation
```
/sc:recommend "implement user authentication system"

Analysis:
• Intent: CREATE
• Domain: backend, security
• Complexity: High (security-critical, multiple components)

Recommendation:
→ Step 1: /sc:design authentication architecture
→ Step 2: /sc:implement --seq --c7
  (Sequential for logic flow, Context7 for auth patterns)
→ Step 3: /sc:test security scenarios
→ Persona: security + backend
→ Consider: --validate flag for security-critical code
```

### Example 4: Code Quality Improvement
```
/sc:recommend "clean up and refactor our old payment module"

Analysis:
• Intent: MODIFY + OPTIMIZE
• Domain: backend, quality
• Complexity: High (payment = critical, legacy = risky)

Recommendation:
→ Step 1: /sc:analyze --think payment module
  (Understand current structure and issues)
→ Step 2: /sc:improve --wave-mode --systematic
  (Multi-pass improvement with validation)
→ Step 3: /sc:test comprehensive regression
→ Flags: --validate --safe-mode (critical system)
→ Persona: refactorer + backend
```

### Example 5: Debugging Complex Issue
```
/sc:recommend "users randomly can't complete checkout sometimes"

Analysis:
• Intent: FIX
• Domain: full-stack (could be frontend or backend)
• Complexity: Very High (intermittent, critical flow)

Recommendation:
→ Step 1: /sc:analyze --ultrathink checkout flow
  (Deep analysis of entire checkout system)
→ Step 2: /sc:troubleshoot --think --seq --delegate
  (Systematic debugging with parallel investigation)
→ Step 3: /sc:test --play user checkout scenarios
  (Reproduce and validate fix)
→ Consider: Enable logging/monitoring first
→ Persona: analyzer + qa
```

## Decision Patterns

### When to Use Wave Mode
Recommend `--wave-mode` when:
- Complexity score ≥ 0.7
- Multiple operation types needed
- 20+ files involved
- Systematic improvement required

### When to Use Delegation
Recommend `--delegate` when:
- 50+ files to analyze
- 7+ directories to process
- Parallel analysis beneficial
- Independent file operations

### When to Use Ultra Thinking
Recommend `--ultrathink` when:
- System-wide architectural decisions
- Security-critical analysis
- Legacy system modernization
- Performance crisis resolution

## Quick Reference

| User Says | Primary Recommendation |
|-----------|------------------------|
| "build a [component]" | `/sc:implement --magic` |
| "create an API" | `/sc:implement --seq` |
| "fix this bug" | `/sc:troubleshoot` |
| "make it faster" | `/sc:analyze --performance` → `/sc:improve` |
| "explain this" | `/sc:explain` |
| "add documentation" | `/sc:document` |
| "improve code quality" | `/sc:improve --quality` |
| "refactor everything" | `/sc:analyze` → `/sc:improve --wave-mode` |
| "security review" | `/sc:analyze --security --ultrathink` |
| "deploy changes" | `/sc:git` |

## Output Format

Recommendations follow this structure:
1. **Analysis Summary**: Intent, domain, complexity
2. **Primary Command**: The main command to use
3. **Flags**: Recommended flags with explanations
4. **Workflow**: Step-by-step for complex tasks
5. **Reasoning**: Why this approach is optimal
6. **Alternatives**: Other valid approaches if applicable

The goal is to provide clear, actionable guidance that helps users leverage SuperClaude's full capabilities effectively.