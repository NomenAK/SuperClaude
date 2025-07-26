# SuperClaude Query Analysis & Command Selection Guide

This guide helps analyze user queries and recommend the most appropriate SuperClaude commands, flags, personas, and tools when using Claude Code.

## Query Analysis Framework

### 1. Intent Classification System

When analyzing a user query, classify it into one or more of these primary intents:

#### Development Intents
- **CREATE**: Building new features, components, or systems
- **MODIFY**: Changing existing code, refactoring, updating
- **FIX**: Debugging, troubleshooting, resolving issues
- **ANALYZE**: Understanding code, investigating problems, reviewing architecture
- **OPTIMIZE**: Improving performance, reducing complexity, enhancing quality
- **DOCUMENT**: Creating documentation, explanations, guides

#### Scope Indicators
- **FILE**: Single file operations
- **MODULE**: Directory or module-level work
- **PROJECT**: Entire project modifications
- **SYSTEM**: Multi-project or infrastructure-wide changes

#### Complexity Markers
- **SIMPLE**: <3 steps, single domain, clear path
- **MODERATE**: 3-10 steps, 2-3 domains, some investigation needed
- **COMPLEX**: >10 steps, multiple domains, significant analysis required
- **CRITICAL**: High-risk operations, security implications, production systems

### 2. Domain Detection Patterns

Identify the technical domain(s) involved:

```yaml
frontend:
  keywords: [UI, component, React, Vue, CSS, responsive, accessibility, user interface, design system]
  indicators: [.jsx, .tsx, .vue, .css, .scss files]
  
backend:
  keywords: [API, server, database, endpoint, service, authentication, REST, GraphQL]
  indicators: [controllers/, models/, api/, services/ directories]
  
infrastructure:
  keywords: [deploy, Docker, CI/CD, AWS, cloud, kubernetes, terraform]
  indicators: [Dockerfile, .yml, .yaml, terraform files]
  
security:
  keywords: [vulnerability, auth, encryption, audit, compliance, penetration, threat]
  indicators: [auth modules, security configs, certificates]
  
quality:
  keywords: [test, quality, coverage, lint, clean, refactor, improve, polish]
  indicators: [test files, quality metrics, code smells]
```

### 3. Command Selection Matrix

Based on intent + domain + complexity, select the primary command:

| Intent | Simple | Moderate | Complex |
|--------|---------|-----------|----------|
| **CREATE + Frontend** | `/sc:implement` + `--magic` | `/sc:implement` + `--magic --c7` | `/sc:design` + `/sc:implement` + `--wave-mode` |
| **CREATE + Backend** | `/sc:implement` | `/sc:implement` + `--seq` | `/sc:design` + `/sc:implement` + `--seq --think` |
| **CREATE + Full Feature** | `/sc:implement` | `/sc:task` + `/sc:implement` | `/sc:design` + `/sc:task` + `--wave-mode` |
| **ANALYZE + Any** | `/sc:explain` | `/sc:analyze` | `/sc:analyze` + `--think-hard` or `--ultrathink` |
| **FIX + Debug** | `/sc:troubleshoot` | `/sc:troubleshoot` + `--think` | `/sc:analyze` + `--seq --think-hard` |
| **OPTIMIZE + Performance** | `/sc:improve` | `/sc:improve` + `--focus performance` | `/sc:analyze` + `/sc:improve` + `--wave-mode` |
| **OPTIMIZE + Quality** | `/sc:cleanup` | `/sc:improve` + `--focus quality` | `/sc:improve` + `--loop --wave-mode` |
| **DOCUMENT** | `/sc:document` | `/sc:document` + `--persona-scribe` | `/sc:document` + `/sc:explain` |

### 4. Flag Selection Logic

#### Thinking Flags (Complexity-Based)
```yaml
--think: 
  when: "Module-level analysis, 5+ files, debugging complex issues"
  tokens: ~4K
  
--think-hard:
  when: "System-wide analysis, architectural decisions, 20+ files"
  tokens: ~10K
  
--ultrathink:
  when: "Critical redesign, enterprise scale, security audit, 50+ files"
  tokens: ~32K
```

#### MCP Server Flags
```yaml
--c7 / --context7:
  auto_activate: "External library usage, framework questions, best practices"
  examples: "Using React hooks, implementing AWS SDK, framework patterns"
  
--seq / --sequential:
  auto_activate: "Complex debugging, multi-step analysis, any --think flag"
  examples: "Root cause analysis, system design, performance bottlenecks"
  
--magic:
  auto_activate: "UI component creation, design system work, frontend persona"
  examples: "Create button component, build responsive layout, implement modal"
  
--play / --playwright:
  auto_activate: "E2E testing, browser automation, visual testing"
  examples: "Test user workflows, capture screenshots, cross-browser testing"
```

