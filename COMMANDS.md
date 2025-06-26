# SuperClaude Commands Reference v2.0.1

## Table of Contents
- [Quick Start](#quick-start)
- [Universal Flags (Available on ALL Commands)](#universal-flags-available-on-all-commands)
- [Personas as Flags](#personas-as-flags)
- [Complete Command Reference](#complete-command-reference)
- [Flag Combinations & Best Practices](#flag-combinations--best-practices)

---

## Quick Start

**Basic Usage**: `/command [flags] [arguments]`

**Example Commands**:
```bash
/review --files src/ --quality --evidence    # Comprehensive code review with evidence
/analyze --code --persona-architect          # Code analysis with architect mindset
/build --react --magic --tdd                # Build React app with AI components
/troubleshoot --prod --five-whys --seq      # Production debugging with reasoning
/deploy --env prod --plan --validate        # Safe production deployment
```

---

## Universal Flags (Available on ALL Commands)

### 🧠 Thinking Depth Control
| Flag | Description | Token Usage |
|------|-------------|-------------|
| `--think` | Multi-file analysis with expanded context | ~4K tokens |
| `--think-hard` | Architecture-level depth analysis | ~10K tokens |
| `--ultrathink` | Critical system analysis with maximum depth | ~32K tokens |

### 📦 Token Optimization
| Flag | Alias | Description |
|------|-------|-------------|
| `--uc` | `--ultracompressed` | Activate UltraCompressed mode (huge token reduction) |

### 🔧 MCP Server Control
| Flag | Description |
|------|-------------|
| `--c7` | Enable Context7 documentation lookup |
| `--seq` | Enable Sequential thinking analysis |
| `--magic` | Enable Magic UI component generation |
| `--pup` | Enable Puppeteer browser automation |
| `--all-mcp` | Enable all MCP servers for maximum capability |
| `--no-mcp` | Disable all MCP servers (native tools only) |
| `--no-c7` | Disable Context7 specifically |
| `--no-seq` | Disable Sequential thinking specifically |
| `--no-magic` | Disable Magic UI builder specifically |
| `--no-pup` | Disable Puppeteer specifically |

### 🔍 Analysis & Introspection
| Flag | Description |
|------|-------------|
| `--introspect` | Enable self-aware analysis with cognitive transparency |

### 📋 Planning & Execution
| Flag | Description |
|------|-------------|
| `--plan` | Show detailed execution plan before running |
| `--dry-run` | Preview changes without execution |
| `--watch` | Continuous monitoring with real-time feedback |
| `--interactive` | Step-by-step guided process |
| `--force` | Override safety checks (use with caution) |

### ✅ Quality & Validation
| Flag | Description |
|------|-------------|
| `--validate` | Enhanced pre-execution safety checks |
| `--security` | Security-focused analysis and validation |
| `--coverage` | Generate comprehensive coverage analysis |
| `--strict` | Zero-tolerance mode with enhanced validation |

---

## Personas as Flags

All personas are now integrated as flags, available on every command:

| Persona Flag | Expertise | Best For |
|--------------|-----------|----------|
| `--persona-architect` | Systems thinking, scalability, patterns | Architecture decisions, system design |
| `--persona-frontend` | UI/UX obsessed, accessibility-first | User interfaces, component design |
| `--persona-backend` | APIs, databases, reliability | Server architecture, data modeling |
| `--persona-analyzer` | Root cause analysis, evidence-based | Complex debugging, investigations |
| `--persona-security` | Threat modeling, zero-trust, OWASP | Security audits, vulnerability assessment |
| `--persona-mentor` | Teaching, guided learning, clarity | Documentation, knowledge transfer |
| `--persona-refactorer` | Code quality, maintainability | Code cleanup, technical debt |
| `--persona-performance` | Optimization, profiling, efficiency | Performance tuning, bottlenecks |
| `--persona-qa` | Testing, edge cases, validation | Quality assurance, test coverage |

---

## Complete Command Reference

### 🛠️ Development Commands (3)

#### `/build` - Universal Project Builder
Build projects, features, and components using modern stack templates.

**Command-Specific Flags:**
- `--init` - Initialize new project with stack setup
- `--feature` - Implement feature using existing patterns
- `--tdd` - Test-driven development workflow
- `--react` - React with Vite, TypeScript, Router
- `--api` - Express.js API with TypeScript
- `--fullstack` - Complete React + Node.js + Docker
- `--mobile` - React Native with Expo
- `--cli` - Commander.js CLI with testing

**Examples:**
```bash
/build --init --react --magic --tdd         # New React app with AI components
/build --feature "auth system" --tdd        # Feature with tests
/build --api --openapi --seq                # API with documentation
```

#### `/dev-setup` - Development Environment
Configure professional development environments with CI/CD and monitoring.

**Command-Specific Flags:**
- `--install` - Install and configure dependencies
- `--ci` - CI/CD pipeline configuration
- `--monitor` - Monitoring and observability setup
- `--docker` - Containerization setup
- `--testing` - Testing infrastructure
- `--team` - Team collaboration tools
- `--standards` - Code quality standards

**Examples:**
```bash
/dev-setup --install --ci --monitor         # Complete environment
/dev-setup --team --standards --docs        # Team setup
```

#### `/test` - Comprehensive Testing Framework
Create, run, and maintain testing strategies across the stack.

**Command-Specific Flags:**
- `--e2e` - End-to-end testing
- `--integration` - Integration testing
- `--unit` - Unit testing
- `--visual` - Visual regression testing
- `--mutation` - Mutation testing
- `--performance` - Performance testing
- `--accessibility` - Accessibility testing
- `--parallel` - Parallel test execution

**Examples:**
```bash
/test --coverage --e2e --pup               # Full test suite
/test --mutation --strict                  # Test quality validation
```

### 🔍 Analysis & Improvement Commands (5)

#### `/review` - AI-Powered Code Review
Comprehensive code review and quality analysis with evidence-based recommendations.

**Command-Specific Flags:**
- `--files` - Review specific files or directories
- `--commit` - Review changes in specified commit (HEAD, hash, range)
- `--pr` - Review pull request changes (git diff main..branch)
- `--quality` - Focus on code quality issues (DRY, SOLID, complexity)
- `--evidence` - Include sources and documentation for all suggestions
- `--fix` - Suggest specific fixes for identified issues
- `--summary` - Generate executive summary of review findings

**Examples:**
```bash
/review --files src/auth.ts --persona-security    # Security-focused file review
/review --commit HEAD --quality --evidence        # Quality review with sources
/review --pr 123 --all --interactive             # Comprehensive PR review
/review --files src/ --persona-performance --think # Performance analysis
```

#### `/analyze` - Multi-Dimensional Analysis
Comprehensive analysis of code, architecture, performance, and security.

**Command-Specific Flags:**
- `--code` - Code quality analysis
- `--architecture` - System design assessment
- `--profile` - Performance profiling
- `--deps` - Dependency analysis
- `--surface` - Quick overview
- `--deep` - Comprehensive analysis
- `--forensic` - Detailed investigation

**Examples:**
```bash
/analyze --code --architecture --seq       # Full analysis
/analyze --profile --deep --persona-performance  # Performance deep-dive
```

#### `/troubleshoot` - Professional Debugging
Systematic debugging and issue resolution.

**Command-Specific Flags:**
- `--investigate` - Systematic issue analysis
- `--five-whys` - Root cause analysis
- `--prod` - Production debugging
- `--perf` - Performance investigation
- `--fix` - Complete resolution
- `--hotfix` - Emergency fixes
- `--rollback` - Safe rollback

**Examples:**
```bash
/troubleshoot --prod --five-whys --seq    # Production RCA
/troubleshoot --perf --fix --pup          # Performance fix
```

#### `/improve` - Enhancement & Optimization
Evidence-based improvements with measurable outcomes.

**Command-Specific Flags:**
- `--quality` - Code structure improvements
- `--performance` - Performance optimization
- `--accessibility` - Accessibility improvements
- `--iterate` - Iterative improvement
- `--threshold` - Quality target percentage
- `--refactor` - Systematic refactoring
- `--modernize` - Technology updates

**Examples:**
```bash
/improve --quality --iterate --threshold 95%    # Quality improvement
/improve --performance --cache --pup            # Performance boost
```

#### `/explain` - Technical Documentation
Generate comprehensive explanations and documentation.

**Command-Specific Flags:**
- `--depth` - Complexity level (ELI5|beginner|intermediate|expert)
- `--visual` - Include diagrams
- `--examples` - Code examples
- `--api` - API documentation
- `--architecture` - System documentation
- `--tutorial` - Learning tutorials
- `--reference` - Reference docs

**Examples:**
```bash
/explain --depth expert --visual --seq     # Expert documentation
/explain --api --examples --c7             # API docs with examples
```

### ⚙️ Operations Commands (6)

#### `/deploy` - Application Deployment
Safe deployment with rollback capabilities.

**Command-Specific Flags:**
- `--env` - Target environment (dev|staging|prod)
- `--canary` - Canary deployment
- `--blue-green` - Blue-green deployment
- `--rolling` - Rolling deployment
- `--checkpoint` - Create checkpoint
- `--rollback` - Rollback to previous
- `--monitor` - Post-deployment monitoring

**Examples:**
```bash
/deploy --env prod --canary --monitor      # Canary production deploy
/deploy --rollback --env prod              # Emergency rollback
```

#### `/migrate` - Database & Code Migration
Safe migrations with rollback capabilities.

**Command-Specific Flags:**
- `--database` - Database migrations
- `--code` - Code migrations
- `--config` - Configuration migrations
- `--dependencies` - Dependency updates
- `--backup` - Create backup first
- `--rollback` - Rollback migration
- `--validate` - Data integrity checks

**Examples:**
```bash
/migrate --database --backup --validate    # Safe DB migration
/migrate --code --dry-run                  # Preview code changes
```

#### `/scan` - Security & Validation
Comprehensive security auditing and compliance.

**Command-Specific Flags:**
- `--owasp` - OWASP Top 10 compliance
- `--secrets` - Secret detection
- `--compliance` - Regulatory compliance
- `--quality` - Code quality validation
- `--automated` - Continuous monitoring

**Examples:**
```bash
/scan --security --owasp --deps           # Security audit
/scan --compliance --gdpr --strict        # Compliance check
```

#### `/estimate` - Project Estimation
Professional estimation with risk assessment.

**Command-Specific Flags:**
- `--detailed` - Comprehensive breakdown
- `--rough` - Quick estimation
- `--worst-case` - Pessimistic estimate
- `--agile` - Story point estimation
- `--complexity` - Technical assessment
- `--resources` - Resource planning
- `--timeline` - Timeline planning
- `--risk` - Risk assessment

**Examples:**
```bash
/estimate --detailed --complexity --risk   # Full estimation
/estimate --agile --story-points          # Agile planning
```

#### `/cleanup` - Project Maintenance
Professional cleanup with safety validations.

**Command-Specific Flags:**
- `--code` - Remove dead code
- `--files` - Clean build artifacts
- `--deps` - Remove unused dependencies
- `--git` - Clean git repository
- `--all` - Comprehensive cleanup
- `--aggressive` - Deep cleanup
- `--conservative` - Safe cleanup

**Examples:**
```bash
/cleanup --all --dry-run                  # Preview cleanup
/cleanup --code --deps --validate         # Code cleanup
```

#### `/git` - Git Workflow Management
Professional Git operations with safety features.

**Command-Specific Flags:**
- `--status` - Repository status
- `--commit` - Professional commit
- `--branch` - Branch management
- `--sync` - Remote synchronization
- `--checkpoint` - Create checkpoint
- `--merge` - Smart merge
- `--history` - History analysis
- `--pre-commit` - Setup and run pre-commit hooks

**Examples:**
```bash
/git --checkpoint "before refactor"       # Safety checkpoint
/git --commit --validate --test          # Safe commit
/git --pre-commit                        # Setup pre-commit hooks
/git --commit --pre-commit               # Commit with validation
```

### 🎨 Design & Architecture Commands (1)

#### `/design` - System Architecture
Professional system design with specifications.

**Command-Specific Flags:**
- `--api` - REST/GraphQL design
- `--ddd` - Domain-driven design
- `--microservices` - Microservices architecture
- `--event-driven` - Event patterns
- `--openapi` - OpenAPI specs
- `--graphql` - GraphQL schema
- `--bounded-context` - DDD contexts
- `--integration` - Integration patterns

**Examples:**
```bash
/design --api --ddd --openapi --seq      # API with DDD
/design --microservices --event-driven   # Microservices design
```

### 🔄 Workflow Commands (3)

#### `/spawn` - Specialized Agents
Spawn focused agents for parallel tasks.

**Command-Specific Flags:**
- `--task` - Define specific task
- `--parallel` - Concurrent execution
- `--specialized` - Domain expertise
- `--collaborative` - Multi-agent work
- `--sync` - Synchronize results
- `--merge` - Merge outputs

**Examples:**
```bash
/spawn --task "frontend tests" --parallel  # Parallel testing
/spawn --collaborative --sync              # Team simulation
```

#### `/document` - Documentation Creation
Professional documentation in multiple formats.

**Command-Specific Flags:**
- `--user` - User guides
- `--technical` - Developer docs
- `--markdown` - Markdown format
- `--interactive` - Interactive docs
- `--multilingual` - Multi-language
- `--maintain` - Maintenance plan

**Examples:**
```bash
/document --api --interactive --examples   # API documentation
/document --user --visual --multilingual   # User guides
```

#### `/load` - Project Context Loading
Load and analyze project context.

**Command-Specific Flags:**
- `--depth` - Analysis depth (shallow|normal|deep)
- `--context` - Context preservation
- `--patterns` - Pattern recognition
- `--relationships` - Dependency mapping
- `--structure` - Project structure
- `--health` - Project health
- `--standards` - Coding standards

**Examples:**
```bash
/load --depth deep --patterns --seq       # Deep analysis
/load --structure --health --standards   # Project assessment
```

---

## Flag Combinations & Best Practices

### 🚀 Professional Workflows

**Full-Stack Development**
```bash
/design --api --ddd --persona-architect
/build --fullstack --tdd --magic
/test --coverage --e2e --pup
/deploy --env staging --validate
```

**Security-First Development**
```bash
/scan --security --owasp --deps --persona-security
/analyze --security --forensic --seq
/improve --security --validate --strict
/test --security --coverage
```

**Performance Optimization**
```bash
/analyze --profile --deep --persona-performance
/troubleshoot --perf --investigate --pup
/improve --performance --iterate --threshold 90%
/test --performance --load
```

**Quality Assurance**
```bash
/review --quality --evidence --persona-qa
/improve --quality --refactor --strict
/scan --validate --quality
/test --coverage --mutation
```

### 💡 Best Practices

1. **Always validate risky operations**
   ```bash
   /deploy --env prod --validate --plan
   /migrate --database --dry-run --backup
   ```

2. **Use personas for specialized expertise**
   ```bash
   /analyze --architecture --persona-architect
   /scan --security --persona-security
   ```

3. **Combine MCP servers for maximum capability**
   ```bash
   /build --react --magic --seq --c7
   /test --e2e --pup --coverage
   ```

4. **Progressive thinking for complex tasks**
   ```bash
   /troubleshoot --investigate --think
   /design --microservices --think-hard
   /analyze --architecture --ultrathink
   ```

### 🎯 Quick Reference

**High-Risk Operations**: Always use `--validate` or `--dry-run`
**Documentation Tasks**: Enable `--c7` for library lookups
**Complex Analysis**: Use `--seq` for reasoning
**UI Development**: Enable `--magic` for AI components
**Testing**: Use `--pup` for browser automation
**Token Saving**: Add `--uc` for 70% reduction

---

**SuperClaude v2.0.1** - 18 professional commands | 9 cognitive personas | Advanced MCP integration | Evidence-based methodology
