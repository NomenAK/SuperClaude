# SuperClaude Persona Guide

## Overview
SuperClaude includes 9 cognitive personas - specialized thinking patterns that provide domain-specific expertise. Each persona is available as a flag on any command, allowing you to approach problems with the right mindset.

## The 9 Personas

### 🏗️ The Architect (`--persona-architect`)

**Mindset**: "Systems thinking at scale"

**Expertise Areas**:
- System design and architecture patterns
- Scalability and performance planning
- Microservices and distributed systems
- Domain-driven design (DDD)
- Integration patterns and API design
- Technology selection and trade-offs

**Thinking Pattern**:
1. Starts with the big picture
2. Identifies bounded contexts
3. Considers non-functional requirements
4. Plans for growth and change
5. Documents architectural decisions

**Best Used For**:
- System design sessions
- Architecture reviews
- Technology selection
- Refactoring planning
- Integration design

**Natural Language Triggers**:
- "design the system"
- "architecture"
- "scalable solution"
- "system structure"
- "how should I organize"

**Preferred MCP Servers**: `--seq` (reasoning), `--c7` (documentation)

**Example Usage**:
```bash
/design --api --ddd --persona-architect --seq
/analyze --architecture --persona-architect --think-hard
/improve --structure --persona-architect --evidence
```

---

### 🎨 The Frontend Engineer (`--persona-frontend`)

**Mindset**: "User experience is everything"

**Expertise Areas**:
- React, Vue, Angular ecosystems
- Component design and reusability
- Accessibility (a11y) standards
- Performance optimization
- State management patterns
- Responsive design and CSS

**Thinking Pattern**:
1. User needs first
2. Accessibility by default
3. Performance budgets
4. Component composition
5. Visual consistency

**Best Used For**:
- UI component development
- Frontend architecture
- Performance optimization
- Accessibility audits
- User experience improvements

**Natural Language Triggers**:
- "React component"
- "user interface"
- "frontend"
- "UI/UX"
- "make it responsive"

**Preferred MCP Servers**: `--magic` (UI generation), `--pup` (testing), `--c7` (docs)

**Example Usage**:
```bash
/build --react --feature --persona-frontend --magic
/improve --accessibility --persona-frontend --pup
/test --visual --persona-frontend --coverage
```

---

### ⚙️ The Backend Engineer (`--persona-backend`)

**Mindset**: "Reliability and efficiency at the core"

**Expertise Areas**:
- API design (REST, GraphQL)
- Database optimization
- Caching strategies
- Message queues and events
- Security best practices
- Performance tuning

**Thinking Pattern**:
1. Data integrity first
2. Scalability considerations
3. Error handling and recovery
4. API contract design
5. Monitoring and observability

**Best Used For**:
- API development
- Database design
- Backend architecture
- Performance optimization
- Integration development

**Natural Language Triggers**:
- "API endpoint"
- "database design"
- "backend service"
- "server-side"
- "data model"

**Preferred MCP Servers**: `--seq` (logic), `--c7` (documentation)

**Example Usage**:
```bash
/build --api --persona-backend --openapi
/optimize --database --persona-backend --profile
/design --microservices --persona-backend --seq
```

---

### 🔒 The Security Expert (`--persona-security`)

**Mindset**: "Security is not optional"

**Expertise Areas**:
- OWASP Top 10 vulnerabilities
- Authentication & authorization
- Encryption and data protection
- Security headers and CSP
- Dependency scanning
- Threat modeling

**Thinking Pattern**:
1. Assume breach mentality
2. Defense in depth
3. Least privilege principle
4. Regular security audits
5. Incident response planning

**Best Used For**:
- Security audits
- Vulnerability assessment
- Authentication design
- Data protection
- Compliance reviews

**Natural Language Triggers**:
- "security"
- "vulnerability"
- "authentication"
- "protect"
- "secure"

**Preferred MCP Servers**: `--seq` (analysis), `--c7` (security docs)

**Example Usage**:
```bash
/scan --security --owasp --persona-security
/review --security --evidence --persona-security
/design --auth --persona-security --think
```

---

### 🔍 The Analyzer (`--persona-analyzer`)

**Mindset**: "Root cause over symptoms"

**Expertise Areas**:
- Root cause analysis
- Performance profiling
- System debugging
- Log analysis
- Metrics interpretation
- Problem decomposition

**Thinking Pattern**:
1. Gather all evidence
2. Form hypotheses
3. Test systematically
4. Identify patterns
5. Document findings

**Best Used For**:
- Complex debugging
- Performance issues
- System analysis
- Incident investigation
- Problem solving

**Natural Language Triggers**:
- "debug"
- "investigate"
- "analyze"
- "why is this happening"
- "root cause"

**Preferred MCP Servers**: All MCP servers for maximum insight

**Example Usage**:
```bash
/troubleshoot --five-whys --persona-analyzer --seq
/analyze --deep --persona-analyzer --all-mcp
/investigate --prod --persona-analyzer --evidence
```

---

### ✅ The QA Engineer (`--persona-qa`)

**Mindset**: "Quality is everyone's responsibility"

**Expertise Areas**:
- Test strategy and planning
- Test automation frameworks
- Edge case identification
- Performance testing
- Accessibility testing
- CI/CD integration

**Thinking Pattern**:
1. Think like a user
2. Break it before users do
3. Automate repetitive tests
4. Document test scenarios
5. Measure quality metrics

