# SuperClaude Command Mapping Reference

## Complete Command Catalog
SuperClaude provides 19 specialized commands across 4 categories. This file maps natural language intents to specific commands with optimal flag combinations.

## Development Commands (3)

### `/build` - Project Construction
**Purpose:** Build applications, features, or components  
**Common Flags:**
- `--react` - React application setup
- `--vue` - Vue.js application setup  
- `--node` - Node.js backend setup
- `--api` - API construction
- `--feature` - Feature development
- `--tdd` - Test-driven development
- `--clean` - Clean architecture

**Natural Language Triggers:**
- "Build a new app"
- "Create a React application"
- "Set up a Node.js server"
- "Build a new feature"
- "Construct the API"

**Example Mappings:**
- "Build a React app with testing" → `/build --react --tdd --test --frontend`
- "Create a Node.js API" → `/build --node --api --backend --scalable`

### `/dev-setup` - Development Environment
**Purpose:** Configure development environments
**Common Flags:**
- `--install` - Install dependencies
- `--ci` - CI/CD setup
- `--monitor` - Monitoring setup
- `--docker` - Docker configuration
- `--testing` - Testing infrastructure

**Natural Language Triggers:**
- "Set up development environment"
- "Configure CI/CD"
- "Install dependencies"
- "Set up Docker"

**Example Mappings:**
- "Set up dev environment" → `/dev-setup --install --ci --monitor`
- "Configure Docker" → `/dev-setup --docker --compose`

### `/test` - Testing Framework
**Purpose:** Create and run tests
**Common Flags:**
- `--unit` - Unit tests
- `--integration` - Integration tests
- `--e2e` - End-to-end tests
- `--coverage` - Test coverage
- `--performance` - Performance tests

**Natural Language Triggers:**
- "Run tests"
- "Test the application"
- "Check test coverage"
- "Performance testing"

**Example Mappings:**
- "Run all tests with coverage" → `/test --full --coverage --unit --integration --persona-qa`

## Analysis & Improvement Commands (5)

### `/analyze` - Codebase Analysis
**Purpose:** Analyze code structure, patterns, dependencies
**Common Flags:**
- `--code` - Code quality analysis
- `--architecture` - Architecture analysis
- `--deep` - Comprehensive analysis
- `--dependencies` - Dependency analysis
- `--patterns` - Design pattern analysis
- `--metrics` - Code metrics

**Natural Language Triggers:**
- "Analyze my codebase"
- "Examine the structure"
- "Check dependencies"
- "Review the architecture"

**Example Mappings:**
- "Analyze codebase structure" → `/analyze --architecture --patterns --deep --evidence`
- "Check dependencies" → `/analyze --dependencies --security --evidence`

### `/improve` - Enhancement & Optimization
**Purpose:** Improve code quality and performance
**Common Flags:**
- `--quality` - Code quality improvements
- `--performance` - Performance optimization
- `--accessibility` - Accessibility improvements
- `--iterate` - Iterative improvement
- `--threshold` - Quality target percentage
- `--refactor` - Systematic refactoring

**Natural Language Triggers:**
- "Improve code quality"
- "Optimize performance"
- "Enhance accessibility"
- "Refactor the code"

**Example Mappings:**
- "Optimize performance" → `/improve --performance --profile --threshold 90% --evidence`
- "Improve code quality" → `/improve --quality --iterate --threshold 95%`

### `/troubleshoot` - Professional Debugging
**Purpose:** Debug and fix issues systematically
**Common Flags:**
- `--investigate` - Systematic investigation
- `--five-whys` - Root cause analysis
- `--prod` - Production debugging
- `--perf` - Performance investigation
- `--fix` - Complete resolution
- `--hotfix` - Emergency fixes

**Natural Language Triggers:**
- "Debug this issue"
- "Fix production problem"
- "Troubleshoot performance"
- "Find root cause"

**Example Mappings:**
- "Debug production issue" → `/troubleshoot --prod --five-whys --seq`
- "Fix performance problem" → `/troubleshoot --perf --fix --pup`

### `/review` - Code Review
**Purpose:** Review code quality, standards, best practices
**Common Flags:**
- `--quality` - Quality assessment
- `--standards` - Coding standards
- `--security` - Security review
- `--performance` - Performance review
- `--best-practices` - Best practices check
- `--evidence` - Include evidence

