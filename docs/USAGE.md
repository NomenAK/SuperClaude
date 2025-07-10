# SuperAugment Usage Guide

This guide explains how to use SuperAugment MCP server with VS Code Augment.

## Quick Start

1. **Install SuperAugment**
   ```bash
   ./scripts/install-mcp.sh
   ```

2. **Restart VS Code**

3. **Open Augment Plugin** and start using SuperAugment tools

## Available Tools

### Code Analysis Tools

#### `analyze_code`
Analyze code for quality, patterns, and improvements.

**Parameters:**
- `code` (string): Code content to analyze
- `files` (array): File paths to analyze
- `persona` (string): Cognitive persona (architect, analyzer, refactorer, mentor)
- `depth` (string): Analysis depth (basic, detailed, comprehensive)
- `focus` (array): Areas to focus on
- `language` (string): Programming language

**Example:**
```typescript
await mcpClient.callTool("analyze_code", {
  code: "function example() { return 'hello'; }",
  persona: "architect",
  depth: "comprehensive",
  focus: ["performance", "maintainability"]
});
```

#### `review_code`
Perform comprehensive code reviews.

**Parameters:**
- `pullRequest` (number): PR number to review
- `files` (array): Specific files to review
- `diff` (string): Code diff to review
- `persona` (string): Review persona (qa, security, refactorer, mentor)
- `criteria` (array): Review criteria
- `severity` (string): Review severity (low, medium, high)

**Example:**
```typescript
await mcpClient.callTool("review_code", {
  diff: "...",
  persona: "security",
  criteria: ["security", "performance"],
  severity: "high"
});
```

#### `security_scan`
Perform security vulnerability scans.

**Parameters:**
- `target` (string): Target to scan (required)
- `scanType` (string): Scan type (static, dynamic, dependency, comprehensive)
- `persona` (string): Security persona
- `depth` (string): Scan depth (basic, standard, deep)
- `frameworks` (array): Frameworks to consider

**Example:**
```typescript
await mcpClient.callTool("security_scan", {
  target: "src/",
  scanType: "comprehensive",
  depth: "deep"
});
```

### Build and Deployment Tools

#### `build_project`
Build projects with intelligent configuration.

**Parameters:**
- `type` (string): Project type (react, node, python, rust, go, java)
- `features` (array): Features to include
- `persona` (string): Build persona (frontend, backend, architect)
- `environment` (string): Build environment
- `optimization` (boolean): Enable optimizations
- `target` (string): Build target directory

**Example:**
```typescript
await mcpClient.callTool("build_project", {
  type: "react",
  features: ["typescript", "testing", "docker"],
  persona: "frontend",
  environment: "production",
  optimization: true
});
```

#### `test_project`
Run comprehensive tests with persona-driven strategies.

**Parameters:**
- `type` (string): Test type (unit, integration, e2e, performance, security)
- `coverage` (boolean): Generate coverage report
- `files` (array): Files to test
- `persona` (string): Testing persona (qa, security, performance)
- `framework` (string): Testing framework
- `parallel` (boolean): Run tests in parallel

**Example:**
```typescript
await mcpClient.callTool("test_project", {
  type: "unit",
  coverage: true,
  persona: "qa",
  parallel: true
});
```

#### `deploy_application`
Deploy applications with intelligent strategies.

**Parameters:**
- `environment` (string): Target environment (development, staging, production)
- `strategy` (string): Deployment strategy (blue-green, rolling, canary, recreate)
- `platform` (string): Target platform (aws, gcp, azure, docker, kubernetes)
- `persona` (string): Deployment persona (architect, backend, security)
- `dryRun` (boolean): Perform dry run
- `rollback` (boolean): Rollback to previous version

**Example:**
```typescript
await mcpClient.callTool("deploy_application", {
  environment: "production",
  strategy: "blue-green",
  platform: "kubernetes",
  persona: "architect",
  dryRun: false
});
```

## Cognitive Personas

SuperAugment provides 9 specialized cognitive personas:

