# SuperClaude Flag Combinations Guide

## Purpose
This file defines smart flag combination rules to optimize SuperClaude commands for maximum effectiveness while minimizing token usage and ensuring safety.

## Universal Flag Compatibility Matrix

### Thinking Depth Flags (Mutually Exclusive)
- `--think` → Standard analysis (~4K tokens)
- `--think-hard` → Deep analysis (~10K tokens)
- `--ultrathink` → Maximum analysis (~32K tokens)

**Rule**: Only use ONE thinking flag per command. Higher levels include lower level capabilities.

### MCP Server Combinations
| Flag | Compatible With | Conflicts With | Best For |
|------|----------------|----------------|----------|
| `--c7` | All flags | `--no-mcp`, `--no-c7` | Documentation lookup |
| `--seq` | All flags | `--no-mcp`, `--no-seq` | Complex reasoning |
| `--magic` | Frontend flags | `--no-mcp`, `--no-magic` | UI generation |
| `--pup` | Testing flags | `--no-mcp`, `--no-pup` | Browser automation |
| `--all-mcp` | None | All `--no-*` flags | Maximum capability |

## Optimal Flag Combinations by Intent

### Security-Focused Operations
```
BASE: --security --evidence
ADD FOR PRODUCTION: --critical --prod
ADD FOR ANALYSIS: --think --seq
ADD FOR AUDIT: --owasp --persona-security
```

**Examples:**
- Security review: `--security --evidence --think --persona-security`
- Production security audit: `--security --evidence --critical --prod --owasp --persona-security --seq`
- Quick security check: `--security --validate`

### Performance Optimization
```
BASE: --performance --profile
ADD FOR DEEP ANALYSIS: --think-hard --seq
ADD FOR PRODUCTION: --critical --monitor
ADD FOR OPTIMIZATION: --persona-performance --evidence
```

**Examples:**
- Performance analysis: `--performance --profile --think --seq`
- Production performance crisis: `--performance --critical --emergency --profile --persona-performance`
- Performance improvement: `--performance --optimize --threshold 95% --evidence`

### Development Operations
```
BASE: --tdd --test
ADD FOR FEATURES: --feature --evidence
ADD FOR REACT: --react --magic --frontend
ADD FOR API: --api --backend --scalable
```

**Examples:**
- React feature: `--react --feature --tdd --magic --frontend`
- API development: `--api --tdd --backend --openapi --seq`
- Full-stack: `--fullstack --tdd --evidence --c7`

### Production Deployments
```
BASE: --prod --evidence --plan
ADD FOR SAFETY: --validate --monitor
ADD FOR CRITICAL: --critical --checkpoint
ADD FOR ROLLBACK: --rollback --backup
```

**Examples:**
- Safe deployment: `--prod --evidence --plan --validate --monitor`
- Emergency deployment: `--prod --critical --emergency --force`
- Canary deployment: `--prod --canary --monitor --rollback`

## Conflict Resolution Rules

### Flag Conflicts to Avoid
1. **Never combine:**
   - `--all-mcp` with any `--no-*` flag
   - Multiple thinking depth flags
   - `--force` with `--dry-run`
   - `--aggressive` with `--conservative`

2. **Redundant combinations (avoid):**
   - `--all-mcp --c7` (all-mcp includes c7)
   - `--critical --prod --validate` (critical implies validation)
   - `--evidence --dry-run` (dry-run shows evidence)

### Smart Flag Inheritance
When certain flags are used, others are automatically implied:

- `--critical` implies → `--evidence --validate --monitor`
- `--prod` implies → `--validate --plan`
- `--emergency` implies → `--critical --force --all-personas`
- `--tdd` implies → `--test --coverage`

## Performance vs Quality Trade-offs

### Maximum Performance (Speed)
```
Flags: --quick --no-mcp --surface
Token Usage: ~1-2K
Use When: Quick checks, simple operations
```