**Natural Language Triggers:**
- "Review my code"
- "Check code quality"
- "Security review"
- "Code review"
- "Assess the implementation"

**Example Mappings:**
- "Security review of API" → `/review --security --api --evidence --persona-security`
- "Quality review" → `/review --quality --standards --best-practices --evidence`

### `/explain` - Technical Documentation
**Purpose:** Generate explanations and documentation
**Common Flags:**
- `--depth` - Complexity level (ELI5|beginner|intermediate|expert)
- `--visual` - Include diagrams
- `--examples` - Code examples
- `--api` - API documentation
- `--architecture` - System documentation
- `--tutorial` - Learning tutorials

**Natural Language Triggers:**
- "Explain this code"
- "Document the API"
- "Create tutorial"
- "Explain architecture"

**Example Mappings:**
- "Explain for beginners" → `/explain --depth beginner --examples --persona-mentor`
- "Document API" → `/explain --api --examples --c7`

## Operations Commands (6)

### `/deploy` - Application Deployment
**Purpose:** Deploy applications to various environments
**Common Flags:**
- `--env` - Target environment (dev|staging|prod)
- `--canary` - Canary deployment
- `--blue-green` - Blue-green deployment
- `--rollback` - Rollback capability
- `--monitor` - Post-deployment monitoring
- `--critical` - Critical deployment

**Natural Language Triggers:**
- "Deploy to production"
- "Deploy safely"
- "Release the application"
- "Production deployment"

**Example Mappings:**
- "Deploy to production safely" → `/deploy --env prod --critical --evidence --plan --monitor`

### `/migrate` - Database & Code Migration
**Purpose:** Migrate databases, code, or configurations
**Common Flags:**
- `--database` - Database migrations
- `--code` - Code migrations
- `--schema` - Schema migrations
- `--data` - Data migrations
- `--safe` - Safe migration
- `--rollback` - Rollback planning

**Natural Language Triggers:**
- "Migrate database"
- "Schema migration"
- "Data migration"
- "Update database"

**Example Mappings:**
- "Safe database migration" → `/migrate --database --safe --backup --evidence`

### `/scan` - Security & Validation
**Purpose:** Security audits and compliance checks
**Common Flags:**
- `--security` - Security scan
- `--owasp` - OWASP compliance
- `--deps` - Dependency scan
- `--secrets` - Secret detection
- `--compliance` - Compliance check
- `--quality` - Quality validation

**Natural Language Triggers:**
- "Security scan"
- "Check vulnerabilities"
- "Scan dependencies"
- "Security audit"

**Example Mappings:**
- "Security audit" → `/scan --security --owasp --deps --persona-security`
- "Check compliance" → `/scan --compliance --evidence`

### `/estimate` - Project Estimation
**Purpose:** Estimate time, resources, and complexity
**Common Flags:**
- `--detailed` - Comprehensive breakdown
- `--rough` - Quick estimation
- `--worst-case` - Pessimistic estimate
- `--agile` - Story point estimation
- `--complexity` - Technical assessment
- `--resources` - Resource planning

**Natural Language Triggers:**
- "Estimate project"
- "How long will it take"
- "Story points"
- "Resource estimation"

**Example Mappings:**
- "Detailed estimation" → `/estimate --detailed --complexity --risk`
- "Quick estimate" → `/estimate --rough --agile`

### `/cleanup` - Project Maintenance
**Purpose:** Clean up code, files, and dependencies
**Common Flags:**
- `--code` - Remove dead code
- `--files` - Clean build artifacts
- `--deps` - Remove unused dependencies
- `--git` - Clean git repository
- `--all` - Comprehensive cleanup
- `--aggressive` - Deep cleanup

**Natural Language Triggers:**
- "Clean up code"
- "Remove unused files"
- "Clean dependencies"
- "Project cleanup"

**Example Mappings:**
- "Clean everything" → `/cleanup --all --validate`
- "Remove dead code" → `/cleanup --code --deps`

