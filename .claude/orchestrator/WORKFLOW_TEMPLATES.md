# SuperClaude Workflow Templates

## Overview
This file contains ready-made workflows for common development scenarios. Each workflow provides step-by-step SuperClaude commands with explanations, making complex tasks simple and repeatable.

## Table of Contents
1. [New Project Setup](#new-project-setup)
2. [Security-First Development](#security-first-development)
3. [Performance Optimization](#performance-optimization)
4. [Production Deployment](#production-deployment)
5. [Emergency Response](#emergency-response)
6. [Full-Stack Feature Development](#full-stack-feature-development)
7. [Code Review & Refactoring](#code-review--refactoring)
8. [Testing & QA](#testing--qa)
9. [API Development](#api-development)
10. [Database Operations](#database-operations)

---

## New Project Setup

### Scenario: Starting a new React + Node.js project with best practices

**Natural Language**: "Set up a new full-stack project with React and Node.js"

**Workflow**:

```bash
# Step 1: Design the architecture
/design --fullstack --scalable --persona-architect --seq
# → Creates system design with clear boundaries

# Step 2: Initialize the project structure
/build --init --fullstack --tdd
# → Sets up monorepo with frontend/backend/shared

# Step 3: Set up development environment
/dev-setup --install --ci --monitor --docker
# → Configures tools, CI/CD, and containers

# Step 4: Create initial security baseline
/scan --security --initial --deps
# → Establishes security standards

# Step 5: Document the setup
/document --setup --readme --evidence
# → Creates comprehensive documentation
```

**Expected Outcome**: Complete project structure with CI/CD, testing, and documentation

---

## Security-First Development

### Scenario: Building a secure authentication system

**Natural Language**: "Build a secure authentication system with JWT"

**Workflow**:

```bash
# Step 1: Security threat modeling
/design --auth --security --persona-security --think
# → Identifies threats and mitigation strategies

# Step 2: Implement secure backend
/build --api --auth --secure --persona-backend --evidence
# → Creates secure authentication endpoints

# Step 3: Security audit
/scan --security --owasp --auth --persona-security
# → Validates against security standards

# Step 4: Implement frontend with security
/build --react --auth --secure --persona-frontend --magic
# → Creates secure UI components

# Step 5: Penetration testing
/test --security --penetration --persona-security --seq
# → Tests for vulnerabilities

# Step 6: Document security measures
/document --security --auth --evidence
# → Documents security decisions
```

**Expected Outcome**: Secure authentication system with documented security measures

---

## Performance Optimization

### Scenario: Fixing performance issues in production

**Natural Language**: "Our production app is running slowly"

**Workflow**:

```bash
# Step 1: Performance analysis
/analyze --performance --prod --profile --persona-performance --seq
# → Identifies performance bottlenecks

# Step 2: Deep investigation
/troubleshoot --performance --five-whys --prod --persona-analyzer
# → Root cause analysis of slowness

# Step 3: Optimization planning
/plan --optimization --evidence --persona-performance
# → Creates optimization strategy

# Step 4: Implement optimizations
/improve --performance --cache --threshold 90% --evidence
# → Applies performance improvements

# Step 5: Load testing
/test --performance --load --benchmark --pup
# → Validates improvements under load

# Step 6: Production monitoring
/monitor --performance --alerts --prod
# → Sets up performance monitoring
```

**Expected Outcome**: Optimized application with 90%+ performance improvement

---

## Production Deployment

### Scenario: Safe production deployment with rollback capability

**Natural Language**: "Deploy new features to production safely"

**Workflow**:

```bash
# Step 1: Pre-deployment checks
/scan --production --validate --deps --security
# → Validates code and dependencies

# Step 2: Create deployment plan
/deploy --plan --prod --evidence --checkpoint
# → Documents deployment strategy

# Step 3: Run comprehensive tests
/test --full --e2e --coverage --strict --persona-qa
# → Ensures quality standards

# Step 4: Canary deployment
/deploy --prod --canary --monitor --rollback
# → Deploys to small user subset

# Step 5: Monitor canary
/monitor --prod --canary --alerts --realtime
# → Watches for issues

# Step 6: Full deployment or rollback
/deploy --prod --complete --monitor  # If successful
# OR
/deploy --rollback --prod --emergency  # If issues
```

**Expected Outcome**: Safe production deployment with monitoring and rollback options

---

## Emergency Response

### Scenario: Production system is down

**Natural Language**: "Production is down! Help!"

**Workflow**:

```bash
# Step 1: Emergency investigation
/troubleshoot --emergency --prod --all-personas --seq
# → Immediate root cause analysis

# Step 2: Quick diagnostics
/analyze --critical --logs --metrics --prod
# → Gathers all available data

# Step 3: Implement hotfix
/debug --emergency --fix --hotfix --force
# → Creates immediate fix

# Step 4: Emergency deployment
/deploy --prod --emergency --force --monitor
# → Deploys fix immediately

# Step 5: Verify fix
/test --smoke --prod --critical
# → Validates system recovery

# Step 6: Incident documentation
/document --incident --postmortem --evidence
# → Records incident details
```

**Expected Outcome**: System recovery with documented incident response

---

## Full-Stack Feature Development

### Scenario: Building a complete e-commerce shopping cart feature

**Natural Language**: "Build a shopping cart feature"

**Workflow**:

```bash
# Step 1: Feature design
/design --feature "shopping cart" --ddd --persona-architect
# → Domain-driven design approach

# Step 2: API development
/build --api --feature "cart endpoints" --tdd --persona-backend
# → Creates cart management API

# Step 3: Database design
/design --database --feature "cart schema" --scalable
# → Optimized data model

# Step 4: Frontend components
/build --react --feature "cart UI" --magic --persona-frontend
# → Interactive cart components

# Step 5: Integration testing
/test --integration --e2e --feature "cart flow" --pup
# → End-to-end cart testing

# Step 6: Performance optimization
/optimize --feature "cart" --performance --persona-performance
# → Ensures fast cart operations
```

**Expected Outcome**: Complete shopping cart with API, UI, and optimizations

---

## Code Review & Refactoring

### Scenario: Improving legacy codebase quality

**Natural Language**: "Review and improve our old codebase"

**Workflow**:

```bash
# Step 1: Initial assessment
/analyze --code --deep --legacy --persona-refactorer
# → Identifies improvement areas

# Step 2: Security review
/review --security --evidence --all --persona-security
# → Finds security issues

# Step 3: Quality review
/review --quality --standards --evidence --think
# → Assesses code quality

# Step 4: Refactoring plan
/plan --refactor --prioritize --evidence
# → Creates improvement roadmap

# Step 5: Incremental refactoring
/refactor --incremental --patterns --test --persona-refactorer
# → Applies improvements safely

# Step 6: Validation
/test --regression --coverage --strict
# → Ensures nothing broke
```

**Expected Outcome**: Cleaner, more maintainable codebase with tests

---

## Testing & QA

### Scenario: Setting up comprehensive testing strategy

**Natural Language**: "Set up complete testing for our application"

**Workflow**:

```bash
# Step 1: Test strategy design
/design --testing --comprehensive --persona-qa
# → Creates testing approach

# Step 2: Unit test implementation
/test --unit --coverage 80% --tdd
# → Builds unit test suite

# Step 3: Integration tests
/test --integration --api --database
# → Tests component interactions

# Step 4: E2E test automation
/test --e2e --automated --pup --persona-qa
# → Browser automation tests

# Step 5: Performance testing
/test --performance --load --stress
# → Load and stress tests

# Step 6: CI/CD integration
/dev-setup --ci --testing --automated
# → Integrates with pipeline
```

**Expected Outcome**: Complete testing pyramid with 80%+ coverage

---

## API Development

### Scenario: Building a RESTful API with documentation

**Natural Language**: "Create a REST API with documentation"

**Workflow**:

```bash
# Step 1: API design
/design --api --rest --openapi --persona-architect
# → OpenAPI specification

# Step 2: Implementation
/build --api --rest --tdd --persona-backend
# → TDD API development

# Step 3: Security hardening
/scan --api --security --owasp --persona-security
# → Security validation

# Step 4: Documentation
/document --api --openapi --examples --persona-mentor
# → Interactive API docs

# Step 5: Testing
/test --api --contract --integration
# → Contract testing

# Step 6: Performance tuning
/optimize --api --performance --cache
# → API optimization
```

**Expected Outcome**: Secure, documented, and performant REST API

---

## Database Operations

### Scenario: Database migration with zero downtime

**Natural Language**: "Migrate database without downtime"

**Workflow**:

```bash
# Step 1: Migration planning
/plan --migration --database --zero-downtime
# → Blue-green strategy

# Step 2: Backup creation
/backup --database --prod --verify --critical
# → Verified backups

# Step 3: Migration scripts
/migrate --database --scripts --validate
# → Safe migration scripts

# Step 4: Test migration
/test --migration --staging --complete
# → Full test run

# Step 5: Execute migration
/migrate --database --prod --monitor --rollback
# → Production migration

# Step 6: Verification
/test --database --integrity --prod
# → Data integrity checks
```

**Expected Outcome**: Successful migration with no data loss or downtime

---

## Quick Reference Card

### Common Patterns

**Start Safe, Scale Up**:
```bash
/command --dry-run           # Preview
/command --staging          # Test environment
/command --prod --monitor   # Production with monitoring
```

**Evidence-Based Development**:
```bash
/analyze --evidence         # Document findings
/design --evidence         # Document decisions
/deploy --evidence         # Document changes
```

**Progressive Enhancement**:
```bash
/build --feature           # Basic
/build --feature --tdd     # With tests
/build --feature --tdd --secure  # With security
```

**Emergency Escalation**:
```bash
/troubleshoot --investigate     # Start here
/troubleshoot --critical       # If serious
/troubleshoot --emergency      # If system down
```

## Customizing Workflows

These templates are starting points. Customize them by:

1. **Adding personas** for specialized expertise
2. **Including MCP servers** for enhanced capabilities
3. **Adjusting flags** based on your requirements
4. **Combining workflows** for complex scenarios

Remember: The orchestrator will optimize these commands based on your natural language input!