### Balanced Approach (Default)
```
Flags: --think --evidence
Token Usage: ~4-6K
Use When: Most development tasks
```

### Maximum Quality (Thoroughness)
```
Flags: --ultrathink --all-mcp --evidence --strict
Token Usage: ~20-32K
Use When: Critical decisions, architecture design
```

## Environment-Specific Flag Sets

### Development Environment
```
Default: --dev --flexible --verbose
Personas: Any
MCP: As needed
Safety: Minimal
```

### Staging Environment
```
Default: --staging --safe --validate --plan
Personas: --persona-qa preferred
MCP: --seq --pup for testing
Safety: Moderate
```

### Production Environment
```
Default: --prod --critical --evidence --monitor --plan
Personas: --persona-security mandatory for changes
MCP: --seq for reasoning
Safety: Maximum
```

## Emergency/Critical Situation Flags

### System Down
```
/troubleshoot --emergency --critical --prod --all-personas --seq --force
```

### Security Breach
```
/scan --emergency --critical --security --owasp --all-mcp --persona-security
```

### Performance Crisis
```
/optimize --emergency --critical --performance --profile --force --persona-performance
```

### Data Loss Risk
```
/backup --emergency --critical --all --verify --force
```

## Token Optimization Strategies

### When to Use `--uc` (UltraCompressed Mode)
- Large codebase analysis
- Multiple file operations
- Long-running workflows
- Token budget constraints

### Token-Efficient Flag Combinations
1. **Minimal**: `--uc --no-mcp --quick`
2. **Balanced**: `--uc --think`
3. **Comprehensive**: `--uc --think-hard --seq`

### Avoid Token Waste
- Don't use `--all-mcp` unless needed
- Skip `--evidence` for simple queries
- Use `--surface` before `--deep`
- Leverage `--uc` for large operations

## Best Practices

### 1. Start Simple, Add Complexity
```
First: /analyze --code
Then: /analyze --code --think
Finally: /analyze --code --think-hard --seq --evidence
```

### 2. Match Flags to Task Criticality
- **Low Risk**: Minimal flags
- **Medium Risk**: Add `--validate --plan`
- **High Risk**: Add `--evidence --critical --monitor`

### 3. Persona + MCP Synergy
- `--persona-architect` + `--seq` = Better system design
- `--persona-frontend` + `--magic` = Enhanced UI generation
- `--persona-qa` + `--pup` = Comprehensive testing
- `--persona-security` + `--c7` = Thorough security analysis

### 4. Progressive Enhancement Pattern
```
/command                     # Try without flags
/command --think            # Add analysis if needed
/command --think --seq      # Add reasoning if complex
/command --think --seq --evidence  # Add proof if critical
```

## Flag Combination Templates

### Quick Templates for Common Tasks
```bash
# Code Review
BASIC: --review --quality
THOROUGH: --review --quality --evidence --think --seq
SECURITY: --review --security --evidence --persona-security --owasp

# Feature Development  
SIMPLE: --build --feature
REACT: --build --react --feature --tdd --magic --frontend
API: --build --api --feature --tdd --openapi --backend

# Debugging
QUICK: --troubleshoot --investigate
SYSTEMATIC: --troubleshoot --five-whys --think --seq
PRODUCTION: --troubleshoot --prod --critical --five-whys --all-personas

# Deployment
SAFE: --deploy --staging --plan --validate
PRODUCTION: --deploy --prod --critical --evidence --monitor --plan
EMERGENCY: --deploy --prod --emergency --force --monitor
```

## Dynamic Flag Selection Logic

The orchestrator should select flags based on:

1. **Keywords in request** → Map to specific flags
2. **Context detection** → Add environment flags
3. **Risk assessment** → Add safety flags
4. **Complexity analysis** → Add thinking flags
5. **Domain detection** → Add persona flags

This ensures optimal flag combinations for every request while maintaining safety and efficiency.