### `/git` - Git Workflow Management
**Purpose:** Manage Git operations and workflows
**Common Flags:**
- `--status` - Repository status
- `--commit` - Create commit
- `--branch` - Branch management
- `--sync` - Remote synchronization
- `--checkpoint` - Create checkpoint
- `--merge` - Smart merge

**Natural Language Triggers:**
- "Git status"
- "Commit changes"
- "Create branch"
- "Sync with remote"

**Example Mappings:**
- "Create checkpoint" → `/git --checkpoint "before refactor"`
- "Commit with tests" → `/git --commit --validate --test`

## Design & Architecture Commands (4)

### `/design` - System Architecture
**Purpose:** Design systems, APIs, and architectures
**Common Flags:**
- `--api` - API design
- `--ddd` - Domain-driven design
- `--microservices` - Microservices architecture
- `--event-driven` - Event patterns
- `--scalable` - Scalability focus
- `--patterns` - Design patterns

**Natural Language Triggers:**
- "Design the system"
- "API design"
- "Architecture design"
- "System structure"

**Example Mappings:**
- "Design scalable API" → `/design --api --scalable --ddd --persona-architect`
- "Microservices design" → `/design --microservices --event-driven`

### `/spawn` - Parallel Task Execution
**Purpose:** Spawn specialized agents for tasks
**Common Flags:**
- `--task` - Define specific task
- `--parallel` - Concurrent execution
- `--specialized` - Domain expertise
- `--collaborative` - Multi-agent work
- `--sync` - Synchronize results

**Natural Language Triggers:**
- "Run parallel tasks"
- "Spawn agents"
- "Concurrent execution"
- "Multi-agent work"

**Example Mappings:**
- "Parallel testing" → `/spawn --task "frontend tests" --parallel`
- "Collaborative work" → `/spawn --collaborative --sync`

### `/document` - Documentation Creation
**Purpose:** Create comprehensive documentation
**Common Flags:**
- `--api` - API documentation
- `--user` - User documentation
- `--technical` - Technical documentation
- `--comprehensive` - Full documentation
- `--readme` - README files
- `--examples` - Include examples

**Natural Language Triggers:**
- "Create documentation"
- "Document the API"
- "Write user guide"
- "Technical docs"

**Example Mappings:**
- "API documentation" → `/document --api --comprehensive --examples`
- "User guide" → `/document --user --tutorial --persona-mentor`

### `/load` - Project Context Loading
**Purpose:** Load project context and configuration
**Common Flags:**
- `--context` - Load full context
- `--config` - Load configuration
- `--history` - Load history
- `--dependencies` - Load dependencies

**Natural Language Triggers:**
- "Load project"
- "Get context"
- "Load configuration"
- "Initialize project"

**Example Mappings:**
- "Load project context" → `/load --context --config`
- "Initialize workspace" → `/load --dependencies --history`

## Context-Aware Enhancements

### Technology Stack Detection
- **React/Vue/Angular** → Add `--frontend` flag
- **Node.js/Express/FastAPI** → Add `--backend` flag  
- **Database mentions** → Add `--database` flag
- **Docker/Kubernetes** → Add `--containerization` flag

### Environment Detection
- **Production/Live** → Add `--prod --critical` flags
- **Staging/Test** → Add `--staging --safe` flags
- **Development/Local** → Add `--dev --flexible` flags

### Urgency Detection
- **Emergency/Critical/Urgent** → Add `--critical --emergency` flags
- **ASAP/Now** → Add `--priority --immediate` flags
- **Quick/Fast** → Add `--quick --efficient` flags

## Universal Modifiers

These flags can be added to any command:

### Thinking Depth
- `--think` - Standard analysis
- `--think-hard` - Deep analysis
- `--ultrathink` - Maximum analysis

### MCP Servers
- `--c7` - Context7 documentation
- `--seq` - Sequential reasoning
- `--magic` - Magic UI components
- `--pup` - Puppeteer automation
- `--all-mcp` - All MCP servers

### Quality & Validation
- `--evidence` - Include evidence
- `--validate` - Validation checks
- `--strict` - Strict mode
- `--coverage` - Coverage analysis

### Execution Control
- `--plan` - Show plan first
- `--dry-run` - Preview only
- `--force` - Override checks
- `--interactive` - Step-by-step