### `architect`
- **Focus**: System design, scalability, architectural patterns
- **Best for**: Architecture decisions, system design, scalability planning
- **Expertise**: Microservices, DDD, event-driven architecture

### `frontend`
- **Focus**: User experience, performance, modern web technologies
- **Best for**: UI/UX development, frontend optimization, accessibility
- **Expertise**: React/Vue/Angular, TypeScript, responsive design

### `backend`
- **Focus**: Server-side development, APIs, data management
- **Best for**: API design, database optimization, server architecture
- **Expertise**: API design, caching, microservices, performance

### `security`
- **Focus**: Application security, vulnerability assessment
- **Best for**: Security reviews, vulnerability scanning, secure coding
- **Expertise**: OWASP Top 10, penetration testing, cryptography

### `qa`
- **Focus**: Testing strategies, automation, quality metrics
- **Best for**: Test planning, quality assurance, automation
- **Expertise**: Test automation, quality metrics, CI/CD testing

### `performance`
- **Focus**: Speed, efficiency, resource utilization
- **Best for**: Performance optimization, profiling, monitoring
- **Expertise**: Performance profiling, caching, load testing

### `analyzer`
- **Focus**: Problem-solving, debugging, investigation
- **Best for**: Root cause analysis, debugging, troubleshooting
- **Expertise**: Root cause analysis, log analysis, monitoring

### `refactorer`
- **Focus**: Code quality, technical debt, maintainability
- **Best for**: Code improvement, refactoring, modernization
- **Expertise**: Code refactoring, design patterns, clean code

### `mentor`
- **Focus**: Knowledge sharing, best practices, education
- **Best for**: Learning, documentation, best practices
- **Expertise**: Best practices, technical writing, mentoring

## Resources

SuperAugment provides several resources accessible via MCP:

### Configuration Resources
- `superaugment://config/personas` - Available cognitive personas
- `superaugment://config/tools` - Tool configurations
- `superaugment://config/settings` - Global settings

### Pattern Resources
- `superaugment://patterns/development` - Development patterns
- `superaugment://patterns/architecture` - Architecture patterns
- `superaugment://patterns/security` - Security patterns
- `superaugment://patterns/testing` - Testing patterns

### Documentation Resources
- `superaugment://docs/tool-examples` - Tool usage examples
- `superaugment://docs/persona-guide` - Persona usage guide
- `superaugment://docs/best-practices` - Best practices

## Prompts

SuperAugment includes pre-configured prompts:

### Development Prompts
- `code-review` - Generate code review prompts
- `architecture-design` - Generate architecture design prompts

### Analysis Prompts
- `security-analysis` - Generate security analysis prompts
- `performance-analysis` - Generate performance analysis prompts

### Persona Prompts
- `persona-{name}` - Generate prompts using specific personas

## Best Practices

1. **Choose the Right Persona**
   - Use `architect` for system design decisions
   - Use `security` for security-focused analysis
   - Use `qa` for testing and quality assurance

2. **Combine Tools Effectively**
   - Start with `analyze_code` to understand the codebase
   - Use `security_scan` for vulnerability assessment
   - Follow with `build_project` for implementation

3. **Leverage Resources**
   - Access pattern resources for best practices
   - Use documentation resources for guidance
   - Reference configuration for tool parameters

4. **Use Appropriate Depth**
   - Use `basic` for quick analysis
   - Use `detailed` for standard analysis
   - Use `comprehensive` for thorough analysis

## Troubleshooting

### Common Issues

1. **Tool not found**
   - Ensure SuperAugment is properly installed
   - Check MCP configuration in VS Code settings

2. **Permission errors**
   - Check file permissions in installation directory
   - Ensure Node.js has proper permissions

3. **Build failures**
   - Verify Node.js version (18+ required)
   - Check npm dependencies are installed

### Getting Help

- Check the [GitHub repository](https://github.com/oktetopython/SuperAugment)
- Review the configuration files in `config/`
- Check logs in the `logs/` directory