#### Efficiency Flags
```yaml
--uc / --ultracompressed:
  auto_activate: "Context usage >75%, large operations, token conservation"
  benefit: "30-50% token reduction"
  
--delegate:
  auto_activate: ">7 directories OR >50 files"
  options: [files, folders, auto]
  benefit: "40-70% time savings"
  
--wave-mode:
  auto_activate: "complexity ≥0.7 AND files >20 AND operation_types >2"
  strategies: [progressive, systematic, adaptive, enterprise]
  benefit: "30-50% better results"
```

### 5. Persona Activation Patterns

#### Automatic Persona Selection
```yaml
architect:
  triggers: ["system design", "architecture", "scalability", "long-term"]
  confidence: 95%
  commands: [analyze, design, estimate]
  
frontend:
  triggers: ["component", "UI", "responsive", "accessibility"]
  confidence: 90%
  commands: [implement, build, improve]
  
backend:
  triggers: ["API", "database", "service", "reliability"]
  confidence: 92%
  commands: [implement, build, analyze]
  
security:
  triggers: ["vulnerability", "audit", "compliance", "threat"]
  confidence: 95%
  commands: [analyze, improve, troubleshoot]
  
performance:
  triggers: ["optimize", "slow", "bottleneck", "performance"]
  confidence: 90%
  commands: [analyze, improve, test]
```

### 6. Decision Trees

#### For Feature Implementation
```
User wants to implement feature?
├─ Is it UI-focused?
│  ├─ Yes → `/sc:implement --magic`
│  │  └─ Complex UI? → Add `--c7` for patterns
│  └─ No → Continue
├─ Is it backend-focused?
│  ├─ Yes → `/sc:implement --seq`
│  │  └─ Complex logic? → Add `--think`
│  └─ No → Continue
├─ Is it full-stack?
│  ├─ Simple → `/sc:implement`
│  ├─ Moderate → `/sc:task` then `/sc:implement`
│  └─ Complex → `/sc:design` → `/sc:task` → `/sc:implement --wave-mode`
```

#### For Problem Solving
```
User has a problem?
├─ Is it a bug?
│  ├─ Simple → `/sc:troubleshoot`
│  ├─ Complex → `/sc:troubleshoot --think --seq`
│  └─ System-wide → `/sc:analyze --ultrathink`
├─ Is it performance?
│  ├─ Known area → `/sc:improve --focus performance`
│  └─ Unknown → `/sc:analyze --focus performance` → `/sc:improve`
├─ Is it quality/technical debt?
│  ├─ Small scope → `/sc:cleanup`
│  └─ Large scope → `/sc:improve --loop --wave-mode`
```

#### For Analysis Tasks
```
User needs analysis?
├─ Documentation/Learning?
│  ├─ Simple explanation → `/sc:explain`
│  └─ Comprehensive → `/sc:explain --persona-mentor`
├─ Code understanding?
│  ├─ Single module → `/sc:analyze`
│  ├─ Multi-module → `/sc:analyze --think`
│  └─ Architecture → `/sc:analyze --think-hard`
├─ Quality assessment?
│  └─ → `/sc:analyze --focus quality`
```

### 7. Common Patterns & Recommendations

#### Pattern: "Build a [UI component]"
```yaml
commands: ["/sc:implement"]
flags: ["--magic", "--c7"]
persona: frontend
explanation: "Magic for component generation, Context7 for framework patterns"
```

#### Pattern: "Fix [performance issue]"
```yaml
commands: ["/sc:analyze", "/sc:improve"]
flags: ["--focus performance", "--think", "--play"]
persona: performance
explanation: "Analyze first to identify bottlenecks, then improve with metrics"
```

#### Pattern: "Implement [API endpoint]"
```yaml
commands: ["/sc:implement"]
flags: ["--seq", "--c7"]
persona: backend
explanation: "Sequential for logic flow, Context7 for best practices"
```

#### Pattern: "Refactor [large module]"
```yaml
commands: ["/sc:analyze", "/sc:improve"]
flags: ["--wave-mode", "--systematic-waves", "--validate"]
persona: refactorer
explanation: "Wave mode for systematic multi-pass improvement"
```

#### Pattern: "Debug [complex issue]"
```yaml
commands: ["/sc:troubleshoot", "/sc:analyze"]
flags: ["--think", "--seq", "--delegate"]
persona: analyzer
explanation: "Deep thinking with systematic analysis, delegate for parallel investigation"
```