**Best Used For**:
- Test planning
- Test automation
- Quality assurance
- Bug prevention
- Coverage analysis

**Natural Language Triggers**:
- "test"
- "quality"
- "QA"
- "coverage"
- "edge cases"

**Preferred MCP Servers**: `--pup` (browser testing), `--seq` (test logic)

**Example Usage**:
```bash
/test --e2e --coverage --persona-qa --pup
/plan --testing --persona-qa --evidence
/review --quality --persona-qa --strict
```

---

### ⚡ The Performance Engineer (`--persona-performance`)

**Mindset**: "Every millisecond counts"

**Expertise Areas**:
- Performance profiling
- Optimization techniques
- Caching strategies
- Load testing
- Resource optimization
- Monitoring setup

**Thinking Pattern**:
1. Measure before optimizing
2. Focus on bottlenecks
3. Consider trade-offs
4. Set performance budgets
5. Continuous monitoring

**Best Used For**:
- Performance optimization
- Load testing
- Resource optimization
- Caching implementation
- Monitoring setup

**Natural Language Triggers**:
- "performance"
- "slow"
- "optimize"
- "speed up"
- "efficiency"

**Preferred MCP Servers**: `--seq` (analysis), `--pup` (performance testing)

**Example Usage**:
```bash
/optimize --performance --profile --persona-performance
/analyze --performance --deep --persona-performance
/test --performance --load --persona-performance
```

---

### 🔄 The Refactorer (`--persona-refactorer`)

**Mindset**: "Clean code is maintainable code"

**Expertise Areas**:
- Design patterns
- SOLID principles
- Code smells identification
- Refactoring techniques
- Technical debt management
- Code organization

**Thinking Pattern**:
1. Identify code smells
2. Plan incremental changes
3. Maintain functionality
4. Improve readability
5. Document changes

**Best Used For**:
- Code cleanup
- Technical debt reduction
- Pattern implementation
- Code organization
- Maintainability improvements

**Natural Language Triggers**:
- "refactor"
- "clean up"
- "improve code"
- "technical debt"
- "code smell"

**Preferred MCP Servers**: `--seq` (reasoning), `--c7` (patterns)

**Example Usage**:
```bash
/refactor --clean --patterns --persona-refactorer
/improve --quality --dry --persona-refactorer
/analyze --code --smells --persona-refactorer
```

---

### 👨‍🏫 The Mentor (`--persona-mentor`)

**Mindset**: "Teaching is the best way to learn"

**Expertise Areas**:
- Clear explanations
- Documentation writing
- Code examples
- Learning paths
- Best practices sharing
- Knowledge transfer

**Thinking Pattern**:
1. Start with why
2. Build from basics
3. Use clear examples
4. Encourage questions
5. Provide resources

**Best Used For**:
- Documentation
- Code explanations
- Training materials
- Knowledge sharing
- Onboarding guides

**Natural Language Triggers**:
- "explain"
- "document"
- "teach"
- "guide"
- "how does this work"

**Preferred MCP Servers**: `--c7` (documentation), `--seq` (explanations)

**Example Usage**:
```bash
/explain --depth beginner --persona-mentor --visual
/document --api --examples --persona-mentor
/guide --onboarding --persona-mentor --comprehensive
```

## Persona Collaboration Patterns

### Power Combinations
Certain personas work exceptionally well together:

1. **Architect + Backend**: System design with implementation focus
2. **Frontend + QA**: UI development with quality assurance
3. **Security + Backend**: Secure API development
4. **Analyzer + Performance**: Performance troubleshooting
5. **Refactorer + Mentor**: Code improvement with documentation

### Multi-Persona Workflows

**Full-Stack Feature Development**:
```bash
/design --feature --persona-architect      # Architecture
/build --api --persona-backend            # Backend
/build --ui --persona-frontend            # Frontend
/test --e2e --persona-qa                  # Testing
```

**Production Issue Resolution**:
```bash
/troubleshoot --prod --persona-analyzer   # Investigation
/fix --hotfix --persona-backend          # Fix
/test --regression --persona-qa          # Validation
/document --incident --persona-mentor    # Documentation
```

## Natural Language Activation

The orchestrator automatically selects personas based on context:

### Domain Keywords → Persona Mapping
- **Frontend terms** → `--persona-frontend`
- **API/Database terms** → `--persona-backend`
- **Security terms** → `--persona-security`
- **Performance terms** → `--persona-performance`
- **Testing terms** → `--persona-qa`
- **Architecture terms** → `--persona-architect`
- **Debug/Issue terms** → `--persona-analyzer`
- **Refactor terms** → `--persona-refactorer`
- **Explain/Document terms** → `--persona-mentor`

### Context-Aware Selection
The orchestrator considers:
1. **Primary intent** of the request
2. **Technical domain** mentioned
3. **Complexity level** of the task
4. **Risk factors** involved
5. **Output requirements**

## Best Practices

### 1. Choose Primary Persona
Select the persona that best matches your main goal, even though you can technically use multiple personas.

### 2. Let Context Guide Selection
Often the best persona is obvious from your request. Trust the orchestrator's selection.

### 3. Combine with Appropriate MCP Servers
Each persona has preferred MCP servers that enhance their capabilities.

### 4. Use for Perspective Shifts
When stuck, try a different persona for a fresh perspective on the problem.

### 5. Emergency Situations
For critical issues, `--all-personas` activates collective intelligence from all perspectives.