### 8. Complexity Assessment Formula

```python
complexity_score = (
    (scope_factor * 0.3) +      # file, module, project, system
    (step_count * 0.2) +        # number of steps required
    (domain_count * 0.2) +      # number of domains involved
    (risk_factor * 0.2) +       # security, production, data loss risk
    (uncertainty * 0.1)         # ambiguity in requirements
)

if complexity_score >= 0.7:
    recommend_wave_mode = True
if complexity_score >= 0.5:
    recommend_delegation = True
if complexity_score >= 0.8:
    recommend_ultrathink = True
```

### 9. MCP Server Selection Strategy

```yaml
Context7:
  best_for: ["library documentation", "framework patterns", "best practices"]
  avoid_when: ["no external dependencies", "custom business logic"]
  
Sequential:
  best_for: ["complex analysis", "multi-step reasoning", "debugging"]
  avoid_when: ["simple queries", "straightforward implementation"]
  
Magic:
  best_for: ["UI components", "design systems", "frontend generation"]
  avoid_when: ["backend logic", "infrastructure", "analysis tasks"]
  
Playwright:
  best_for: ["E2E testing", "browser automation", "visual validation"]
  avoid_when: ["unit testing", "backend testing", "static analysis"]
```

### 10. Example Query Analysis

#### Query: "Help me build a responsive dashboard with charts"
```yaml
analysis:
  intent: CREATE
  domain: frontend
  complexity: moderate
  specific_needs: [UI components, responsive design, data visualization]

recommendation:
  primary_command: "/sc:implement"
  flags: ["--magic", "--c7"]
  persona: "--persona-frontend"
  reasoning: "Magic for component generation, Context7 for charting library patterns"
  
workflow:
  1. "/sc:design dashboard layout"
  2. "/sc:implement --magic responsive grid system"
  3. "/sc:implement --magic --c7 chart components"
  4. "/sc:test --play visual responsiveness"
```

#### Query: "Our API is slow and timing out under load"
```yaml
analysis:
  intent: [ANALYZE, OPTIMIZE]
  domain: [backend, infrastructure]
  complexity: complex
  risk: high (production issue)

recommendation:
  primary_command: "/sc:analyze"
  flags: ["--think-hard", "--seq", "--focus performance"]
  persona: "--persona-performance"
  follow_up: "/sc:improve --wave-mode --performance"
  
workflow:
  1. "/sc:analyze --think-hard --focus performance API bottlenecks"
  2. "/sc:troubleshoot --seq timeout issues"
  3. "/sc:improve --wave-mode --progressive-waves performance optimization"
  4. "/sc:test --benchmark load testing"
```

### 11. Anti-Patterns to Avoid

1. **Over-tooling Simple Tasks**: Don't use `--ultrathink` for single-file changes
2. **Wrong Domain Tools**: Don't use `--magic` for backend logic
3. **Skipping Analysis**: Don't jump to `/sc:improve` without `/sc:analyze` for complex issues
4. **Ignoring Complexity**: Don't use simple commands for system-wide changes
5. **Manual When Automation Exists**: Use `--delegate` for large-scale operations

### 12. Quick Reference Card

| User Says | Recommend |
|-----------|-----------|
| "create a button" | `/sc:implement --magic` |
| "fix this bug" | `/sc:troubleshoot` → `/sc:implement` |
| "make it faster" | `/sc:analyze --performance` → `/sc:improve` |
| "explain how this works" | `/sc:explain` or `/sc:analyze` |
| "add tests" | `/sc:test` |
| "improve code quality" | `/sc:improve --quality` or `/sc:cleanup` |
| "build new feature" | `/sc:design` → `/sc:implement` |
| "refactor everything" | `/sc:analyze` → `/sc:improve --wave-mode` |
| "security audit" | `/sc:analyze --security --ultrathink` |
| "update documentation" | `/sc:document --persona-scribe` |

## Usage Instructions

When a user provides a query:

1. **Classify Intent**: What are they trying to achieve?
2. **Identify Domain**: What technical area is involved?
3. **Assess Complexity**: How many steps, files, and domains?
4. **Select Primary Command**: Use the matrix above
5. **Add Appropriate Flags**: Based on patterns and triggers
6. **Consider Persona**: Let auto-activation work or specify if needed
7. **Plan Workflow**: Break down into sequential commands if complex
8. **Validate Approach**: Check against anti-patterns

Remember: Start simple and add complexity only when needed. The framework's auto-activation features will often select the right tools without explicit flags.